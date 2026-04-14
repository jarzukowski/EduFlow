import type { PublicLessonDTO } from '@/types/lesson.types';

import {
  isFiniteNumber,
  isNonEmptyString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

export const isPublicLessonDTO = (value: unknown): value is PublicLessonDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.courseId) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.content) &&
    isFiniteNumber(value.orderIndex) &&
    (value.durationMinutes === null || isFiniteNumber(value.durationMinutes)) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt)
  );
};

export const parsePublicLessonDTO = (value: unknown): PublicLessonDTO => {
  if (!isPublicLessonDTO(value)) {
    throw new Error('Invalid public lesson response: invalid lesson.');
  }

  return value;
};

export const parsePublicLessonsDTO = (value: unknown): PublicLessonDTO[] => {
  if (!Array.isArray(value) || !value.every(isPublicLessonDTO)) {
    throw new Error('Invalid public lessons response: invalid items.');
  }

  return value;
};
