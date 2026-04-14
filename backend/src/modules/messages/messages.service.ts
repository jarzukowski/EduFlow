import { AppError } from '../../common/errors/AppError';
import { db } from '../../db/client';

import { notificationsService } from '../notifications/notifications.service';

import { mapConversationToDTO, mapInboxRowToDTO } from './messages.mapper';

import type { UserRole } from '../auth/auth.types';
import type {
    MessageReceivedPayload,
} from '../notifications/notifications.types';
import type {
    ConversationDTO,
    GetInboxQuery,
    InboxResponseDTO,
    SendMessageDto,
    StartAdminConversationDto,
    StartConversationDto,
    StartConversationResponseDTO,
} from './messages.types';
import type { ConversationWithIncludes } from './messages.mapper';

type AuthenticatedUser = {
    id: string;
    role: UserRole;
};

class MessagesService {
    public async getInbox(
        user: AuthenticatedUser,
        query: GetInboxQuery,
    ): Promise<InboxResponseDTO> {
        const participantRows = await db.conversationParticipant.findMany({
            where: {
                userId: user.id,
            },
            select: {
                conversationId: true,
            },
        });

        const conversationIds = participantRows.map(
            (participantRow) => participantRow.conversationId,
        );

        if (conversationIds.length === 0) {
            return {
                items: [],
                unreadCount: 0,
                nextCursor: null,
            };
        }

        const take = query.unreadOnly
            ? Math.min(60, query.limit * 3 + 1)
            : query.limit + 1;

        const conversations = await db.conversation.findMany({
            where: {
                id: {
                    in: conversationIds,
                },
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        ownerId: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { updatedAt: 'desc' },
                { id: 'desc' },
            ],
            take,
            ...(query.cursor
                ? {
                    cursor: { id: query.cursor },
                    skip: 1,
                }
                : {}),
        });

        const visibleConversations =
            user.role === 'TEACHER'
                ? conversations.filter(
                    (conversation) =>
                        !conversation.courseId ||
                        conversation.course?.ownerId === user.id,
                )
                : conversations;

        if (visibleConversations.length === 0) {
            return {
                items: [],
                unreadCount: 0,
                nextCursor: null,
            };
        }

        const readStates = await db.conversationReadState.findMany({
            where: {
                userId: user.id,
            },
            select: {
                conversationId: true,
                lastReadAt: true,
            },
        });

        const lastReadAtByConversationId = new Map<string, Date>(
            readStates.map((readState) => [
                readState.conversationId,
                readState.lastReadAt,
            ]),
        );

        const inboxItems = await Promise.all(
            visibleConversations.map(async (conversation) => {
                const lastMessage = await db.message.findFirst({
                    where: {
                        conversationId: conversation.id,
                    },
                    orderBy: [
                        { createdAt: 'desc' },
                        { id: 'desc' },
                    ],
                });

                const lastReadAt = lastReadAtByConversationId.get(conversation.id);

                const unreadCount = await db.message.count({
                    where: {
                        conversationId: conversation.id,
                        ...(lastReadAt
                            ? {
                                createdAt: {
                                    gt: lastReadAt,
                                },
                            }
                            : {}),
                        senderId: {
                            not: user.id,
                        },
                    },
                });

                return mapInboxRowToDTO({
                    conversation,
                    lastMessage,
                    unreadCount,
                    viewerUserId: user.id,
                });
            }),
        );

        const globalUnreadCount = inboxItems.reduce(
            (sum, inboxItem) => sum + inboxItem.unreadCount,
            0,
        );

        const filteredInboxItems = query.unreadOnly
            ? inboxItems.filter((inboxItem) => inboxItem.unreadCount > 0)
            : inboxItems;

        const pageItems = filteredInboxItems.slice(0, query.limit);
        const hasNextPage = filteredInboxItems.length > query.limit;
        const nextCursor = hasNextPage
            ? pageItems[pageItems.length - 1]?.conversationId ?? null
            : null;

        return {
            items: pageItems,
            unreadCount: globalUnreadCount,
            nextCursor,
        };
    }

    public async getConversation(
        conversationId: string,
        user: AuthenticatedUser,
    ): Promise<ConversationDTO> {
        const conversation = await this.assertConversationAccessOrThrow(
            conversationId,
            user,
        );

        const messages = await db.message.findMany({
            where: {
                conversationId,
            },
            orderBy: [
                { createdAt: 'asc' },
                { id: 'asc' },
            ],
            take: 200,
        });

        await this.upsertReadState(conversationId, user.id, this.now());

        return mapConversationToDTO(conversation, messages, user.id);
    }

    public async markRead(
        conversationId: string,
        user: AuthenticatedUser,
    ): Promise<void> {
        await this.assertConversationAccessOrThrow(conversationId, user);
        await this.upsertReadState(conversationId, user.id, this.now());
    }

    public async startConversation(
        user: AuthenticatedUser,
        dto: StartConversationDto,
    ): Promise<StartConversationResponseDTO> {
        const course = await db.course.findUnique({
            where: {
                id: dto.courseId,
            },
            select: {
                id: true,
                ownerId: true,
            },
        });

        if (!course) {
            throw new AppError('NOT_FOUND', 404, 'Course not found');
        }

        let teacherId: string;
        let studentId: string;

        if (user.role === 'STUDENT') {
            teacherId = course.ownerId;
            studentId = user.id;

            await this.assertEnrollmentOrThrow(dto.courseId, studentId);
        } else {
            const studentIdFromDto = dto.studentId;

            if (!studentIdFromDto) {
                throw new AppError(
                    'BAD_REQUEST',
                    400,
                    'studentId is required for teacher/admin',
                );
            }

            if (user.role === 'TEACHER' && course.ownerId !== user.id) {
                throw new AppError(
                    'FORBIDDEN',
                    403,
                    'Teacher can start conversations only for own courses',
                );
            }

            teacherId = course.ownerId;
            studentId = studentIdFromDto;

            await this.assertEnrollmentOrThrow(dto.courseId, studentId);
        }

        const existingConversation = await db.conversation.findUnique({
            where: {
                courseId_teacherId_studentId: {
                    courseId: dto.courseId,
                    teacherId,
                    studentId,
                },
            },
            select: {
                id: true,
            },
        });

        if (existingConversation) {
            await this.ensureParticipants(existingConversation.id, [
                teacherId,
                studentId,
            ]);

            return {
                conversationId: existingConversation.id,
            };
        }

        const createdConversation = await db.conversation.create({
            data: {
                courseId: dto.courseId,
                teacherId,
                studentId,
            },
            select: {
                id: true,
            },
        });

        await this.ensureParticipants(createdConversation.id, [
            teacherId,
            studentId,
        ]);

        return {
            conversationId: createdConversation.id,
        };
    }

    public async startAdminConversation(
        user: AuthenticatedUser,
        dto: StartAdminConversationDto,
    ): Promise<StartConversationResponseDTO> {
        if (user.role !== 'ADMIN') {
            throw new AppError(
                'FORBIDDEN',
                403,
                'Only admin can start admin conversations',
            );
        }

        const targetUser = await db.user.findUnique({
            where: {
                id: dto.userId,
            },
            select: {
                id: true,
            },
        });

        if (!targetUser) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        const existingDirectMessageConversationId =
            await this.findExistingAdminDirectMessageConversationId(
                user.id,
                dto.userId,
            );

        if (existingDirectMessageConversationId) {
            await this.ensureParticipants(
                existingDirectMessageConversationId,
                [user.id, dto.userId],
            );

            return {
                conversationId: existingDirectMessageConversationId,
            };
        }

        const createdConversation = await db.conversation.create({
            data: {
                courseId: null,
                teacherId: null,
                studentId: null,
                participants: {
                    create: [
                        { userId: user.id },
                        { userId: dto.userId },
                    ],
                },
            },
            select: {
                id: true,
            },
        });

        return {
            conversationId: createdConversation.id,
        };
    }

    public async sendMessage(
        conversationId: string,
        user: AuthenticatedUser,
        dto: SendMessageDto,
    ): Promise<void> {
        const conversation = await this.assertConversationAccessOrThrow(
            conversationId,
            user,
        );

        const createdMessage = await db.message.create({
            data: {
                conversationId,
                senderId: user.id,
                body: dto.body,
            },
            select: {
                id: true,
                body: true,
            },
        });

        await db.conversation.update({
            where: {
                id: conversationId,
            },
            data: {
                updatedAt: this.now(),
            },
        });

        const sender = await db.user.findUnique({
            where: {
                id: user.id,
            },
            select: {
                email: true,
            },
        });

        const senderEmail = sender?.email ?? 'unknown';

        const recipientUserIds = conversation.participants
            .map((participant) => participant.user.id)
            .filter((participantUserId) => participantUserId !== user.id);

        if (recipientUserIds.length === 0) {
            return;
        }

        const notificationPayload = this.buildMessageReceivedPayload({
            conversationId,
            courseId: conversation.courseId,
            fromUserId: user.id,
            fromEmail: senderEmail,
            messagePreview: createdMessage.body.slice(0, 90),
        });

        await Promise.all(
            recipientUserIds.map((recipientUserId) =>
                notificationsService.createForUser(
                    recipientUserId,
                    'MESSAGE_RECEIVED',
                    notificationPayload,
                )),
        );
    }

    private now(): Date {
        return new Date();
    }

    private async upsertReadState(
        conversationId: string,
        userId: string,
        lastReadAt: Date,
    ): Promise<void> {
        await db.conversationReadState.upsert({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
            create: {
                conversationId,
                userId,
                lastReadAt,
            },
            update: {
                lastReadAt,
            },
        });
    }

    private async assertEnrollmentOrThrow(
        courseId: string,
        studentId: string,
    ): Promise<void> {
        const enrollment = await db.courseEnrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId,
                    studentId,
                },
            },
            select: {
                id: true,
            },
        });

        if (!enrollment) {
            throw new AppError('FORBIDDEN', 403, 'Student is not enrolled');
        }
    }

    private async getConversationOrThrow(
        conversationId: string,
    ): Promise<ConversationWithIncludes> {
        const conversation = await db.conversation.findUnique({
            where: {
                id: conversationId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        ownerId: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            throw new AppError('NOT_FOUND', 404, 'Conversation not found');
        }

        return conversation;
    }

    private async assertConversationAccessOrThrow(
        conversationId: string,
        user: AuthenticatedUser,
    ): Promise<ConversationWithIncludes> {
        const conversation = await this.getConversationOrThrow(conversationId);

        const isParticipant = conversation.participants.some(
            (participant) => participant.user.id === user.id,
        );

        if (!isParticipant) {
            throw new AppError('FORBIDDEN', 403, 'No access to this conversation');
        }

        if (conversation.courseId && conversation.course) {
            if (
                user.role === 'TEACHER' &&
                conversation.course.ownerId !== user.id
            ) {
                throw new AppError(
                    'FORBIDDEN',
                    403,
                    'Teacher can access only own course conversations',
                );
            }

            if (user.role === 'STUDENT') {
                await this.assertEnrollmentOrThrow(conversation.courseId, user.id);
            }
        }

        return conversation;
    }

    private async ensureParticipants(
        conversationId: string,
        userIds: string[],
    ): Promise<void> {
        const uniqueUserIds = Array.from(new Set(userIds)).filter(
            (userId) => userId.trim().length > 0,
        );

        if (uniqueUserIds.length === 0) {
            return;
        }

        await db.$transaction(
            uniqueUserIds.map((userId) =>
                db.conversationParticipant.upsert({
                    where: {
                        conversationId_userId: {
                            conversationId,
                            userId,
                        },
                    },
                    create: {
                        conversationId,
                        userId,
                    },
                    update: {},
                })),
        );
    }

    private async findExistingAdminDirectMessageConversationId(
        adminId: string,
        targetUserId: string,
    ): Promise<string | null> {
        const candidateConversations = await db.conversation.findMany({
            where: {
                courseId: null,
                AND: [
                    {
                        participants: {
                            some: {
                                userId: adminId,
                            },
                        },
                    },
                    {
                        participants: {
                            some: {
                                userId: targetUserId,
                            },
                        },
                    },
                ],
            },
            include: {
                participants: {
                    select: {
                        userId: true,
                    },
                },
            },
            orderBy: [
                { updatedAt: 'desc' },
                { id: 'desc' },
            ],
            take: 10,
        });

        const directMessageConversation = candidateConversations.find(
            (conversation) => conversation.participants.length === 2,
        );

        return directMessageConversation?.id ?? null;
    }

    private buildMessageReceivedPayload(params: {
        conversationId: string;
        courseId: string | null;
        fromUserId: string;
        fromEmail: string;
        messagePreview: string;
    }): MessageReceivedPayload {
        const payload: MessageReceivedPayload = {
            conversationId: params.conversationId,
            fromUserId: params.fromUserId,
            fromEmail: params.fromEmail,
            messagePreview: params.messagePreview,
        };

        if (params.courseId) {
            payload.courseId = params.courseId;
        }

        return payload;
    }
}

export const messagesService = new MessagesService();