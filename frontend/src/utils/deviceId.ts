const DEVICE_ID_KEY = 'deviceId';
const MIN_DEVICE_ID_LENGTH = 8;

const isStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const readDeviceIdFromStorage = (): string | null => {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const storedDeviceId = window.localStorage.getItem(DEVICE_ID_KEY);

    if (!storedDeviceId) {
      return null;
    }

    const normalizedDeviceId = storedDeviceId.trim();

    return normalizedDeviceId.length >= MIN_DEVICE_ID_LENGTH
      ? normalizedDeviceId
      : null;
  } catch {
    return null;
  }
};

const writeDeviceIdToStorage = (deviceId: string): void => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch {
  }
};

const createDeviceIdFallback = (): string => {
  const timestampPart = Date.now().toString(36);
  const randomPart = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(36)
      .padStart(6, '0'),
  ).join('');

  return `${timestampPart}-${randomPart}`;
};

const createDeviceId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return createDeviceIdFallback();
};

export const getOrCreateDeviceId = (): string => {
  const existingDeviceId = readDeviceIdFromStorage();

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const createdDeviceId = createDeviceId();
  writeDeviceIdToStorage(createdDeviceId);

  return createdDeviceId;
};


