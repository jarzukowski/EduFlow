import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';

import { parseListNotificationsResponseDTO } from '@/api/contracts/notifications.contracts';
import type {
  ListNotificationsResponseDTO,
  NotificationDTO,
} from '@/types/notifications.types';

type FetchNotificationsOptions = {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string | null;
  append?: boolean;
};

const STORAGE_KEY_LAST_BELL_OPENED_AT = 'notifications:lastBellOpenedAt';

const clampNotificationsLimit = (value: number | undefined): number => {
  const fallbackLimit = 20;

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallbackLimit;
  }

  return Math.max(1, Math.min(20, Math.trunc(value)));
};

const readLastOpenedAtFromStorage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY_LAST_BELL_OPENED_AT);

    if (!rawValue) {
      return null;
    }

    const milliseconds = Number(rawValue);

    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      return null;
    }

    return new Date(milliseconds).toISOString();
  } catch {
    return null;
  }
};

const writeLastOpenedAtToStorage = (isoDate: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const milliseconds = Date.parse(isoDate);

    if (!Number.isFinite(milliseconds)) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY_LAST_BELL_OPENED_AT, String(milliseconds));
  } catch {
    return;
  }
};

const buildNotificationsQueryString = (
  options: Required<Pick<FetchNotificationsOptions, 'unreadOnly' | 'limit'>> & {
    cursor: string | null;
  },
): string => {
  const searchParams = new URLSearchParams();

  searchParams.set('unreadOnly', String(options.unreadOnly));
  searchParams.set('limit', String(options.limit));

  if (options.cursor) {
    searchParams.set('cursor', options.cursor);
  }

  return searchParams.toString();
};

const mergeNotificationsWithoutDuplicates = (
  currentItems: NotificationDTO[],
  incomingItems: NotificationDTO[],
): NotificationDTO[] => {
  const existingIds = new Set(currentItems.map((item) => item.id));
  const mergedItems = [...currentItems];

  for (const item of incomingItems) {
    if (existingIds.has(item.id)) {
      continue;
    }

    existingIds.add(item.id);
    mergedItems.push(item);
  }

  return mergedItems;
};

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<NotificationDTO[]>([]);
  const unreadCount = ref<number>(0);

  const busy = ref<boolean>(false);
  const error = ref<string | null>(null);
  const nextCursor = ref<string | null>(null);
  const markReadBusyById = ref<Record<string, boolean>>({});

  const lastBellOpenedAt = ref<string | null>(readLastOpenedAtFromStorage());

  const hasMore = computed<boolean>(() => Boolean(nextCursor.value));
  const hasUnread = computed<boolean>(() => unreadCount.value > 0);

  const newestCreatedAt = computed<string | null>(() => items.value[0]?.createdAt ?? null);

  const hasNewSinceLastOpen = computed<boolean>(() => {
    if (unreadCount.value <= 0) {
      return false;
    }

    const newestIso = newestCreatedAt.value;

    if (!newestIso) {
      return false;
    }

    const lastOpenedIso = lastBellOpenedAt.value;

    if (!lastOpenedIso) {
      return true;
    }

    const newestTimestamp = Date.parse(newestIso);
    const lastOpenedTimestamp = Date.parse(lastOpenedIso);

    if (!Number.isFinite(newestTimestamp) || !Number.isFinite(lastOpenedTimestamp)) {
      return true;
    }

    return newestTimestamp > lastOpenedTimestamp;
  });

  const shouldShake = computed<boolean>(() => hasNewSinceLastOpen.value);

  const markBellOpenedNow = (): void => {
    const nowIso = new Date().toISOString();
    lastBellOpenedAt.value = nowIso;
    writeLastOpenedAtToStorage(nowIso);
  };

  const fetchNotifications = async (
    options: FetchNotificationsOptions = {},
  ): Promise<void> => {
    if (busy.value) {
      return;
    }

    busy.value = true;
    error.value = null;

    try {
      const unreadOnly = options.unreadOnly ?? true;
      const limit = clampNotificationsLimit(options.limit);
      const cursor = options.cursor ?? null;
      const append = options.append ?? false;

      const queryString = buildNotificationsQueryString({
        unreadOnly,
        limit,
        cursor,
      });

      const response = await apiClient.get<unknown>(`/notifications?${queryString}`);
      const parsedResponse: ListNotificationsResponseDTO = parseListNotificationsResponseDTO(
        response.data,
      );

      items.value = append
        ? mergeNotificationsWithoutDuplicates(items.value, parsedResponse.items)
        : parsedResponse.items;

      unreadCount.value = parsedResponse.unreadCount;
      nextCursor.value = parsedResponse.nextCursor;
    } catch (unknownError) {
      error.value = getApiErrorMessage(
        unknownError,
        'Failed to load notifications.',
      );
    } finally {
      busy.value = false;
    }
  };

  const loadMore = async (): Promise<void> => {
    if (busy.value || !nextCursor.value) {
      return;
    }

    await fetchNotifications({
      unreadOnly: true,
      limit: 20,
      cursor: nextCursor.value,
      append: true,
    });
  };

  const markRead = async (notificationId: string): Promise<void> => {
    if (markReadBusyById.value[notificationId]) {
      return;
    }

    const previousItems = items.value;
    const previousUnreadCount = unreadCount.value;

    const existingNotification = previousItems.find((item) => item.id === notificationId);

    if (!existingNotification) {
      return;
    }

    const wasUnread = existingNotification.readAt === null;

    markReadBusyById.value[notificationId] = true;
    error.value = null;

    items.value = previousItems.filter((item) => item.id !== notificationId);

    if (wasUnread) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }

    try {
      await apiClient.post(`/notifications/${encodeURIComponent(notificationId)}/read`, null);
    } catch (unknownError) {
      items.value = previousItems;
      unreadCount.value = previousUnreadCount;

      error.value = getApiErrorMessage(
        unknownError,
        'Failed to mark the notification as read.',
      );
    } finally {
      markReadBusyById.value[notificationId] = false;
    }
  };

  const markAllRead = async (): Promise<void> => {
    if (busy.value) {
      return;
    }

    busy.value = true;
    error.value = null;

    try {
      await apiClient.post('/notifications/read-all', null);

      items.value = [];
      unreadCount.value = 0;
      nextCursor.value = null;
    } catch (unknownError) {
      error.value = getApiErrorMessage(
        unknownError,
        'Failed to mark all notifications as read.',
      );
    } finally {
      busy.value = false;
    }
  };

  return {
    items,
    unreadCount,

    busy,
    error,
    nextCursor,
    hasMore,
    markReadBusyById,

    hasUnread,
    hasNewSinceLastOpen,
    shouldShake,
    lastBellOpenedAt,

    fetchNotifications,
    loadMore,
    markRead,
    markAllRead,
    markBellOpenedNow,
  };
});



