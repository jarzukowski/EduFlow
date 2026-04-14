import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseEnrollStudentResponseDTO,
  parseGetCourseEnrollmentsResponseDTO,
  parseStudentSuggestDTOArray,
  parseTeacherCoursesDTO,
  parseUnenrollStudentResponseDTO,
} from '@/api/contracts/teacherDashboard.contracts';

import type {
  StudentSuggestDTO,
  TeacherCourseSummaryDTO,
  CourseEnrollmentListItemDTO,
  TeacherEnrollmentsMeta,
  TeacherOverview,
} from '@/types/teacherDashboard.types';

const getEnrollmentBusyKey = (courseId: string, studentId: string): string => {
  return `${courseId}:${studentId}`;
};

export const useTeacherDashboardStore = defineStore('teacherDashboard', () => {
  const courses = ref<TeacherCourseSummaryDTO[]>([]);
  const coursesLoading = ref(false);
  const coursesError = ref<string | null>(null);

  const expandedCourseId = ref<string | null>(null);

  const overview = computed<TeacherOverview>(() => {
    const coursesCount = courses.value.length;
    const lessonsCount = courses.value.reduce((sum, course) => sum + course.lessonsCount, 0);
    const studentsCount = courses.value.reduce((sum, course) => sum + course.studentsCount, 0);
    const totalDurationMinutes = courses.value.reduce(
      (sum, course) => sum + course.totalDurationMinutes,
      0,
    );

    return {
      coursesCount,
      lessonsCount,
      studentsCount,
      totalDurationMinutes,
    };
  });

  const fetchTeacherCourses = async (): Promise<void> => {
    coursesLoading.value = true;
    coursesError.value = null;

    try {
      const response = await apiClient.get<unknown>('/teacher/courses');
      courses.value = parseTeacherCoursesDTO(response.data);
    } catch (error: unknown) {
      coursesError.value = getApiErrorMessage(error, 'Failed to load courses.');
      courses.value = [];
    } finally {
      coursesLoading.value = false;
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    coursesError.value = null;

    try {
      await apiClient.delete(`/courses/${courseId}`);
      courses.value = courses.value.filter((course) => course.id !== courseId);

      if (expandedCourseId.value === courseId) {
        expandedCourseId.value = null;
      }

      delete enrollmentsByCourseId.value[courseId];
      delete enrollmentsMetaByCourseId.value[courseId];
      delete enrollmentsLoadingByCourseId.value[courseId];
      delete enrollmentsErrorByCourseId.value[courseId];
    } catch (error: unknown) {
      coursesError.value = getApiErrorMessage(error, 'Failed to delete course.');
      throw error;
    }
  };

  const toggleCourse = (courseId: string): void => {
    expandedCourseId.value = expandedCourseId.value === courseId ? null : courseId;
  };

  const enrollModalCourseId = ref<string | null>(null);
  const enrollBusy = ref(false);
  const enrollError = ref<string | null>(null);

  const isEnrollModalOpen = computed<boolean>(() => {
    return enrollModalCourseId.value !== null;
  });

  const openEnrollModal = (courseId: string): void => {
    enrollModalCourseId.value = courseId;
    enrollError.value = null;
  };

  const closeEnrollModal = (): void => {
    enrollModalCourseId.value = null;
    enrollError.value = null;
  };

  const enrollmentsByCourseId = ref<Record<string, CourseEnrollmentListItemDTO[]>>({});
  const enrollmentsMetaByCourseId = ref<Record<string, TeacherEnrollmentsMeta>>({});
  const enrollmentsLoadingByCourseId = ref<Record<string, boolean>>({});
  const enrollmentsErrorByCourseId = ref<Record<string, string | null>>({});
  const unenrollBusyByEnrollmentKey = ref<Record<string, boolean>>({});

  const fetchEnrollmentsForCourse = async (
    courseId: string,
    options?: {
      page?: number;
      limit?: number;
      force?: boolean;
    },
  ): Promise<void> => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const cachedMeta = enrollmentsMetaByCourseId.value[courseId];
    const hasMatchingCache =
      Boolean(enrollmentsByCourseId.value[courseId]) &&
      cachedMeta?.page === page &&
      cachedMeta?.limit === limit;

    if (!options?.force && hasMatchingCache) {
      return;
    }

    enrollmentsLoadingByCourseId.value[courseId] = true;
    enrollmentsErrorByCourseId.value[courseId] = null;

    try {
      const response = await apiClient.get<unknown>(
        `/teacher/courses/${courseId}/enrollments`,
        {
          params: { page, limit },
        },
      );
      const parsedResponse = parseGetCourseEnrollmentsResponseDTO(response.data);

      enrollmentsByCourseId.value[courseId] = parsedResponse.items;
      enrollmentsMetaByCourseId.value[courseId] = {
        total: parsedResponse.total,
        page: parsedResponse.page,
        limit: parsedResponse.limit,
      };
    } catch (error: unknown) {
      enrollmentsErrorByCourseId.value[courseId] = getApiErrorMessage(
        error,
        'Failed to load enrolled students.',
      );

      enrollmentsByCourseId.value[courseId] = [];
      enrollmentsMetaByCourseId.value[courseId] = {
        total: 0,
        page,
        limit,
      };
    } finally {
      enrollmentsLoadingByCourseId.value[courseId] = false;
    }
  };

  const changeEnrollmentsPage = async (courseId: string, page: number): Promise<void> => {
    const currentMeta = enrollmentsMetaByCourseId.value[courseId];
    const limit = currentMeta?.limit ?? 10;

    await fetchEnrollmentsForCourse(courseId, {
      page,
      limit,
      force: true,
    });
  };

  const retryEnrollments = async (courseId: string): Promise<void> => {
    const currentMeta = enrollmentsMetaByCourseId.value[courseId];

    await fetchEnrollmentsForCourse(courseId, {
      page: currentMeta?.page ?? 1,
      limit: currentMeta?.limit ?? 10,
      force: true,
    });
  };

  const enrollStudentToCourse = async (courseId: string, studentId: string): Promise<void> => {
    enrollBusy.value = true;
    enrollError.value = null;

    try {
      const response = await apiClient.post<unknown>(
        `/teacher/courses/${courseId}/enrollments`,
        { studentId },
      );
      const parsedResponse = parseEnrollStudentResponseDTO(response.data);

      const targetCourse = courses.value.find((course) => course.id === courseId);

      if (targetCourse) {
        targetCourse.studentsCount = parsedResponse.studentsCount;
      }

      closeEnrollModal();
      await fetchEnrollmentsForCourse(courseId, { page: 1, limit: 10, force: true });
    } catch (error: unknown) {
      enrollError.value = getApiErrorMessage(error, 'Failed to add student.');
      throw error;
    } finally {
      enrollBusy.value = false;
    }
  };

  const unenrollStudentFromCourse = async (
    courseId: string,
    studentId: string,
  ): Promise<void> => {
    const enrollmentBusyKey = getEnrollmentBusyKey(courseId, studentId);

    if (unenrollBusyByEnrollmentKey.value[enrollmentBusyKey]) {
      return;
    }

    unenrollBusyByEnrollmentKey.value[enrollmentBusyKey] = true;
    enrollmentsErrorByCourseId.value[courseId] = null;

    try {
      const response = await apiClient.delete<unknown>(
        `/teacher/courses/${courseId}/enrollments/${studentId}`,
      );
      const parsedResponse = parseUnenrollStudentResponseDTO(response.data);

      const targetCourse = courses.value.find((course) => course.id === courseId);

      if (targetCourse) {
        targetCourse.studentsCount = parsedResponse.studentsCount;
      }

      await retryEnrollments(courseId);
    } catch (error: unknown) {
      enrollmentsErrorByCourseId.value[courseId] = getApiErrorMessage(
        error,
        'Failed to remove student.',
      );
      throw error;
    } finally {
      unenrollBusyByEnrollmentKey.value[enrollmentBusyKey] = false;
    }
  };

  const suggestStudents = async (query: string): Promise<StudentSuggestDTO[]> => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 4) {
      return [];
    }

    try {
      const response = await apiClient.get<unknown>('/teacher/students/suggest', {
        params: { query: normalizedQuery },
      });

      return parseStudentSuggestDTOArray(response.data);
    } catch {
      return [];
    }
  };

  return {
    courses,
    coursesLoading,
    coursesError,
    expandedCourseId,
    overview,
    fetchTeacherCourses,
    deleteCourse,
    toggleCourse,
    enrollModalCourseId,
    isEnrollModalOpen,
    enrollBusy,
    enrollError,
    openEnrollModal,
    closeEnrollModal,
    enrollmentsByCourseId,
    enrollmentsMetaByCourseId,
    enrollmentsLoadingByCourseId,
    enrollmentsErrorByCourseId,
    unenrollBusyByEnrollmentKey,
    fetchEnrollmentsForCourse,
    changeEnrollmentsPage,
    retryEnrollments,
    enrollStudentToCourse,
    unenrollStudentFromCourse,
    suggestStudents,
  };
});


