import type {
    Notification,
    NotificationType as PrismaNotificationType,
} from '../../../generated/client';

import type { NotificationDTO } from './notifications.types';

type NotificationRecord = Notification & {
    type: PrismaNotificationType;
    payload: unknown;
};

const ensureString = (value: unknown): string | null =>
    typeof value === 'string' ? value : null;

const asPlainObject = (value: unknown): Record<string, unknown> | null =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;

const getNotificationTimestamps = (
    notification: NotificationRecord,
): Pick<NotificationDTO, 'createdAt' | 'readAt'> => ({
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
});

const mapAdminBroadcastNotification = (
    notification: NotificationRecord,
    payload: Record<string, unknown> | null,
): NotificationDTO => {
    const title = ensureString(payload?.title)?.trim();
    const body = ensureString(payload?.body)?.trim();
    const hrefCandidate = ensureString(payload?.href);

    return {
        id: notification.id,
        type: 'ADMIN_BROADCAST',
        title: title && title.length > 0 ? title : 'Notification',
        body: body && body.length > 0 ? body : '',
        href: hrefCandidate && hrefCandidate.startsWith('/') ? hrefCandidate : null,
        ...getNotificationTimestamps(notification),
    };
};

const mapMessageReceivedNotification = (
    notification: NotificationRecord,
    payload: Record<string, unknown> | null,
): NotificationDTO => {
    const conversationId = ensureString(payload?.conversationId);
    const senderEmail = ensureString(payload?.fromEmail) ?? 'Someone';
    const messagePreview = ensureString(payload?.messagePreview);

    return {
        id: notification.id,
        type: 'MESSAGE_RECEIVED',
        title: 'New message',
        body: messagePreview
            ? `${senderEmail}: ${messagePreview}`
            : `${senderEmail} sent a message.`,
        href: conversationId
            ? `/messages?c=${encodeURIComponent(conversationId)}`
            : '/messages',
        ...getNotificationTimestamps(notification),
    };
};

const mapCourseCompletedNotification = (
    notification: NotificationRecord,
    payload: Record<string, unknown> | null,
): NotificationDTO => {
    const courseId = ensureString(payload?.courseId);
    const courseTitle = ensureString(payload?.courseTitle) ?? 'Course';
    const actorEmail = ensureString(payload?.byEmail) ?? 'User';

    return {
        id: notification.id,
        type: 'COURSE_COMPLETED',
        title: 'Course completed',
        body: `${actorEmail} completed the course: ${courseTitle}.`,
        href: courseId
            ? `/courses/${encodeURIComponent(courseId)}`
            : '/courses',
        ...getNotificationTimestamps(notification),
    };
};

const mapEnrolledToCourseNotification = (
    notification: NotificationRecord,
    payload: Record<string, unknown> | null,
): NotificationDTO => {
    const courseId = ensureString(payload?.courseId);
    const courseTitle = ensureString(payload?.courseTitle) ?? 'Course';
    const actorEmail = ensureString(payload?.byEmail) ?? 'User';

    return {
        id: notification.id,
        type: 'ENROLLED_TO_COURSE',
        title: 'Added to course',
        body: `${actorEmail} added you to the course: ${courseTitle}.`,
        href: courseId
            ? `/courses/${encodeURIComponent(courseId)}`
            : '/courses',
        ...getNotificationTimestamps(notification),
    };
};

const mapRemovedFromCourseNotification = (
    notification: NotificationRecord,
    payload: Record<string, unknown> | null,
): NotificationDTO => {
    const courseId = ensureString(payload?.courseId);
    const courseTitle = ensureString(payload?.courseTitle) ?? 'Course';
    const actorEmail = ensureString(payload?.byEmail) ?? 'User';

    return {
        id: notification.id,
        type: 'REMOVED_FROM_COURSE',
        title: 'Removed from course',
        body: `${actorEmail} removed you from the course: ${courseTitle}.`,
        href: courseId
            ? `/courses/${encodeURIComponent(courseId)}`
            : '/courses',
        ...getNotificationTimestamps(notification),
    };
};

export const mapNotificationToDTO = (
    notification: NotificationRecord,
): NotificationDTO => {
    const payload = asPlainObject(notification.payload);

    if (notification.type === 'ADMIN_BROADCAST') {
        return mapAdminBroadcastNotification(notification, payload);
    }

    if (notification.type === 'MESSAGE_RECEIVED') {
        return mapMessageReceivedNotification(notification, payload);
    }

    if (notification.type === 'COURSE_COMPLETED') {
        return mapCourseCompletedNotification(notification, payload);
    }

    if (notification.type === 'ENROLLED_TO_COURSE') {
        return mapEnrolledToCourseNotification(notification, payload);
    }

    if (notification.type === 'REMOVED_FROM_COURSE') {
        return mapRemovedFromCourseNotification(notification, payload);
    }

    return {
        id: notification.id,
        type: notification.type,
        title: 'Notification',
        body: '',
        href: null,
        ...getNotificationTimestamps(notification),
    };
};

export const mapNotificationsToDTO = (
    notifications: NotificationRecord[],
): NotificationDTO[] => notifications.map(mapNotificationToDTO);
