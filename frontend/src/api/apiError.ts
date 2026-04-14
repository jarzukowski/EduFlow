import axios from 'axios';

type ApiErrorBody = {
  message?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response?.data;

  if (!isRecord(responseData)) {
    return fallback;
  }

  const message = (responseData as ApiErrorBody).message;

  if (typeof message !== 'string') {
    return fallback;
  }

  const trimmedMessage = message.trim();

  return trimmedMessage ? trimmedMessage : fallback;
};
