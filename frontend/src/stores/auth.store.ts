import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient, setAuthHeader } from '../api/axios';
import { getApiErrorMessage } from '../api/apiError';
import {
  parseLoginResponse,
  parseMeResponse,
  parseRefreshResponse,
} from '@/api/contracts/auth.contracts';
import type {
  AuthUser,
  LoginResponse,
  RegisterDto,
  UserRole,
} from '../types/auth.types.ts';
import { tokenStorage } from '../utils/tokenStorage';
import { getOrCreateDeviceId } from '@/utils/deviceId.ts';

let refreshPromise: Promise<string> | null = null;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const accessToken = ref<string | null>(null);
  const error = ref<string | null>(null);

  const loginLoading = ref(false);
  const registerLoading = ref(false);
  const logoutLoading = ref(false);
  const logoutAllLoading = ref(false);
  const bootstrapping = ref(false);
  const bootstrapDone = ref(false);

  const isAuthenticated = computed(() => Boolean(user.value) && Boolean(accessToken.value));
  const userRole = computed<UserRole | null>(() => user.value?.role ?? null);

  const setAccessToken = (token: string | null): void => {
    accessToken.value = token;

    if (token) {
      tokenStorage.set(token);
      setAuthHeader(token);
      return;
    }

    tokenStorage.clear();
    setAuthHeader(null);
  };

  const setAuthData = (payload: LoginResponse): void => {
    setAccessToken(payload.tokens.accessToken);
    user.value = payload.user;
  };

  const clearAuthState = (): void => {
    user.value = null;
    error.value = null;
    setAccessToken(null);
  };

  const fetchMe = async (): Promise<AuthUser> => {
    const response = await apiClient.get<unknown>('/auth/me');
    return parseMeResponse(response.data).user;
  };

  const register = async (email: string, username: string, password: string): Promise<void> => {
    registerLoading.value = true;
    error.value = null;

    try {
      const payload: RegisterDto = {
        email,
        username,
        password,
      };

      await apiClient.post('/auth/register', payload);
    } catch (caughtError: unknown) {
      error.value = getApiErrorMessage(
        caughtError,
        'Failed to create account. Please try again.',
      );
      throw caughtError;
    } finally {
      registerLoading.value = false;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    loginLoading.value = true;
    error.value = null;

    try {
      const deviceId = getOrCreateDeviceId();

      const response = await apiClient.post<unknown>('/auth/login', {
        email,
        password,
        deviceId,
      });

      setAuthData(parseLoginResponse(response.data));
    } catch (caughtError: unknown) {
      error.value = getApiErrorMessage(
        caughtError,
        'Failed to sign in. Check your credentials and try again.',
      );
      throw caughtError;
    } finally {
      loginLoading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    logoutLoading.value = true;
    error.value = null;

    try {
      await apiClient.post('/auth/logout');
    } catch {
    } finally {
      clearAuthState();
      logoutLoading.value = false;
    }
  };

  const logoutAll = async (): Promise<void> => {
    logoutAllLoading.value = true;
    error.value = null;

    try {
      await apiClient.post('/auth/sessions/revoke-all');
      clearAuthState();
    } catch (caughtError: unknown) {
      error.value = getApiErrorMessage(
        caughtError,
        'Failed to sign out of all sessions.',
      );
      throw caughtError;
    } finally {
      logoutAllLoading.value = false;
    }
  };

  const refreshAccessToken = async (): Promise<string> => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const refreshResponse = await apiClient.post<unknown>('/auth/refresh');
        const newAccessToken = parseRefreshResponse(refreshResponse.data).tokens.accessToken;

        setAccessToken(newAccessToken);

        if (!user.value) {
          user.value = await fetchMe();
        }

        return newAccessToken;
      } catch (caughtError: unknown) {
        clearAuthState();
        throw caughtError;
      }
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  };

  const bootstrap = async (): Promise<void> => {
    if (bootstrapDone.value) {
      return;
    }

    bootstrapping.value = true;
    error.value = null;

    try {
      const storedToken = tokenStorage.get();

      if (storedToken) {
        setAccessToken(storedToken);

        try {
          user.value = await fetchMe();
          bootstrapDone.value = true;
          return;
        } catch {
          setAccessToken(null);
        }
      }

      const refreshResponse = await apiClient.post<unknown>('/auth/refresh');
      const newAccessToken = parseRefreshResponse(refreshResponse.data).tokens.accessToken;

      setAccessToken(newAccessToken);
      user.value = await fetchMe();
      bootstrapDone.value = true;
    } catch {
      clearAuthState();
      bootstrapDone.value = true;
    } finally {
      bootstrapping.value = false;
    }
  };

  return {
    user,
    accessToken,
    error,

    loginLoading,
    registerLoading,
    logoutLoading,
    logoutAllLoading,
    bootstrapping,
    bootstrapDone,

    isAuthenticated,
    userRole,

    register,
    login,
    logout,
    logoutAll,
    bootstrap,
    refreshAccessToken,

    clearAuthState,
  };
});

