import type { NotificationType as PrismaNotificationType } from '../../../generated/client';

export type NotificationType = PrismaNotificationType;

export type NotificationPayloadByType = {
    MESSAGE_RECEIVED: {
        conversationId: string;
        courseId?: string;
        fromUserId: string;
        fromEmail?: string;
        messagePreview?: string;
    };
    COURSE_COMPLETED: {
        courseId: string;
        courseTitle: string;
        byUserId: string;
        byEmail?: string;
    };
    ENROLLED_TO_COURSE: {
        courseId: string;
        courseTitle: string;
        byUserId: string;
        byEmail?: string;
    };
    REMOVED_FROM_COURSE: {
        courseId: string;
        courseTitle: string;
        byUserId: string;
        byEmail?: string;
    };
    ADMIN_BROADCAST: {
        title: string;
        body: string;
        href?: string | null;
    };
};

export type MessageReceivedPayload = NotificationPayloadByType['MESSAGE_RECEIVED'];

export type NotificationDTO = {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    href: string | null;
    createdAt: string;
    readAt: string | null;
};

export type ListNotificationsResponseDTO = {
    items: NotificationDTO[];
    unreadCount: number;
    nextCursor: string | null;
};

export type ListNotificationsQuery = {
    unreadOnly: boolean;
    limit: number;
    cursor: string | null;
};

export type MarkAllNotificationsReadResponseDTO = {
    updatedCount: number;
};