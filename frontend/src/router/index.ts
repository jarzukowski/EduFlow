import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '../stores/auth.store';
import { lessonPdfSoftPrecheckGuard } from '@/router/guards/lessonPdf.guard.ts';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/auth/AuthView.vue'),
      beforeEnter: (to) => {
        const mode = to.query.mode;

        if (mode === 'signin' || mode === 'signup') {
          return true;
        }

        return {
          name: 'auth',
          query: { ...to.query, mode: 'signin' },
          replace: true,
        };
      },
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: () => import('../views/ForbiddenView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('../views/public/PublicCoursesListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/courses/:courseId/lessons/create',
      name: 'lesson-create',
      component: () => import('../views/teacher/editor/TeacherLessonCreateView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['TEACHER', 'ADMIN'] },
    },
    {
      path: '/lessons/:id/edit',
      name: 'lesson-edit',
      component: () => import('../views/teacher/editor/TeacherLessonEditView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['TEACHER', 'ADMIN'] },
    },
    {
      path: '/courses/:id',
      name: 'course-details',
      component: () => import('../views/public/PublicCourseDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/lessons/:id',
      name: 'lesson-details',
      component: () => import('../views/public/PublicLessonDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/lessons/:id/pdf',
      name: 'lesson-pdf',
      component: () => import('../views/lessons/PdfView/PdfView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: lessonPdfSoftPrecheckGuard,
    },
    {
      path: '/sessions',
      name: 'sessions',
      component: () => import('../views/SessionsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../views/messages/MessagesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('../views/admin/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['ADMIN'] },
    },
    {
      path: '/teacher',
      name: 'teacher-panel',
      component: () => import('../views/teacher/dashboard/TeacherPanelView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['TEACHER', 'ADMIN'] },
    },
    {
      path: '/student',
      name: 'student-panel',
      component: () => import('../views/student/StudentPanelView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['STUDENT'] },
    },
    {
      path: '/teacher/courses',
      redirect: '/teacher',
    },
    {
      path: '/teacher/courses/create',
      name: 'teacher-course-create',
      component: () => import('../views/teacher/editor/TeacherCourseCreateView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['TEACHER', 'ADMIN'] },
    },
    {
      path: '/teacher/courses/:id',
      name: 'teacher-course-details',
      component: () => import('../views/teacher/course-details/TeacherCourseDetailsView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['TEACHER', 'ADMIN'] },
    },
    {
      path: '/teacher/courses/:id/edit',
      name: 'teacher-course-edit',
      component: () => import('../views/teacher/editor/TeacherCourseEditView.vue'),
      meta: { requiresAuth: true, requiredRoles: ['TEACHER', 'ADMIN'] },
    },
    {
      path: '/404',
      redirect: { name: 'not-found' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { requiresAuth: false },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.bootstrapDone) {
    await auth.bootstrap();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'auth',
      query: { mode: 'signin' },
      replace: true,
    };
  }

  if (to.name === 'auth' && auth.isAuthenticated) {
    return {
      name: 'home',
      replace: true,
    };
  }

  const requiredRoles = Array.isArray(to.meta.requiredRoles)
    ? to.meta.requiredRoles
    : undefined;

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = auth.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      return {
        name: 'forbidden',
        query: { from: to.fullPath },
        replace: true,
      };
    }
  }

  return true;
});
