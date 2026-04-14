export type NotificationType =
  | 'MESSAGE_RECEIVED'
  | 'COURSE_COMPLETED'
  | 'ENROLLED_TO_COURSE'
  | 'REMOVED_FROM_COURSE'
  | 'ADMIN_BROADCAST';

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
