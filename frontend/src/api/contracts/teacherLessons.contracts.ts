import type { TeacherLessonDTO } from '@/types/teacherDashboard.types';

import {
  isBoolean,
  isFiniteNumber,
  isNonEmptyString,
  isNullableString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

export const isTeacherLessonDTO = (value: unknown): value is TeacherLessonDTO => {
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
    isNullableString(value.videoUrl) &&
    isBoolean(value.hasPdf)
  );
};

export const parseTeacherLessonDTO = (value: unknown): TeacherLessonDTO => {
  if (!isTeacherLessonDTO(value)) {
    throw new Error('Invalid teacher lesson response: invalid lesson.');
  }

  return value;
};

export const parseTeacherLessonsDTO = (value: unknown): TeacherLessonDTO[] => {
  if (!Array.isArray(value) || !value.every(isTeacherLessonDTO)) {
    throw new Error('Invalid teacher lessons response: invalid items.');
  }

  return value;
};
