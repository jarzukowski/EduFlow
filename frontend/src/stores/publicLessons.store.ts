import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parsePublicLessonDTO,
  parsePublicLessonsDTO,
} from '@/api/contracts/publicLessons.contracts';

import type { PublicLessonDTO } from '@/types/lesson.types';

const normalizeLessonId = (value: string): string => value.trim();
const normalizeCourseId = (value: string): string => value.trim();

const isAbortError = (unknownError: unknown): boolean =>
  unknownError instanceof DOMException && unknownError.name === 'AbortError';

const sortLessonsByOrderIndex = (lessonList: PublicLessonDTO[]): PublicLessonDTO[] =>
  [...lessonList].sort(
    (firstLesson, secondLesson) => firstLesson.orderIndex - secondLesson.orderIndex,
  );

export const usePublicLessonsStore = defineStore('publicLessons', () => {
  const lessonsByCourseId = ref<Record<string, PublicLessonDTO[]>>({});
  const lessonById = ref<Record<string, PublicLessonDTO>>({});

  const activeCourseId = ref<string | null>(null);
  const currentLessonId = ref<string | null>(null);

  const listLoading = ref(false);
  const detailsLoading = ref(false);

  const listError = ref<string | null>(null);
  const detailsError = ref<string | null>(null);

  const activeListRequestId = ref(0);
  const activeListAbortController = ref<AbortController | null>(null);

  const activeDetailsRequestId = ref(0);
  const activeDetailsAbortController = ref<AbortController | null>(null);

  const loading = computed<boolean>(() => listLoading.value || detailsLoading.value);
  const error = computed<string | null>(() => listError.value ?? detailsError.value);

  const activeCourseLessons = computed<PublicLessonDTO[]>(() => {
    const normalizedActiveCourseId = activeCourseId.value;
    if (!normalizedActiveCourseId) return [];

    return lessonsByCourseId.value[normalizedActiveCourseId] ?? [];
  });

  const currentLesson = computed<PublicLessonDTO | null>(() => {
    const normalizedCurrentLessonId = currentLessonId.value;
    if (!normalizedCurrentLessonId) return null;

    return lessonById.value[normalizedCurrentLessonId] ?? null;
  });

  const startListRequest = (): { requestId: number; controller: AbortController } => {
    activeListRequestId.value += 1;
    const requestId = activeListRequestId.value;

    if (activeListAbortController.value) {
      activeListAbortController.value.abort();
    }

    const controller = new AbortController();
    activeListAbortController.value = controller;

    return { requestId, controller };
  };

  const startDetailsRequest = (): { requestId: number; controller: AbortController } => {
    activeDetailsRequestId.value += 1;
    const requestId = activeDetailsRequestId.value;

    if (activeDetailsAbortController.value) {
      activeDetailsAbortController.value.abort();
    }

    const controller = new AbortController();
    activeDetailsAbortController.value = controller;

    return { requestId, controller };
  };

  const cacheLesson = (lesson: PublicLessonDTO): void => {
    lessonById.value = {
      ...lessonById.value,
      [lesson.id]: lesson,
    };
  };

  const cacheLessonsForCourse = (courseId: string, lessonList: PublicLessonDTO[]): void => {
    const sortedLessonList = sortLessonsByOrderIndex(lessonList);

    const nextLessonById = { ...lessonById.value };

    for (const lessonItem of sortedLessonList) {
      nextLessonById[lessonItem.id] = lessonItem;
    }

    lessonById.value = nextLessonById;
    lessonsByCourseId.value = {
      ...lessonsByCourseId.value,
      [courseId]: sortedLessonList,
    };
  };

  const clearActiveCourse = (): void => {
    activeCourseId.value = null;
    listError.value = null;
    listLoading.value = false;
  };

  const clearCurrentLesson = (): void => {
    currentLessonId.value = null;
    detailsError.value = null;
    detailsLoading.value = false;
  };

  const getLessonsForCourse = (courseId: string): PublicLessonDTO[] => {
    const normalizedCourseId = normalizeCourseId(courseId);
    if (!normalizedCourseId) return [];

    return lessonsByCourseId.value[normalizedCourseId] ?? [];
  };

  const getLessonById = (lessonId: string): PublicLessonDTO | undefined => {
    const normalizedLessonId = normalizeLessonId(lessonId);
    if (!normalizedLessonId) return undefined;

    return lessonById.value[normalizedLessonId];
  };

  const fetchLessonsForCourse = async (courseId: string): Promise<PublicLessonDTO[]> => {
    const normalizedCourseId = normalizeCourseId(courseId);
    if (!normalizedCourseId) {
      clearActiveCourse();
      return [];
    }

    const { requestId, controller } = startListRequest();

    activeCourseId.value = normalizedCourseId;
    listLoading.value = true;
    listError.value = null;

    lessonsByCourseId.value = {
      ...lessonsByCourseId.value,
      [normalizedCourseId]: [],
    };

    try {
      const response = await apiClient.get<unknown>(
        `/courses/${normalizedCourseId}/lessons`,
        { signal: controller.signal },
      );

      if (requestId !== activeListRequestId.value) {
        return [];
      }

      const fetchedLessons = sortLessonsByOrderIndex(parsePublicLessonsDTO(response.data));
      cacheLessonsForCourse(normalizedCourseId, fetchedLessons);

      return fetchedLessons;
    } catch (unknownError: unknown) {
      if (isAbortError(unknownError)) return [];
      if (requestId !== activeListRequestId.value) return [];

      listError.value = getApiErrorMessage(
        unknownError,
        'Failed to load lessons.',
      );

      lessonsByCourseId.value = {
        ...lessonsByCourseId.value,
        [normalizedCourseId]: [],
      };

      return [];
    } finally {
      if (requestId === activeListRequestId.value) {
        listLoading.value = false;
      }
    }
  };

  const fetchLessonById = async (lessonId: string): Promise<PublicLessonDTO | null> => {
    const normalizedLessonId = normalizeLessonId(lessonId);
    if (!normalizedLessonId) {
      clearCurrentLesson();
      return null;
    }

    const { requestId, controller } = startDetailsRequest();

    currentLessonId.value = null;
    detailsLoading.value = true;
    detailsError.value = null;

    try {
      const response = await apiClient.get<unknown>(
        `/lessons/${normalizedLessonId}`,
        { signal: controller.signal },
      );

      if (requestId !== activeDetailsRequestId.value) {
        return null;
      }

      const fetchedLesson = parsePublicLessonDTO(response.data);

      cacheLesson(fetchedLesson);

      const existingCourseLessons = getLessonsForCourse(fetchedLesson.courseId);
      const nextCourseLessons = sortLessonsByOrderIndex(
        existingCourseLessons.some(
          (lessonItem) => lessonItem.id === fetchedLesson.id,
        )
          ? existingCourseLessons.map((lessonItem) =>
            lessonItem.id === fetchedLesson.id ? fetchedLesson : lessonItem,
          )
          : [...existingCourseLessons, fetchedLesson],
      );

      lessonsByCourseId.value = {
        ...lessonsByCourseId.value,
        [fetchedLesson.courseId]: nextCourseLessons,
      };

      currentLessonId.value = fetchedLesson.id;

      return fetchedLesson;
    } catch (unknownError: unknown) {
      if (isAbortError(unknownError)) return null;
      if (requestId !== activeDetailsRequestId.value) return null;

      detailsError.value = getApiErrorMessage(
        unknownError,
        'Failed to load lessons.',
      );
      currentLessonId.value = null;

      return null;
    } finally {
      if (requestId === activeDetailsRequestId.value) {
        detailsLoading.value = false;
      }
    }
  };

  return {
    lessonsByCourseId,
    lessonById,
    activeCourseId,
    currentLessonId,

    activeCourseLessons,
    currentLesson,

    listLoading,
    detailsLoading,
    loading,

    listError,
    detailsError,
    error,

    clearActiveCourse,
    clearCurrentLesson,
    getLessonsForCourse,
    getLessonById,
    fetchLessonsForCourse,
    fetchLessonById,
  };
});

