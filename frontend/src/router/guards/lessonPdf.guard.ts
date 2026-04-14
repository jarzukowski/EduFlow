import type {
  NavigationGuardReturn,
  RouteLocationNormalized,
} from 'vue-router';

import { useAuthStore } from '@/stores/auth.store';

const getLessonIdFromRoute = (to: RouteLocationNormalized): string | null => {
  const rawLessonId = to.params.id;

  if (typeof rawLessonId !== 'string') {
    return null;
  }

  const lessonId = rawLessonId.trim();

  return lessonId.length > 0 ? lessonId : null;
};

export const lessonPdfSoftPrecheckGuard = async (
  to: RouteLocationNormalized,
): Promise<NavigationGuardReturn> => {
  const authStore = useAuthStore();
  const lessonId = getLessonIdFromRoute(to);

  if (!lessonId) {
    return { name: 'not-found', replace: true };
  }

  if (authStore.user?.role !== 'STUDENT') {
    return true;
  }

  try {
    const { useStudentDashboardStore } = await import('@/stores/studentDashboard.store');
    const { usePublicLessonsStore } = await import('@/stores/publicLessons.store');

    const studentDashboardStore = useStudentDashboardStore();
    const publicLessonsStore = usePublicLessonsStore();

    if (studentDashboardStore.courses.length === 0) {
      await studentDashboardStore.fetchStudentCourses();
    }

    const lesson = await publicLessonsStore.fetchLessonById(lessonId);

    if (!lesson) {
      return { name: 'not-found', replace: true };
    }

    const hasAccessToCourse = studentDashboardStore.courses.some(
      (course) => course.id === lesson.courseId,
    );

    if (!hasAccessToCourse) {
      return {
        name: 'forbidden',
        query: { from: to.fullPath },
        replace: true,
      };
    }

    return true;
  } catch {
    return {
      name: 'forbidden',
      query: { from: to.fullPath },
      replace: true,
    };
  }
};
