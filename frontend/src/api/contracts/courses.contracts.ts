import type { PaginatedDTO } from '@/types/pagination.types';
import type { CourseDTO } from '@/types/course.types';

import {
  isFiniteNumber,
  isNonEmptyString,
  isNullableString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

export const isCourseDTO = (value: unknown): value is CourseDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.ownerId) &&
    isNullableString(value.description) &&
    isNullableString(value.thumbnailUrl) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt)
  );
};

export const parseCoursesPaginatedResponse = (
  value: unknown,
): PaginatedDTO<CourseDTO> => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid courses response: expected object.');
  }

  const { items, total, page, limit } = value;

  if (!Array.isArray(items) || !items.every(isCourseDTO)) {
    throw new Error('Invalid courses response: invalid items.');
  }

  if (!isFiniteNumber(total) || !isFiniteNumber(page) || !isFiniteNumber(limit)) {
    throw new Error('Invalid courses response: invalid pagination.');
  }

  return { items, total, page, limit };
};

export const parseCourseDTO = (value: unknown): CourseDTO => {
  if (!isCourseDTO(value)) {
    throw new Error('Invalid course response: invalid course.');
  }

  return value;
};
