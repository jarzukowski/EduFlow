import type {
  StudentCourseDTO,
  StudentLessonDTO,
  UpdateLessonCompletionResponseDTO,
} from '@/types/studentDashboard.types';

import {
  isBoolean,
  isFiniteNumber,
  isNonEmptyString,
  isNullableString,
  isPlainObject,
} from '@/api/contracts/contract.utils';

export const isStudentCourseDTO = (value: unknown): value is StudentCourseDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  const description = value.description;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    (description === undefined || isNullableString(description)) &&
    isFiniteNumber(value.lessonsCount) &&
    isFiniteNumber(value.completedLessonsCount) &&
    isFiniteNumber(value.totalDurationMinutes)
  );
};

export const isStudentLessonDTO = (value: unknown): value is StudentLessonDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.courseId) &&
    isNonEmptyString(value.title) &&
    isFiniteNumber(value.orderIndex) &&
    isNullableString(value.content) &&
    (value.durationMinutes === null || isFiniteNumber(value.durationMinutes)) &&
    isNullableString(value.videoUrl) &&
    isBoolean(value.hasPdf) &&
    isBoolean(value.completed)
  );
};

export const parseStudentCoursesDTO = (value: unknown): StudentCourseDTO[] => {
  if (!Array.isArray(value) || !value.every(isStudentCourseDTO)) {
    throw new Error('Invalid student courses response: invalid items.');
  }

  return value;
};

export const parseStudentLessonsDTO = (value: unknown): StudentLessonDTO[] => {
  if (!Array.isArray(value) || !value.every(isStudentLessonDTO)) {
    throw new Error('Invalid student lessons response: invalid items.');
  }

  return value;
};

export const parseUpdateLessonCompletionResponseDTO = (
  value: unknown,
): UpdateLessonCompletionResponseDTO => {
  if (
    !isPlainObject(value) ||
    !isNonEmptyString(value.lessonId) ||
    !isBoolean(value.completed) ||
    !isFiniteNumber(value.completedLessonsCount)
  ) {
    throw new Error('Invalid lesson completion response: invalid payload.');
  }

  return {
    lessonId: value.lessonId,
    completed: value.completed,
    completedLessonsCount: value.completedLessonsCount,
  };
};
