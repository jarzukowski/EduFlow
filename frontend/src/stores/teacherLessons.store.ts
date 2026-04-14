import { ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseTeacherLessonDTO,
  parseTeacherLessonsDTO,
} from '@/api/contracts/teacherLessons.contracts';

import type { TeacherLessonDTO } from '@/types/teacherDashboard.types';
import type {
  LessonCreatePayload,
  LessonUpdatePayload,
} from '@/types/lesson.types';

const sortByOrderIndex = (lessons: TeacherLessonDTO[]): TeacherLessonDTO[] => {
  return [...lessons].sort((firstLesson, secondLesson) => {
    return firstLesson.orderIndex - secondLesson.orderIndex;
  });
};

const buildLessonFormData = (
  payload: LessonCreatePayload | LessonUpdatePayload,
  pdfFile?: File | null,
): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (value === null) {
      formData.append(key, '');
      return;
    }

    formData.append(key, String(value));
  });

  if (pdfFile) {
    formData.append('pdf', pdfFile);
  }

  return formData;
};

export const useTeacherLessonsStore = defineStore('teacherLessons', () => {
  const lessonsByCourseId = ref<Record<string, TeacherLessonDTO[]>>({});
  const lessonsLoadingByCourseId = ref<Record<string, boolean>>({});
  const lessonsErrorByCourseId = ref<Record<string, string | null>>({});

  const lessonBusyByLessonId = ref<Record<string, boolean>>({});
  const lessonErrorByLessonId = ref<Record<string, string | null>>({});

  const setLessonBusy = (lessonId: string, value: boolean): void => {
    lessonBusyByLessonId.value[lessonId] = value;
  };

  const setManyLessonsBusy = (lessonIds: string[], value: boolean): void => {
    lessonIds.forEach((lessonId) => {
      lessonBusyByLessonId.value[lessonId] = value;
    });
  };

  const isLessonBusy = (lessonId: string): boolean => {
    return Boolean(lessonBusyByLessonId.value[lessonId]);
  };

  const setLessonError = (lessonId: string, error: string | null): void => {
    lessonErrorByLessonId.value[lessonId] = error;
  };

  const getLessonError = (lessonId: string): string | null => {
    return lessonErrorByLessonId.value[lessonId] ?? null;
  };

  const setCourseLoading = (courseId: string, value: boolean): void => {
    lessonsLoadingByCourseId.value[courseId] = value;
  };

  const setCourseError = (courseId: string, error: string | null): void => {
    lessonsErrorByCourseId.value[courseId] = error;
  };

  const getCourseLessons = (courseId: string): TeacherLessonDTO[] => {
    return lessonsByCourseId.value[courseId] ?? [];
  };

  const setCourseLessons = (courseId: string, lessons: TeacherLessonDTO[]): void => {
    lessonsByCourseId.value[courseId] = sortByOrderIndex(lessons);
  };

  const replaceLessonInCache = (courseId: string, lesson: TeacherLessonDTO): void => {
    const cachedLessons = getCourseLessons(courseId);

    if (cachedLessons.length === 0) {
      return;
    }

    setCourseLessons(
      courseId,
      cachedLessons.map((cachedLesson) => {
        return cachedLesson.id === lesson.id ? lesson : cachedLesson;
      }),
    );
  };

  const insertLessonIntoCache = (courseId: string, lesson: TeacherLessonDTO): void => {
    const cachedLessons = getCourseLessons(courseId);

    if (cachedLessons.some((cachedLesson) => cachedLesson.id === lesson.id)) {
      return;
    }

    setCourseLessons(courseId, [lesson, ...cachedLessons]);
  };

  const removeLessonFromCache = (courseId: string, lessonId: string): void => {
    const cachedLessons = getCourseLessons(courseId);

    if (cachedLessons.length === 0) {
      return;
    }

    setCourseLessons(
      courseId,
      cachedLessons.filter((cachedLesson) => cachedLesson.id !== lessonId),
    );
  };

  const clearCourseLessons = (courseId: string): void => {
    const cachedLessons = lessonsByCourseId.value[courseId] ?? [];

    cachedLessons.forEach((lesson) => {
      delete lessonBusyByLessonId.value[lesson.id];
      delete lessonErrorByLessonId.value[lesson.id];
    });

    delete lessonsByCourseId.value[courseId];
    delete lessonsLoadingByCourseId.value[courseId];
    delete lessonsErrorByCourseId.value[courseId];
  };
  const fetchLessonsForCourse = async (
    courseId: string,
    options?: { force?: boolean },
  ): Promise<void> => {
    const cachedLessons = lessonsByCourseId.value[courseId];

    if (!options?.force && cachedLessons) {
      return;
    }

    setCourseLoading(courseId, true);
    setCourseError(courseId, null);

    try {
      const response = await apiClient.get<unknown>(
        `/teacher/courses/${courseId}/lessons`,
      );

      setCourseLessons(courseId, parseTeacherLessonsDTO(response.data));
    } catch (error: unknown) {
      setCourseError(courseId, getApiErrorMessage(error, 'Failed to load lessons.'));
      setCourseLessons(courseId, []);
    } finally {
      setCourseLoading(courseId, false);
    }
  };

  const retryLessonsForCourse = async (courseId: string): Promise<void> => {
    await fetchLessonsForCourse(courseId, { force: true });
  };

  const createLessonForCourse = async (
    courseId: string,
    payload: LessonCreatePayload,
    pdfFile?: File | null,
  ): Promise<TeacherLessonDTO> => {
    setCourseLoading(courseId, true);
    setCourseError(courseId, null);

    try {
      const formData = buildLessonFormData(payload, pdfFile);

      const response = await apiClient.post<unknown>(
        `/teacher/courses/${courseId}/lessons`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      const createdLesson = parseTeacherLessonDTO(response.data);

      insertLessonIntoCache(courseId, createdLesson);
      await fetchLessonsForCourse(courseId, { force: true });

      return createdLesson;
    } catch (error: unknown) {
      setCourseError(courseId, getApiErrorMessage(error, 'Failed to add lesson.'));
      throw error;
    } finally {
      setCourseLoading(courseId, false);
    }
  };

  const updateLesson = async (
    courseId: string,
    lessonId: string,
    payload: LessonUpdatePayload,
    pdfFile?: File | null,
  ): Promise<TeacherLessonDTO> => {
    setLessonBusy(lessonId, true);
    setLessonError(lessonId, null);

    try {
      const formData = buildLessonFormData(payload, pdfFile);

      const response = await apiClient.put<unknown>(
        `/teacher/lessons/${lessonId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      const updatedLesson = parseTeacherLessonDTO(response.data);
      replaceLessonInCache(courseId, updatedLesson);

      return updatedLesson;
    } catch (error: unknown) {
      setLessonError(lessonId, getApiErrorMessage(error, 'Failed to save changes.'));
      throw error;
    } finally {
      setLessonBusy(lessonId, false);
    }
  };

  const deleteLesson = async (courseId: string, lessonId: string): Promise<void> => {
    setLessonBusy(lessonId, true);
    setLessonError(lessonId, null);

    try {
      await apiClient.delete(`/teacher/lessons/${lessonId}`);

      removeLessonFromCache(courseId, lessonId);
      await fetchLessonsForCourse(courseId, { force: true });
    } catch (error: unknown) {
      setLessonError(lessonId, getApiErrorMessage(error, 'Failed to delete lesson.'));
      throw error;
    } finally {
      setLessonBusy(lessonId, false);
    }
  };

  const uploadLessonPdf = async (courseId: string, lessonId: string, file: File): Promise<void> => {
    setLessonBusy(lessonId, true);
    setLessonError(lessonId, null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      await apiClient.post(`/teacher/lessons/${lessonId}/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchLessonsForCourse(courseId, { force: true });
    } catch (error: unknown) {
      setLessonError(lessonId, getApiErrorMessage(error, 'Failed to upload PDF.'));
      throw error;
    } finally {
      setLessonBusy(lessonId, false);
    }
  };

  const moveLesson = async (
    courseId: string,
    lessonId: string,
    direction: 'up' | 'down',
  ): Promise<void> => {
    const sortedLessons = sortByOrderIndex(getCourseLessons(courseId));

    if (sortedLessons.length < 2) {
      return;
    }

    const currentIndex = sortedLessons.findIndex((lesson) => lesson.id === lessonId);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedLessons.length) {
      return;
    }

    const lessonIds = sortedLessons.map((lesson) => lesson.id);

    if (lessonIds.some((currentLessonId) => isLessonBusy(currentLessonId))) {
      return;
    }

    const currentLesson = sortedLessons[currentIndex];
    const targetLesson = sortedLessons[targetIndex];

    if (!currentLesson || !targetLesson) {
      return;
    }

    setManyLessonsBusy(lessonIds, true);
    setLessonError(lessonId, null);

    const optimisticLessons = [...sortedLessons];
    optimisticLessons[currentIndex] = targetLesson;
    optimisticLessons[targetIndex] = currentLesson;
    lessonsByCourseId.value[courseId] = optimisticLessons;

    try {
      await apiClient.put(`/teacher/lessons/${lessonId}`, {
        orderIndex: targetIndex + 1,
      });

      await fetchLessonsForCourse(courseId, { force: true });
    } catch (error: unknown) {
      setLessonError(lessonId, getApiErrorMessage(error, 'Failed to change order.'));
      await fetchLessonsForCourse(courseId, { force: true });
      throw error;
    } finally {
      setManyLessonsBusy(lessonIds, false);
    }
  };

  return {
    lessonsByCourseId,
    lessonsLoadingByCourseId,
    lessonsErrorByCourseId,
    lessonBusyByLessonId,
    lessonErrorByLessonId,
    isLessonBusy,
    getLessonError,
    fetchLessonsForCourse,
    retryLessonsForCourse,
    createLessonForCourse,
    updateLesson,
    deleteLesson,
    clearCourseLessons,
    uploadLessonPdf,
    moveLesson,
  };
});



