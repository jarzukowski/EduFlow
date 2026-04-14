import type {
  ListNotificationsResponseDTO,
  NotificationDTO,
  NotificationType,
} from '@/types/notifications.types';

const NOTIFICATION_TYPES = [
  'MESSAGE_RECEIVED',
  'COURSE_COMPLETED',
  'ENROLLED_TO_COURSE',
  'REMOVED_FROM_COURSE',
  'ADMIN_BROADCAST',
] as const satisfies readonly NotificationType[];

const NOTIFICATION_TYPE_SET: ReadonlySet<string> = new Set(NOTIFICATION_TYPES);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNotificationType = (value: unknown): value is NotificationType =>
  typeof value === 'string' && NOTIFICATION_TYPE_SET.has(value);

export const isNotificationDTO = (value: unknown): value is NotificationDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNotificationType(value.type) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.body) &&
    isNullableString(value.href) &&
    isNonEmptyString(value.createdAt) &&
    isNullableString(value.readAt)
  );
};

export const parseListNotificationsResponseDTO = (
  value: unknown,
): ListNotificationsResponseDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid notifications response: expected object.');
  }

  const { items, unreadCount, nextCursor } = value;

  if (!Array.isArray(items) || !items.every(isNotificationDTO)) {
    throw new Error('Invalid notifications response: invalid items.');
  }

  if (!isFiniteNumber(unreadCount) || unreadCount < 0) {
    throw new Error('Invalid notifications response: invalid unreadCount.');
  }

  if (!isNullableString(nextCursor)) {
    throw new Error('Invalid notifications response: invalid nextCursor.');
  }

  return {
    items,
    unreadCount,
    nextCursor,
  };
};

