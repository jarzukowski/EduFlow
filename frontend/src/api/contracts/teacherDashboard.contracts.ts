import type {
  CourseEnrollmentListItemDTO,
  EnrollStudentResponseDTO,
  GetCourseEnrollmentsResponseDTO,
  StudentSuggestDTO,
  TeacherCourseSummaryDTO,
  UnenrollStudentResponseDTO,
} from '@/types/teacherDashboard.types';

import {
  isFiniteNumber,
  isNonEmptyString,
  isPlainObject,
  isString,
} from '@/api/contracts/contract.utils';

export const isTeacherCourseSummaryDTO = (
  value: unknown,
): value is TeacherCourseSummaryDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isString(value.description) &&
    isFiniteNumber(value.studentsCount) &&
    isFiniteNumber(value.lessonsCount) &&
    isFiniteNumber(value.totalDurationMinutes)
  );
};

export const isCourseEnrollmentListItemDTO = (
  value: unknown,
): value is CourseEnrollmentListItemDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.studentId) &&
    isNonEmptyString(value.emailMasked) &&
    isNonEmptyString(value.displayName) &&
    isNonEmptyString(value.enrolledAt)
  );
};

export const isStudentSuggestDTO = (value: unknown): value is StudentSuggestDTO => {
  if (!isPlainObject(value)) {
    return false;
  }

  const displayName = value.displayName;

  return (
    isNonEmptyString(value.userId) &&
    isNonEmptyString(value.emailMasked) &&
    (displayName === undefined || isString(displayName))
  );
};

export const parseTeacherCoursesDTO = (value: unknown): TeacherCourseSummaryDTO[] => {
  if (!Array.isArray(value) || !value.every(isTeacherCourseSummaryDTO)) {
    throw new Error('Invalid teacher courses response: invalid items.');
  }

  return value;
};

export const parseGetCourseEnrollmentsResponseDTO = (
  value: unknown,
): GetCourseEnrollmentsResponseDTO => {
  if (!isPlainObject(value)) {
    throw new Error('Invalid enrollments response: expected object.');
  }

  const { items, total, page, limit } = value;

  if (!Array.isArray(items) || !items.every(isCourseEnrollmentListItemDTO)) {
    throw new Error('Invalid enrollments response: invalid items.');
  }

  if (!isFiniteNumber(total) || !isFiniteNumber(page) || !isFiniteNumber(limit)) {
    throw new Error('Invalid enrollments response: invalid pagination.');
  }

  return { items, total, page, limit };
};

export const parseEnrollStudentResponseDTO = (
  value: unknown,
): EnrollStudentResponseDTO => {
  if (
    !isPlainObject(value) ||
    !isFiniteNumber(value.studentsCount) ||
    !isCourseEnrollmentListItemDTO(value.enrollment)
  ) {
    throw new Error('Invalid enroll student response: invalid payload.');
  }

  return {
    studentsCount: value.studentsCount,
    enrollment: value.enrollment,
  };
};

export const parseUnenrollStudentResponseDTO = (
  value: unknown,
): UnenrollStudentResponseDTO => {
  if (
    !isPlainObject(value) ||
    !isFiniteNumber(value.studentsCount) ||
    !isNonEmptyString(value.removedStudentId)
  ) {
    throw new Error('Invalid unenroll student response: invalid payload.');
  }

  return {
    studentsCount: value.studentsCount,
    removedStudentId: value.removedStudentId,
  };
};

export const parseStudentSuggestDTOArray = (value: unknown): StudentSuggestDTO[] => {
  if (!Array.isArray(value) || !value.every(isStudentSuggestDTO)) {
    throw new Error('Invalid student suggest response: invalid items.');
  }

  return value;
};
