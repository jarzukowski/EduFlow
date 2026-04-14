import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { Pinia } from 'pinia';

import { useAuthStore } from '../stores/auth.store';

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const isAuthEndpoint = (url: string): boolean => {
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/logout')
  );
};

export const setupApiInterceptors = (api: AxiosInstance, pinia: Pinia): void => {
  let refreshPromise: Promise<string> | null = null;

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalConfig = error.config as RetryConfig | undefined;

      if (!originalConfig) {
        return Promise.reject(error);
      }

      if (status !== 401) {
        return Promise.reject(error);
      }

      if (originalConfig._retry) {
        return Promise.reject(error);
      }

      const requestUrl = originalConfig.url ?? '';

      if (isAuthEndpoint(requestUrl)) {
        return Promise.reject(error);
      }

      originalConfig._retry = true;

      const auth = useAuthStore(pinia);

      try {
        if (!refreshPromise) {
          refreshPromise = auth.refreshAccessToken();
        }

        const newToken = await refreshPromise;

        originalConfig.headers = originalConfig.headers ?? {};
        originalConfig.headers.Authorization = `Bearer ${newToken}`;

        return api(originalConfig);
      } catch (refreshError) {
        auth.clearAuthState();
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    },
  );
};
