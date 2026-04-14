import type {
  AdminCourseDTO,
  AdminStatsDTO,
  AdminUserDTO,
  AdminUserStatus,
  SendAdminMessageResponseDTO,
  SendAdminNotificationResponseDTO,
  UserRole,
} from '@/types/admin.types';
import type { PaginatedDTO } from '@/types/admin.types';

import {
  isFiniteNumber,
  isNonEmptyString,
  isNullableString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

const USER_ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const satisfies readonly UserRole[];
const ADMIN_USER_STATUSES = ['ACTIVE', 'BLOCKED'] as const satisfies readonly AdminUserStatus[];

const USER_ROLE_SET: ReadonlySet<string> = new Set(USER_ROLES);
const ADMIN_USER_STATUS_SET: ReadonlySet<string> = new Set(ADMIN_USER_STATUSES);

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLE_SET.has(value);

const isAdminUserStatus = (value: unknown): value is AdminUserStatus =>
  typeof value === 'string' && ADMIN_USER_STATUS_SET.has(value);

export const isAdminUserDTO = (value: unknown): value is AdminUserDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.username) &&
    isUserRole(value.role) &&
    isAdminUserStatus(value.status) &&
    isNonEmptyString(value.createdAt) &&
    isNullableString(value.lastLoginAt)
  );
};

export const isAdminCourseDTO = (value: unknown): value is AdminCourseDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.ownerEmail) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt)
  );
};

const parsePaginatedResponse = <TItem>(
  value: unknown,
  isItem: (input: unknown) => input is TItem,
  name: string,
): PaginatedDTO<TItem> => {
  if (!isPlainObject(value)) {
    throw new Error(`Invalid ${name} response: expected object.`);
  }

  const { items, total, page, limit } = value;

  if (!Array.isArray(items) || !items.every(isItem)) {
    throw new Error(`Invalid ${name} response: invalid items.`);
  }

  if (!isFiniteNumber(total) || !isFiniteNumber(page) || !isFiniteNumber(limit)) {
    throw new Error(`Invalid ${name} response: invalid pagination.`);
  }

  return { items, total, page, limit };
};

export const parseAdminStatsDTO = (value: unknown): AdminStatsDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid admin stats response: expected object.');
  }

  if (!isFiniteNumber(value.totalUsers) || !isFiniteNumber(value.totalCourses)) {
    throw new Error('Invalid admin stats response: invalid values.');
  }

  return {
    totalUsers: value.totalUsers,
    totalCourses: value.totalCourses,
  };
};

export const parseAdminUsersResponse = (
  value: unknown,
): PaginatedDTO<AdminUserDTO> => parsePaginatedResponse(value, isAdminUserDTO, 'admin users');

export const parseAdminCoursesResponse = (
  value: unknown,
): PaginatedDTO<AdminCourseDTO> => parsePaginatedResponse(value, isAdminCourseDTO, 'admin courses');

export const parseSendAdminNotificationResponseDTO = (
  value: unknown,
): SendAdminNotificationResponseDTO => {
  if (!isPlainObject(value) || !isFiniteNumber(value.createdCount)) {
    throw new Error('Invalid admin notification response: invalid createdCount.');
  }

  return {
    createdCount: value.createdCount,
  };
};

export const parseSendAdminMessageResponseDTO = (
  value: unknown,
): SendAdminMessageResponseDTO => {
  if (!isPlainObject(value) || !isFiniteNumber(value.sentCount)) {
    throw new Error('Invalid admin message response: invalid sentCount.');
  }

  const conversationId = value.conversationId;

  if (conversationId !== undefined && !isNonEmptyString(conversationId)) {
    throw new Error('Invalid admin message response: invalid conversationId.');
  }

  return conversationId === undefined
    ? { sentCount: value.sentCount }
    : { sentCount: value.sentCount, conversationId };
};

