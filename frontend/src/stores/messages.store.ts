import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseConversationDTO,
  parseInboxResponseDTO,
  parseStartConversationResponseDTO,
} from '@/api/contracts/messages.contracts';

import type {
  ConversationDTO,
  InboxItemDTO,
  SendMessagePayload,
  StartAdminConversationPayload,
  StartConversationPayload,
} from '@/types/messages.types';

type PollingHandle = ReturnType<typeof window.setInterval>;

type FetchInboxOptions = {
  limit?: number;
  unreadOnly?: boolean;
  cursor?: string | null;
  append?: boolean;
  silent?: boolean;
};

const safeTrim = (value: string): string => value.trim();

const clampNumber = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const buildInboxItemFingerprint = (item: InboxItemDTO): string => {
  const conversationId = normalizeText(item.conversationId);
  const title = normalizeText(item.title);
  const lastMessagePreview = normalizeText(item.lastMessagePreview);
  const unreadCount = Number.isFinite(item.unreadCount) ? item.unreadCount : 0;
  const courseTitle = normalizeText(item.course?.title);

  return `${conversationId}|${unreadCount}|${title}|${courseTitle}|${lastMessagePreview}`;
};

const buildInboxListFingerprint = (items: InboxItemDTO[]): string =>
  items.map(buildInboxItemFingerprint).join('||');

const mergeInboxItemsWithoutDuplicates = (
  currentItems: InboxItemDTO[],
  incomingItems: InboxItemDTO[],
): InboxItemDTO[] => {
  const existingConversationIds = new Set(
    currentItems.map((item) => item.conversationId),
  );

  const mergedItems = [...currentItems];

  for (const incomingItem of incomingItems) {
    if (existingConversationIds.has(incomingItem.conversationId)) {
      continue;
    }

    existingConversationIds.add(incomingItem.conversationId);
    mergedItems.push(incomingItem);
  }

  return mergedItems;
};

export const useMessagesStore = defineStore('messages', () => {
  const inboxItems = ref<InboxItemDTO[]>([]);
  const inboxUnreadCount = ref<number>(0);
  const inboxBusy = ref<boolean>(false);
  const inboxError = ref<string | null>(null);
  const inboxNextCursor = ref<string | null>(null);
  const inboxHasMore = computed<boolean>(() => Boolean(inboxNextCursor.value));

  const conversationById = ref<Record<string, ConversationDTO>>({});
  const conversationBusyById = ref<Record<string, boolean>>({});
  const conversationErrorById = ref<Record<string, string | null>>({});

  const pollingHandle = ref<PollingHandle | null>(null);
  const conversationPollingHandle = ref<PollingHandle | null>(null);
  const polledConversationId = ref<string | null>(null);

  const inboxListFingerprint = ref<string>('');
  const hasUnread = computed<boolean>(() => inboxUnreadCount.value > 0);

  const setConversationBusy = (
    conversationId: string,
    value: boolean,
  ): void => {
    conversationBusyById.value[conversationId] = value;
  };

  const setConversationError = (
    conversationId: string,
    value: string | null,
  ): void => {
    conversationErrorById.value[conversationId] = value;
  };

  const isConversationBusy = (conversationId: string): boolean =>
    Boolean(conversationBusyById.value[conversationId]);

  const getConversationError = (conversationId: string): string | null =>
    conversationErrorById.value[conversationId] ?? null;

  const fetchInbox = async (
    options: FetchInboxOptions = {},
  ): Promise<void> => {
    if (inboxBusy.value) {
      return;
    }

    const silent = options.silent ?? false;

    if (!silent) {
      inboxBusy.value = true;
    }

    inboxError.value = null;

    try {
      const limit = clampNumber(options.limit ?? 20, 1, 50);
      const unreadOnly = options.unreadOnly ?? false;
      const cursor = options.cursor ?? null;
      const append = options.append ?? false;

      const response = await apiClient.get<unknown>('/messages/inbox', {
        params: {
          limit,
          unreadOnly,
          cursor,
        },
      });

      const parsedResponse = parseInboxResponseDTO(response.data);

      inboxUnreadCount.value = parsedResponse.unreadCount;
      inboxNextCursor.value = parsedResponse.nextCursor ?? null;

      if (append) {
        const mergedItems = mergeInboxItemsWithoutDuplicates(
          inboxItems.value,
          parsedResponse.items,
        );

        inboxItems.value = mergedItems;
        inboxListFingerprint.value = buildInboxListFingerprint(mergedItems);
        return;
      }

      const nextFingerprint = buildInboxListFingerprint(parsedResponse.items);

      if (nextFingerprint === inboxListFingerprint.value) {
        return;
      }

      inboxItems.value = parsedResponse.items;
      inboxListFingerprint.value = nextFingerprint;
    } catch (unknownError) {
      inboxError.value = getApiErrorMessage(
        unknownError,
        'Failed to load inbox.',
      );

      if (!silent) {
        inboxItems.value = [];
        inboxUnreadCount.value = 0;
        inboxNextCursor.value = null;
        inboxListFingerprint.value = '';
      }
    } finally {
      if (!silent) {
        inboxBusy.value = false;
      }
    }
  };

  const fetchConversation = async (
    conversationId: string,
    options?: { force?: boolean },
  ): Promise<ConversationDTO | null> => {
    if (!conversationId) {
      return null;
    }

    if (!options?.force && isConversationBusy(conversationId)) {
      return conversationById.value[conversationId] ?? null;
    }

    setConversationBusy(conversationId, true);
    setConversationError(conversationId, null);

    try {
      const response = await apiClient.get<unknown>(
        `/messages/conversations/${encodeURIComponent(conversationId)}`,
      );

      const parsedConversation = parseConversationDTO(response.data);
      conversationById.value[conversationId] = parsedConversation;

      const inboxRow = inboxItems.value.find(
        (item) => item.conversationId === conversationId,
      );

      if (inboxRow && inboxRow.unreadCount > 0) {
        inboxUnreadCount.value = Math.max(
          0,
          inboxUnreadCount.value - inboxRow.unreadCount,
        );

        inboxRow.unreadCount = 0;
        inboxListFingerprint.value = buildInboxListFingerprint(inboxItems.value);
      }

      return parsedConversation;
    } catch (unknownError) {
      setConversationError(
        conversationId,
        getApiErrorMessage(
          unknownError,
          'Failed to load conversation.',
        ),
      );

      return null;
    } finally {
      setConversationBusy(conversationId, false);
    }
  };

  const sendMessage = async (
    conversationId: string,
    payload: SendMessagePayload,
  ): Promise<void> => {
    if (!conversationId) {
      return;
    }

    const body = safeTrim(payload.body);

    if (body.length === 0) {
      setConversationError(
        conversationId,
        'Message cannot be empty.',
      );
      return;
    }

    setConversationBusy(conversationId, true);
    setConversationError(conversationId, null);

    try {
      await apiClient.post(
        `/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
        { body },
      );

      await fetchConversation(conversationId, { force: true });
      await fetchInbox({ limit: 50 });
    } catch (unknownError) {
      setConversationError(
        conversationId,
        getApiErrorMessage(
          unknownError,
          'Failed to send message.',
        ),
      );

      throw unknownError;
    } finally {
      setConversationBusy(conversationId, false);
    }
  };

  const markConversationRead = async (
    conversationId: string,
  ): Promise<void> => {
    if (!conversationId) {
      return;
    }

    try {
      await apiClient.post(
        `/messages/conversations/${encodeURIComponent(conversationId)}/read`,
        null,
      );

      const inboxRow = inboxItems.value.find(
        (item) => item.conversationId === conversationId,
      );

      if (inboxRow && inboxRow.unreadCount > 0) {
        inboxUnreadCount.value = Math.max(
          0,
          inboxUnreadCount.value - inboxRow.unreadCount,
        );

        inboxRow.unreadCount = 0;
        inboxListFingerprint.value = buildInboxListFingerprint(inboxItems.value);
      }
    } catch {
      return;
    }
  };

  const startPolling = (options?: { intervalMs?: number }): void => {
    const intervalMs = options?.intervalMs ?? 20_000;

    if (pollingHandle.value) {
      return;
    }

    pollingHandle.value = window.setInterval(async () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      await fetchInbox({
        limit: 20,
        silent: true,
      });
    }, intervalMs);
  };

  const stopPolling = (): void => {
    if (!pollingHandle.value) {
      return;
    }

    window.clearInterval(pollingHandle.value);
    pollingHandle.value = null;
  };

  const startConversationPolling = (
    conversationId: string,
    options?: { intervalMs?: number },
  ): void => {
    if (!conversationId) {
      return;
    }

    const intervalMs = options?.intervalMs ?? 6_000;

    if (
      conversationPollingHandle.value &&
      polledConversationId.value === conversationId
    ) {
      return;
    }

    if (conversationPollingHandle.value) {
      window.clearInterval(conversationPollingHandle.value);
      conversationPollingHandle.value = null;
    }

    polledConversationId.value = conversationId;

    conversationPollingHandle.value = window.setInterval(async () => {
      const activeConversationId = polledConversationId.value;

      if (!activeConversationId) {
        return;
      }

      if (document.visibilityState === 'hidden') {
        return;
      }

      if (isConversationBusy(activeConversationId)) {
        return;
      }

      await fetchConversation(activeConversationId, { force: true });
    }, intervalMs);
  };

  const stopConversationPolling = (): void => {
    if (!conversationPollingHandle.value) {
      return;
    }

    window.clearInterval(conversationPollingHandle.value);
    conversationPollingHandle.value = null;
    polledConversationId.value = null;
  };

  const startConversation = async (
    payload: StartConversationPayload,
  ): Promise<string> => {
    try {
      const response = await apiClient.post<unknown>('/messages/start', payload);
      const parsedResponse = parseStartConversationResponseDTO(response.data);

      await fetchInbox({ limit: 50 });

      return parsedResponse.conversationId;
    } catch (unknownError) {
      throw new Error(
        getApiErrorMessage(
          unknownError,
          'Failed to start conversation.',
        ),
      );
    }
  };

  const startAdminConversation = async (
    payload: StartAdminConversationPayload,
  ): Promise<string> => {
    try {
      const response = await apiClient.post<unknown>(
        '/messages/admin/start',
        payload,
      );

      const parsedResponse = parseStartConversationResponseDTO(response.data);

      await fetchInbox({ limit: 50 });

      return parsedResponse.conversationId;
    } catch (unknownError) {
      throw new Error(
        getApiErrorMessage(
          unknownError,
          'Failed to start conversation (admin).',
        ),
      );
    }
  };

  return {
    inboxItems,
    inboxUnreadCount,
    hasUnread,
    inboxBusy,
    inboxError,
    inboxNextCursor,
    inboxHasMore,

    conversationById,
    conversationBusyById,
    conversationErrorById,

    fetchInbox,
    isConversationBusy,
    getConversationError,
    fetchConversation,
    sendMessage,
    markConversationRead,

    startPolling,
    stopPolling,
    startConversationPolling,
    stopConversationPolling,

    startConversation,
    startAdminConversation,
  };
});



