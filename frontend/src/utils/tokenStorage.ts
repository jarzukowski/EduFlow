const ACCESS_TOKEN_KEY = 'access_token';

const isSessionStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  } catch {
    return false;
  }
};

const readAccessToken = (): string | null => {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeAccessToken = (token: string): void => {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
  }
};

const removeAccessToken = (): void => {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
  }
};

export const tokenStorage = {
  get: (): string | null => readAccessToken(),
  set: (token: string): void => {
    writeAccessToken(token);
  },
  clear: (): void => {
    removeAccessToken();
  },
} as const;


