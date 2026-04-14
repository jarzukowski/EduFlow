import type {
  RevokeSessionResponseDTO,
  SessionDTO,
  SessionsResponseDTO,
} from '@/types/sessions.types';

import {
  isBoolean,
  isNonEmptyString,
  isNullableString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

export const isSessionDTO = (value: unknown): value is SessionDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.createdAt) &&
    isNullableString(value.lastUsedAt) &&
    isNonEmptyString(value.expiresAt) &&
    isNullableString(value.revokedAt) &&
    isNullableString(value.ip) &&
    isNullableString(value.userAgent) &&
    isBoolean(value.isCurrent)
  );
};

export const parseSessionsResponseDTO = (value: unknown): SessionsResponseDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid sessions response: payload must be an object.');
  }

  if (!Array.isArray(value.items)) {
    throw new Error('Invalid sessions response: items must be an array.');
  }

  if (!value.items.every(isSessionDTO)) {
    throw new Error('Invalid sessions response: invalid session item.');
  }

  return {
    items: value.items,
  };
};

export const parseRevokeSessionResponseDTO = (
  value: unknown,
): RevokeSessionResponseDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid revoke session response: payload must be an object.');
  }

  if (!isNonEmptyString(value.revokedId) || !isBoolean(value.wasCurrent)) {
    throw new Error('Invalid revoke session response: invalid payload.');
  }

  return {
    revokedId: value.revokedId,
    wasCurrent: value.wasCurrent,
  };
};
