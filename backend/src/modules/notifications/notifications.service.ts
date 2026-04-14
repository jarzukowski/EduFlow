import type { NotificationType } from '../../../generated/client';

import { db } from '../../db/client';
import { AppError } from '../../common/errors/AppError';

import { mapNotificationsToDTO } from './notifications.mapper';

import type {
    ListNotificationsQuery,
    ListNotificationsResponseDTO,
    MarkAllNotificationsReadResponseDTO,
    NotificationPayloadByType,
} from './notifications.types';

class NotificationsService {
    public async listForUser(
        userId: string,
        query: ListNotificationsQuery,
    ): Promise<ListNotificationsResponseDTO> {
        const whereFilter = this.buildListWhereFilter(userId, query.unreadOnly);
        const take = query.limit + 1;

        const unreadCountPromise = db.notification.count({
            where: {
                userId,
                readAt: null,
            },
        });

        const notifications = await db.notification.findMany({
            where: whereFilter,
            orderBy: [
                { createdAt: 'desc' },
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

        const pageItems = notifications.slice(0, query.limit);
        const hasNextPage = notifications.length > query.limit;
        const nextCursor = hasNextPage
            ? pageItems[pageItems.length - 1]?.id ?? null
            : null;

        const unreadCount = await unreadCountPromise;

        return {
            items: mapNotificationsToDTO(pageItems),
            unreadCount,
            nextCursor,
        };
    }

    public async markRead(
        notificationId: string,
        userId: string,
    ): Promise<void> {
        const now = new Date();

        const updatedNotificationResult = await db.notification.updateMany({
            where: {
                id: notificationId,
                userId,
                readAt: null,
            },
            data: {
                readAt: now,
            },
        });

        if (updatedNotificationResult.count > 0) {
            return;
        }

        const notificationExistsForUser = await db.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
            select: {
                id: true,
            },
        });

        if (!notificationExistsForUser) {
            throw new AppError('NOT_FOUND', 404, 'Notification not found');
        }
    }

    public async markAllRead(
        userId: string,
    ): Promise<MarkAllNotificationsReadResponseDTO> {
        const updatedNotificationsResult = await db.notification.updateMany({
            where: {
                userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });

        return {
            updatedCount: updatedNotificationsResult.count,
        };
    }

    public async createForUser<TType extends NotificationType>(
        userId: string,
        type: TType,
        payload: NotificationPayloadByType[TType],
    ): Promise<void> {
        await db.notification.create({
            data: {
                userId,
                type,
                payload,
            },
        });
    }

    private buildListWhereFilter(
        userId: string,
        unreadOnly: boolean,
    ): {
        userId: string;
        readAt?: null;
    } {
        return {
            userId,
            ...(unreadOnly ? { readAt: null } : {}),
        };
    }
}

export const notificationsService = new NotificationsService();