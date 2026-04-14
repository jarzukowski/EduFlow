import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseCourseDTO,
  parseCoursesPaginatedResponse,
} from '@/api/contracts/courses.contracts';

import type {
  CourseDTO,
  CreateCoursePayload,
  UpdateCoursePayload,
} from '@/types/course.types';

const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

const normalizePositiveInteger = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;

  const normalizedValue = Math.trunc(value);
  return normalizedValue > 0 ? normalizedValue : fallback;
};

const normalizeLimit = (value: number): number =>
  Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, normalizePositiveInteger(value, DEFAULT_LIMIT)));

const normalizeSearch = (value: string): string => value.trim();

const normalizeCourseId = (value: string): string => value.trim();

const isAbortError = (unknownError: unknown): boolean =>
  unknownError instanceof DOMException && unknownError.name === 'AbortError';

const upsertCourseInList = (
  courseList: CourseDTO[],
  nextCourse: CourseDTO,
): CourseDTO[] => {
  const existingCourseIndex = courseList.findIndex(
    (courseItem) => courseItem.id === nextCourse.id,
  );

  if (existingCourseIndex === -1) {
    return [nextCourse, ...courseList];
  }

  const nextCourseList = [...courseList];
  nextCourseList[existingCourseIndex] = nextCourse;

  return nextCourseList;
};

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref<CourseDTO[]>([]);
  const currentCourse = ref<CourseDTO | null>(null);

  const page = ref<number>(1);
  const limit = ref<number>(DEFAULT_LIMIT);
  const total = ref<number>(0);
  const search = ref<string>('');

  const listLoading = ref(false);
  const detailsLoading = ref(false);
  const mutationLoading = ref(false);

  const listError = ref<string | null>(null);
  const detailsError = ref<string | null>(null);
  const mutationError = ref<string | null>(null);

  const featuredCourses = ref<CourseDTO[]>([]);
  const featuredLoading = ref(false);
  const featuredError = ref<string | null>(null);

  const activeListRequestId = ref(0);
  const activeListAbortController = ref<AbortController | null>(null);

  const activeDetailsRequestId = ref(0);
  const activeDetailsAbortController = ref<AbortController | null>(null);

  const totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(total.value / limit.value)),
  );

  const loading = computed<boolean>(
    () => listLoading.value || detailsLoading.value || mutationLoading.value,
  );

  const error = computed<string | null>(
    () => listError.value ?? detailsError.value ?? mutationError.value,
  );

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

  const setPage = (nextPage: number): void => {
    page.value = normalizePositiveInteger(nextPage, 1);
  };

  const setSearch = (nextSearch: string): void => {
    search.value = normalizeSearch(nextSearch);
    page.value = 1;
  };

  const setLimit = (nextLimit: number): void => {
    limit.value = normalizeLimit(nextLimit);
    page.value = 1;
  };

  const clearCurrentCourse = (): void => {
    currentCourse.value = null;
    detailsError.value = null;
    detailsLoading.value = false;
  };

  const getCourseById = (courseId: string): CourseDTO | undefined => {
    const normalizedCourseId = normalizeCourseId(courseId);
    if (!normalizedCourseId) return undefined;

    if (currentCourse.value?.id === normalizedCourseId) {
      return currentCourse.value;
    }

    return courses.value.find((courseItem) => courseItem.id === normalizedCourseId);
  };

  const fetchCourses = async (): Promise<void> => {
    const { requestId, controller } = startListRequest();

    listLoading.value = true;
    listError.value = null;

    try {
      const normalizedSearch = normalizeSearch(search.value);

      const params: Record<string, string | number> = {
        page: page.value,
        limit: limit.value,
      };

      if (normalizedSearch.length > 0) {
        params.search = normalizedSearch;
      }

      const response = await apiClient.get<unknown>('/courses', {
        params,
        signal: controller.signal,
      });
      const parsedResponse = parseCoursesPaginatedResponse(response.data);

      if (requestId !== activeListRequestId.value) return;

      courses.value = parsedResponse.items;
      total.value = parsedResponse.total;
      page.value = parsedResponse.page;
      limit.value = normalizeLimit(parsedResponse.limit);

      const nextTotalPages = Math.max(1, Math.ceil(total.value / limit.value));

      if (page.value > nextTotalPages && total.value > 0) {
        page.value = 1;
        await fetchCourses();
      }
    } catch (unknownError: unknown) {
      if (isAbortError(unknownError)) return;
      if (requestId !== activeListRequestId.value) return;

      listError.value = getApiErrorMessage(
        unknownError,
        'Failed to load courses.',
      );
      courses.value = [];
    } finally {
      if (requestId === activeListRequestId.value) {
        listLoading.value = false;
      }
    }
  };

  const fetchFeaturedCourses = async (options?: { limit?: number }): Promise<void> => {
    featuredLoading.value = true;
    featuredError.value = null;

    const featuredLimit = normalizeLimit(options?.limit ?? DEFAULT_LIMIT);

    try {
      const response = await apiClient.get<unknown>('/courses', {
        params: {
          page: 1,
          limit: featuredLimit,
        },
      });
      const parsedResponse = parseCoursesPaginatedResponse(response.data);

      featuredCourses.value = parsedResponse.items;
    } catch (unknownError: unknown) {
      featuredError.value = getApiErrorMessage(
        unknownError,
        'Failed to load featured courses.',
      );
      featuredCourses.value = [];
    } finally {
      featuredLoading.value = false;
    }
  };

  const fetchCourseById = async (courseId: string): Promise<CourseDTO | null> => {
    const normalizedCourseId = normalizeCourseId(courseId);
    if (!normalizedCourseId) {
      clearCurrentCourse();
      return null;
    }

    const { requestId, controller } = startDetailsRequest();

    detailsLoading.value = true;
    detailsError.value = null;
    currentCourse.value = null;

    try {
      const response = await apiClient.get<unknown>(`/courses/${normalizedCourseId}`, {
        signal: controller.signal,
      });

      if (requestId !== activeDetailsRequestId.value) return null;

      const fetchedCourse = parseCourseDTO(response.data);

      currentCourse.value = fetchedCourse;
      courses.value = upsertCourseInList(courses.value, fetchedCourse);

      return fetchedCourse;
    } catch (unknownError: unknown) {
      if (isAbortError(unknownError)) return null;
      if (requestId !== activeDetailsRequestId.value) return null;

      detailsError.value = getApiErrorMessage(
        unknownError,
        'Failed to load course.',
      );
      currentCourse.value = null;

      return null;
    } finally {
      if (requestId === activeDetailsRequestId.value) {
        detailsLoading.value = false;
      }
    }
  };

  const createCourse = async (payload: CreateCoursePayload): Promise<CourseDTO> => {
    mutationLoading.value = true;
    mutationError.value = null;

    try {
      const response = await apiClient.post<unknown>('/courses', payload);
      const createdCourse = parseCourseDTO(response.data);

      currentCourse.value = createdCourse;
      courses.value = upsertCourseInList(courses.value, createdCourse);
      total.value += 1;

      return createdCourse;
    } catch (unknownError: unknown) {
      mutationError.value = getApiErrorMessage(
        unknownError,
        'Failed to create course.',
      );
      throw unknownError;
    } finally {
      mutationLoading.value = false;
    }
  };

  const updateCourse = async (
    courseId: string,
    payload: UpdateCoursePayload,
  ): Promise<CourseDTO> => {
    const normalizedCourseId = normalizeCourseId(courseId);

    mutationLoading.value = true;
    mutationError.value = null;

    try {
      const response = await apiClient.put<unknown>(
        `/courses/${normalizedCourseId}`,
        payload,
      );

      const updatedCourse = parseCourseDTO(response.data);

      currentCourse.value = updatedCourse;
      courses.value = upsertCourseInList(courses.value, updatedCourse);

      return updatedCourse;
    } catch (unknownError: unknown) {
      mutationError.value = getApiErrorMessage(
        unknownError,
        'Failed to update course.',
      );
      throw unknownError;
    } finally {
      mutationLoading.value = false;
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    const normalizedCourseId = normalizeCourseId(courseId);

    mutationLoading.value = true;
    mutationError.value = null;

    try {
      await apiClient.delete(`/courses/${normalizedCourseId}`);

      courses.value = courses.value.filter(
        (courseItem) => courseItem.id !== normalizedCourseId,
      );

      if (currentCourse.value?.id === normalizedCourseId) {
        currentCourse.value = null;
      }

      total.value = Math.max(0, total.value - 1);
    } catch (unknownError: unknown) {
      mutationError.value = getApiErrorMessage(
        unknownError,
        'Failed to delete course.',
      );
      throw unknownError;
    } finally {
      mutationLoading.value = false;
    }
  };

  return {
    courses,
    currentCourse,

    page,
    limit,
    total,
    totalPages,
    search,

    listLoading,
    detailsLoading,
    mutationLoading,
    loading,

    listError,
    detailsError,
    mutationError,
    error,

    featuredCourses,
    featuredLoading,
    featuredError,

    setPage,
    setSearch,
    setLimit,
    clearCurrentCourse,
    getCourseById,
    fetchCourses,
    fetchFeaturedCourses,
    fetchCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
  };
});

