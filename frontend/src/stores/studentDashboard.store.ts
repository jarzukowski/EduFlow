import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseStudentCoursesDTO,
  parseStudentLessonsDTO,
  parseUpdateLessonCompletionResponseDTO,
} from '@/api/contracts/studentDashboard.contracts';

import type {
  StudentCourseDTO,
  StudentLessonDTO,
  StudentProgressMetrics,
  UpdateLessonCompletionRequestDTO,
} from '@/types/studentDashboard.types';

const normalizeId = (value: string): string => value.trim();

const sortLessonsByOrderIndex = (lessons: StudentLessonDTO[]): StudentLessonDTO[] => {
  return [...lessons].sort(
    (firstLesson, secondLesson) => firstLesson.orderIndex - secondLesson.orderIndex,
  );
};

const buildProgressMetrics = (
  totalLessons: number,
  completedLessons: number,
): StudentProgressMetrics => {
  const safeTotalLessons = Math.max(0, totalLessons);
  const safeCompletedLessons = Math.max(0, completedLessons);

  if (safeTotalLessons === 0) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
    };
  }

  return {
    totalLessons: safeTotalLessons,
    completedLessons: safeCompletedLessons,
    percent: Math.round((safeCompletedLessons / safeTotalLessons) * 100),
  };
};

export const useStudentDashboardStore = defineStore('studentDashboard', () => {
  const courses = ref<StudentCourseDTO[]>([]);
  const coursesLoading = ref(false);
  const coursesError = ref<string | null>(null);

  const selectedCourseId = ref<string | null>(null);
  const expandedCourseId = ref<string | null>(null);

  const lessonsByCourseId = ref<Record<string, StudentLessonDTO[]>>({});
  const lessonsLoadingByCourseId = ref<Record<string, boolean>>({});
  const lessonsErrorByCourseId = ref<Record<string, string | null>>({});
  const lessonsRequestSequenceByCourseId = ref<Record<string, number>>({});

  const completionBusyByLessonId = ref<Record<string, boolean>>({});
  const completionErrorByLessonId = ref<Record<string, string | null>>({});

  const selectedCourse = computed<StudentCourseDTO | null>(() => {
    const activeCourseId = selectedCourseId.value ?? expandedCourseId.value;

    if (!activeCourseId) {
      return null;
    }

    return courses.value.find((course) => course.id === activeCourseId) ?? null;
  });

  const overallProgress = computed<StudentProgressMetrics>(() => {
    const totalLessons = courses.value.reduce(
      (accumulator, course) => accumulator + course.lessonsCount,
      0,
    );

    const completedLessons = courses.value.reduce(
      (accumulator, course) => accumulator + course.completedLessonsCount,
      0,
    );

    return buildProgressMetrics(totalLessons, completedLessons);
  });

  const courseProgress = computed<StudentProgressMetrics>(() => {
    const currentCourse = selectedCourse.value;

    if (!currentCourse) {
      return buildProgressMetrics(0, 0);
    }

    return buildProgressMetrics(
      currentCourse.lessonsCount,
      currentCourse.completedLessonsCount,
    );
  });

  const isCompletionBusy = (lessonId: string): boolean => {
    return Boolean(completionBusyByLessonId.value[lessonId]);
  };

  const getCompletionError = (lessonId: string): string | null => {
    return completionErrorByLessonId.value[lessonId] ?? null;
  };

  const syncSelectedAndExpandedCourse = (nextCourses: StudentCourseDTO[]): string | null => {
    const currentSelectedCourseId = selectedCourseId.value;
    const currentExpandedCourseId = expandedCourseId.value;

    const selectedCourseStillExists = currentSelectedCourseId
      ? nextCourses.some((course) => course.id === currentSelectedCourseId)
      : false;

    const expandedCourseStillExists = currentExpandedCourseId
      ? nextCourses.some((course) => course.id === currentExpandedCourseId)
      : false;

    if (selectedCourseStillExists && expandedCourseStillExists) {
      return currentSelectedCourseId;
    }

    const firstCourse = nextCourses[0] ?? null;

    if (!firstCourse) {
      selectedCourseId.value = null;
      expandedCourseId.value = null;

      return null;
    }

    selectedCourseId.value = firstCourse.id;
    expandedCourseId.value = firstCourse.id;

    return firstCourse.id;
  };

  const fetchLessonsForCourse = async (
    courseId: string,
    options?: { force?: boolean },
  ): Promise<void> => {
    const normalizedCourseId = normalizeId(courseId);

    if (!normalizedCourseId) {
      return;
    }

    const shouldUseCache = !options?.force && Boolean(lessonsByCourseId.value[normalizedCourseId]);

    if (shouldUseCache) {
      return;
    }

    if (lessonsLoadingByCourseId.value[normalizedCourseId] && !options?.force) {
      return;
    }

    const nextRequestSequence =
      (lessonsRequestSequenceByCourseId.value[normalizedCourseId] ?? 0) + 1;

    lessonsRequestSequenceByCourseId.value[normalizedCourseId] = nextRequestSequence;
    lessonsLoadingByCourseId.value[normalizedCourseId] = true;
    lessonsErrorByCourseId.value[normalizedCourseId] = null;

    try {
      const response = await apiClient.get<unknown>(
        `/student/courses/${normalizedCourseId}/lessons`,
      );

      const requestSequenceStillCurrent =
        lessonsRequestSequenceByCourseId.value[normalizedCourseId] === nextRequestSequence;

      if (!requestSequenceStillCurrent) {
        return;
      }

      lessonsByCourseId.value[normalizedCourseId] = sortLessonsByOrderIndex(
        parseStudentLessonsDTO(response.data),
      );
    } catch (unknownError: unknown) {
      const requestSequenceStillCurrent =
        lessonsRequestSequenceByCourseId.value[normalizedCourseId] === nextRequestSequence;

      if (!requestSequenceStillCurrent) {
        return;
      }

      lessonsErrorByCourseId.value[normalizedCourseId] = getApiErrorMessage(
        unknownError,
        'Failed to load lessons.',
      );
      lessonsByCourseId.value[normalizedCourseId] = [];
    } finally {
      const requestSequenceStillCurrent =
        lessonsRequestSequenceByCourseId.value[normalizedCourseId] === nextRequestSequence;

      if (requestSequenceStillCurrent) {
        lessonsLoadingByCourseId.value[normalizedCourseId] = false;
      }
    }
  };

  const fetchStudentCourses = async (): Promise<void> => {
    coursesLoading.value = true;
    coursesError.value = null;

    try {
      const response = await apiClient.get<unknown>('/student/courses');
      const nextCourses = parseStudentCoursesDTO(response.data);

      courses.value = nextCourses;

      const activeCourseId = syncSelectedAndExpandedCourse(nextCourses);

      if (activeCourseId) {
        await fetchLessonsForCourse(activeCourseId, { force: false });
      }
    } catch (unknownError: unknown) {
      coursesError.value = getApiErrorMessage(
        unknownError,
        'Failed to load student courses.',
      );
      courses.value = [];
      selectedCourseId.value = null;
      expandedCourseId.value = null;
    } finally {
      coursesLoading.value = false;
    }
  };

  const selectCourse = async (courseId: string): Promise<void> => {
    const normalizedCourseId = normalizeId(courseId);

    if (!normalizedCourseId) {
      return;
    }

    selectedCourseId.value = normalizedCourseId;
    expandedCourseId.value = normalizedCourseId;

    await fetchLessonsForCourse(normalizedCourseId, { force: false });
  };

  const toggleCourse = async (courseId: string): Promise<void> => {
    const normalizedCourseId = normalizeId(courseId);

    if (!normalizedCourseId) {
      return;
    }

    const shouldCollapseCourse = expandedCourseId.value === normalizedCourseId;

    if (shouldCollapseCourse) {
      expandedCourseId.value = null;
      return;
    }

    expandedCourseId.value = normalizedCourseId;
    selectedCourseId.value = normalizedCourseId;

    await fetchLessonsForCourse(normalizedCourseId, { force: false });
  };

  const updateLessonCompletion = async (
    courseId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<void> => {
    const normalizedCourseId = normalizeId(courseId);
    const normalizedLessonId = normalizeId(lessonId);

    if (!normalizedCourseId || !normalizedLessonId) {
      return;
    }

    if (isCompletionBusy(normalizedLessonId)) {
      return;
    }

    completionBusyByLessonId.value[normalizedLessonId] = true;
    completionErrorByLessonId.value[normalizedLessonId] = null;

    const previousLessons = lessonsByCourseId.value[normalizedCourseId] ?? [];

    lessonsByCourseId.value[normalizedCourseId] = previousLessons.map((lesson) => {
      if (lesson.id !== normalizedLessonId) {
        return lesson;
      }

      return {
        ...lesson,
        completed,
      };
    });

    try {
      const requestBody: UpdateLessonCompletionRequestDTO = { completed };

      const response = await apiClient.put<unknown>(
        `/student/lessons/${normalizedLessonId}/completion`,
        requestBody,
      );
      const parsedResponse = parseUpdateLessonCompletionResponseDTO(response.data);

      courses.value = courses.value.map((course) => {
        if (course.id !== normalizedCourseId) {
          return course;
        }

        return {
          ...course,
          completedLessonsCount: parsedResponse.completedLessonsCount,
        };
      });
    } catch (unknownError: unknown) {
      completionErrorByLessonId.value[normalizedLessonId] = getApiErrorMessage(
        unknownError,
        'Failed to save completion status.',
      );

      lessonsByCourseId.value[normalizedCourseId] = previousLessons;
      throw unknownError;
    } finally {
      completionBusyByLessonId.value[normalizedLessonId] = false;
    }
  };

  return {
    courses,
    coursesLoading,
    coursesError,

    selectedCourseId,
    expandedCourseId,

    lessonsByCourseId,
    lessonsLoadingByCourseId,
    lessonsErrorByCourseId,

    selectedCourse,
    overallProgress,
    courseProgress,

    fetchStudentCourses,
    fetchLessonsForCourse,
    selectCourse,
    toggleCourse,

    isCompletionBusy,
    getCompletionError,
    updateLessonCompletion,
  };
});

