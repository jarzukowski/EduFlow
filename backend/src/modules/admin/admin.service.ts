import  { Prisma } from '../../../generated/client';

import { AppError } from '../../common/errors/AppError';
import { db } from '../../db/client';
import { messagesService } from '../messages/messages.service';

import {
    mapCourseToAdminCourseDTO,
    mapUserToAdminUserDTO,
} from './admin.mapper';

import type {
    AdminActor,
    AdminCourseDTO,
    AdminMessageActor,
    AdminMessageRole,
    AdminStatsDTO,
    AdminUserDTO,
    ChangeUserRoleResponseDTO,
    CoursesQuery,
    ForceLogoutUserResponseDTO,
    PaginatedDTO,
    SendAdminMessagePayload,
    SendAdminMessageResponseDTO,
    SendAdminNotificationPayload,
    SendAdminNotificationResponseDTO,
    UsersQuery,
} from './admin.types';
import {UserRole} from "../auth/auth.types";

const ADMIN_MESSAGE_MAX_RECIPIENTS = 500;
const ADMIN_MESSAGE_BATCH_SIZE = 20;
const MESSAGE_RECIPIENT_ROLES: readonly UserRole[] = ['STUDENT', 'TEACHER'];

const chunkItems = <T>(items: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];

    for (let startIndex = 0; startIndex < items.length; startIndex += chunkSize) {
        chunks.push(items.slice(startIndex, startIndex + chunkSize));
    }

    return chunks;
};

const normalizeInternalHref = (value: string | undefined): string | null => {
    if (!value) {
        return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
};

export class AdminService {
    private getUserById = async (userId: string): Promise<{
        id: string;
        role: UserRole;
        isActive: boolean;
        email: string;
    } | null> =>
        db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                isActive: true,
                email: true,
            },
        });

    private assertAdminIdentityOrThrow = async (
        adminId: string,
    ): Promise<{ id: string; email: string }> => {
        const adminUser = await this.getUserById(adminId);

        if (!adminUser) {
            throw new AppError('USER_NOT_FOUND', 404, 'User not found');
        }

        if (adminUser.role !== 'ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Forbidden');
        }

        return {
            id: adminUser.id,
            email: adminUser.email,
        };
    };

    private assertActiveNonAdminRecipientOrThrow = async (
        userId: string,
    ): Promise<{ id: string; role: UserRole }> => {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                isActive: true,
            },
        });

        if (!user || user.isActive === false) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        if (user.role === 'ADMIN') {
            throw new AppError('BAD_REQUEST', 400, 'Cannot send admin message to ADMIN');
        }

        return {
            id: user.id,
            role: user.role,
        };
    };

    private buildUsersWhereClause = (query: UsersQuery): Prisma.UserWhereInput => ({
        ...(query.search
            ? {
                OR: [
                    {
                        email: {
                            contains: query.search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        username: {
                            contains: query.search,
                            mode: 'insensitive',
                        },
                    },
                ],
            }
            : {}),
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { isActive: query.status === 'ACTIVE' } : {}),
        ...(query.lastLoginFrom || query.lastLoginTo
            ? {
                lastLoginAt: {
                    ...(query.lastLoginFrom ? { gte: query.lastLoginFrom } : {}),
                    ...(query.lastLoginTo ? { lte: query.lastLoginTo } : {}),
                },
            }
            : {}),
    });

    private buildCoursesWhereClause = (
        query: CoursesQuery,
    ): Prisma.CourseWhereInput | undefined => {
        if (!query.search) {
            return undefined;
        }

        return {
            title: {
                contains: query.search,
                mode: 'insensitive',
            },
        };
    };

    private getRoleRecipientIds = async (role: AdminMessageRole): Promise<string[]> => {
        const users = await db.user.findMany({
            where: {
                isActive: true,
                role,
            },
            select: {
                id: true,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: ADMIN_MESSAGE_MAX_RECIPIENTS + 1,
        });

        if (users.length > ADMIN_MESSAGE_MAX_RECIPIENTS) {
            throw new AppError('BAD_REQUEST', 400, 'Too many recipients');
        }

        return users.map((user) => user.id);
    };

    private getAllMessageRecipientIds = async (): Promise<string[]> => {
        const users = await db.user.findMany({
            where: {
                isActive: true,
                role: {
                    in: [...MESSAGE_RECIPIENT_ROLES],
                },
            },
            select: {
                id: true,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: ADMIN_MESSAGE_MAX_RECIPIENTS + 1,
        });

        if (users.length > ADMIN_MESSAGE_MAX_RECIPIENTS) {
            throw new AppError('BAD_REQUEST', 400, 'Too many recipients');
        }

        return users.map((user) => user.id);
    };

    private resolveAdminMessageRecipientIds = async (
        payload: SendAdminMessagePayload,
    ): Promise<string[]> => {
        if (payload.target === 'ALL') {
            return this.getAllMessageRecipientIds();
        }

        if (payload.target === 'USER') {
            const user = await this.assertActiveNonAdminRecipientOrThrow(payload.userId);
            return [user.id];
        }

        if (payload.mode === 'USER') {
            const user = await this.assertActiveNonAdminRecipientOrThrow(payload.userId);

            if (user.role !== payload.role) {
                throw new AppError('BAD_REQUEST', 400, 'User role does not match selected role');
            }

            return [user.id];
        }

        return this.getRoleRecipientIds(payload.role);
    };

    getAdminIdentity = async (adminId: string): Promise<{ id: string; email: string }> =>
        this.assertAdminIdentityOrThrow(adminId);

    getStats = async (): Promise<AdminStatsDTO> => {
        const [totalUsers, totalCourses] = await Promise.all([
            db.user.count(),
            db.course.count(),
        ]);

        return {
            totalUsers,
            totalCourses,
        };
    };

    getUsers = async (query: UsersQuery): Promise<PaginatedDTO<AdminUserDTO>> => {
        const whereClause = this.buildUsersWhereClause(query);

        const [total, users] = await Promise.all([
            db.user.count({ where: whereClause }),
            db.user.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: query.skip,
                take: query.limit,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
        ]);

        return {
            items: users.map(mapUserToAdminUserDTO),
            total,
            page: query.page,
            limit: query.limit,
        };
    };

    getCourses = async (query: CoursesQuery): Promise<PaginatedDTO<AdminCourseDTO>> => {
        const whereClause = this.buildCoursesWhereClause(query);

        const [total, courses] = await Promise.all([
            db.course.count({ where: whereClause }),
            db.course.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: query.skip,
                take: query.limit,
                select: {
                    id: true,
                    title: true,
                    ownerId: true,
                    createdAt: true,
                    updatedAt: true,
                    owner: {
                        select: {
                            email: true,
                        },
                    },
                },
            }),
        ]);

        return {
            items: courses.map(mapCourseToAdminCourseDTO),
            total,
            page: query.page,
            limit: query.limit,
        };
    };

    changeUserRole = async (
        userId: string,
        newRole: UserRole,
    ): Promise<ChangeUserRoleResponseDTO> => {
        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        if (!targetUser) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        if (targetUser.role === newRole) {
            return {
                user: mapUserToAdminUserDTO(targetUser),
            };
        }

        if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
            const adminUsersCount = await db.user.count({
                where: { role: 'ADMIN' },
            });

            if (adminUsersCount <= 1) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    'Cannot change role of the last admin',
                );
            }
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        return {
            user: mapUserToAdminUserDTO(updatedUser),
        };
    };

    forceLogoutUser = async (
        userId: string,
    ): Promise<ForceLogoutUserResponseDTO> => {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        const now = new Date();

        const revokeResult = await db.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: { gt: now },
            },
            data: {
                revokedAt: now,
                lastUsedAt: now,
            },
        });

        return {
            revokedCount: revokeResult.count,
        };
    };

    sendAdminMessage = async (
        payload: SendAdminMessagePayload,
        actor: AdminMessageActor,
    ): Promise<SendAdminMessageResponseDTO> => {
        const recipientUserIds = await this.resolveAdminMessageRecipientIds(payload);
        const filteredRecipientUserIds = recipientUserIds.filter(
            (recipientUserId) => recipientUserId !== actor.byAdminId,
        );

        if (filteredRecipientUserIds.length === 0) {
            return { sentCount: 0 };
        }

        let singleConversationId: string | undefined;

        const recipientBatches = chunkItems(
            filteredRecipientUserIds,
            ADMIN_MESSAGE_BATCH_SIZE,
        );

        for (const recipientBatch of recipientBatches) {
            await Promise.all(
                recipientBatch.map(async (recipientUserId) => {
                    const { conversationId } =
                        await messagesService.startAdminConversation(
                            { id: actor.byAdminId, role: 'ADMIN' },
                            { userId: recipientUserId },
                        );

                    if (filteredRecipientUserIds.length === 1) {
                        singleConversationId = conversationId;
                    }

                    await messagesService.sendMessage(
                        conversationId,
                        { id: actor.byAdminId, role: 'ADMIN' },
                        { body: payload.body },
                    );
                }),
            );
        }

        return {
            sentCount: filteredRecipientUserIds.length,
            ...(singleConversationId ? { conversationId: singleConversationId } : {}),
        };
    };

    sendAdminNotification = async (
        payload: SendAdminNotificationPayload,
        actor: AdminActor,
    ): Promise<SendAdminNotificationResponseDTO> => {
        const normalizedHref = normalizeInternalHref(payload.href);

        const notificationPayload = {
            title: payload.title,
            body: payload.message,
            href: normalizedHref,
            byAdminId: actor.byAdminId,
            byAdminEmail: actor.byAdminEmail,
        };

        if (payload.target === 'USER') {
            const user = await db.user.findUnique({
                where: { id: payload.userId },
                select: {
                    id: true,
                    isActive: true,
                },
            });

            if (!user || user.isActive === false) {
                throw new AppError('NOT_FOUND', 404, 'User not found');
            }

            await db.notification.create({
                data: {
                    userId: user.id,
                    type: 'ADMIN_BROADCAST',
                    payload: notificationPayload,
                },
                select: {
                    id: true,
                },
            });

            return { createdCount: 1 };
        }

        const userWhereClause: Prisma.UserWhereInput =
            payload.target === 'ROLE'
                ? {
                    isActive: true,
                    role: payload.role,
                }
                : {
                    isActive: true,
                };

        const users = await db.user.findMany({
            where: userWhereClause,
            select: {
                id: true,
            },
        });

        if (users.length === 0) {
            return { createdCount: 0 };
        }

        const createManyResult = await db.notification.createMany({
            data: users.map((user) => ({
                userId: user.id,
                type: 'ADMIN_BROADCAST',
                payload: notificationPayload,
            })),
        });

        return {
            createdCount: createManyResult.count,
        };
    };
}

export const adminService = new AdminService();