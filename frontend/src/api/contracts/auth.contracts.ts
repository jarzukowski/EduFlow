import type {
  AuthUser,
  LoginResponse,
  MeResponse,
  RefreshResponse,
  UserRole,
} from '@/types/auth.types';

import {
  isNonEmptyString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

const USER_ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const satisfies readonly UserRole[];

const USER_ROLE_SET: ReadonlySet<string> = new Set(USER_ROLES);

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLE_SET.has(value);

export const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.username) &&
    isUserRole(value.role)
  );
};

export const parseLoginResponse = (value: unknown): LoginResponse => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid login response: expected object.');
  }

  if (!isAuthUser(value.user)) {
    throw new Error('Invalid login response: invalid user.');
  }

  if (!isPlainObject(value.tokens) || !isNonEmptyString(value.tokens.accessToken)) {
    throw new Error('Invalid login response: invalid tokens.');
  }

  return {
    user: value.user,
    tokens: {
      accessToken: value.tokens.accessToken,
    },
  };
};

export const parseMeResponse = (value: unknown): MeResponse => {
  if (!isPlainObject(value) || !isAuthUser(value.user)) {
    throw new Error('Invalid me response: invalid user.');
  }

  return {
    user: value.user,
  };
};

export const parseRefreshResponse = (value: unknown): RefreshResponse => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid refresh response: expected object.');
  }

  if (!isPlainObject(value.tokens) || !isNonEmptyString(value.tokens.accessToken)) {
    throw new Error('Invalid refresh response: invalid tokens.');
  }

  return {
    tokens: {
      accessToken: value.tokens.accessToken,
    },
  };
};

