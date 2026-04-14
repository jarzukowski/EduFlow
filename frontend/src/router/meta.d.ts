import 'vue-router';

type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiredRoles?: UserRole[];
  }
}
