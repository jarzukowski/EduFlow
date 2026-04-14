import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseRevokeSessionResponseDTO,
  parseSessionsResponseDTO,
} from '@/api/contracts/sessions.contracts';
import {
  isSessionActive,
  sortActiveSessions,
  sortSessionsByCreatedAtDesc,
} from '@/utils/sessions.utils';
import { useAuthStore } from '@/stores/auth.store';

import type { SessionDTO } from '@/types/sessions.types';

export const useSessionsStore = defineStore('sessions', () => {
  const items = ref<SessionDTO[]>([]);
  const isFetching = ref(false);
  const revokingSessionId = ref<string | null>(null);
  const isRevokingOtherSessions = ref(false);
  const error = ref<string | null>(null);

  const activeItems = computed<SessionDTO[]>(() => {
    return [...items.value]
      .filter((session) => isSessionActive(session))
      .sort(sortActiveSessions);
  });

  const historyItems = computed<SessionDTO[]>(() => {
    return [...items.value]
      .filter((session) => !isSessionActive(session))
      .sort(sortSessionsByCreatedAtDesc);
  });

  const hasOtherActiveSessions = computed<boolean>(() => {
    return activeItems.value.some((session) => !session.isCurrent);
  });

  const isBusy = computed<boolean>(() => {
    return isFetching.value || Boolean(revokingSessionId.value) || isRevokingOtherSessions.value;
  });

  const setItems = (nextItems: SessionDTO[]): void => {
    items.value = nextItems;
  };

  const clearError = (): void => {
    error.value = null;
  };

  const fetchSessions = async (): Promise<void> => {
    isFetching.value = true;
    clearError();

    try {
      const response = await apiClient.get<unknown>('/auth/sessions');
      const parsedResponse = parseSessionsResponseDTO(response.data);

      setItems(parsedResponse.items);
    } catch (caughtError: unknown) {
      error.value = getApiErrorMessage(
        caughtError,
        'Failed to load sessions. Please try again.',
      );
      throw caughtError;
    } finally {
      isFetching.value = false;
    }
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    if (revokingSessionId.value || isRevokingOtherSessions.value) {
      return;
    }

    revokingSessionId.value = sessionId;
    clearError();

    try {
      const response = await apiClient.delete<unknown>(`/auth/sessions/${sessionId}`);
      const parsedResponse = parseRevokeSessionResponseDTO(response.data);

      if (parsedResponse.wasCurrent) {
        const authStore = useAuthStore();
        authStore.clearAuthState();
        return;
      }

      await fetchSessions();
    } catch (caughtError: unknown) {
      error.value = getApiErrorMessage(
        caughtError,
        'Failed to sign out the session. Please try again.',
      );
      throw caughtError;
    } finally {
      revokingSessionId.value = null;
    }
  };

  const revokeOtherSessions = async (): Promise<void> => {
    if (isRevokingOtherSessions.value || revokingSessionId.value) {
      return;
    }

    if (!hasOtherActiveSessions.value) {
      return;
    }

    isRevokingOtherSessions.value = true;
    clearError();

    try {
      await apiClient.post('/auth/sessions/revoke-others');
      await fetchSessions();
    } catch (caughtError: unknown) {
      error.value = getApiErrorMessage(
        caughtError,
        'Failed to sign out the remaining sessions. Please try again.',
      );
      throw caughtError;
    } finally {
      isRevokingOtherSessions.value = false;
    }
  };

  return {
    items,
    isFetching,
    revokingSessionId,
    isRevokingOtherSessions,
    isBusy,
    error,
    activeItems,
    historyItems,
    hasOtherActiveSessions,
    fetchSessions,
    revokeSession,
    revokeOtherSessions,
  };
});

