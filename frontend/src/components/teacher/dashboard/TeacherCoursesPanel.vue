<script setup lang="ts">
import TeacherCourseAccordionItem from './TeacherCourseAccordionItem.vue';

import type {
  TeacherCourseSummaryDTO,
  CourseEnrollmentListItemDTO,
  TeacherLessonDTO,
} from '@/types/teacherDashboard.types';

type EnrollmentsMeta = {
  total: number;
  page: number;
  limit: number;
};

type Props = {
  courses: TeacherCourseSummaryDTO[];
  loading: boolean;
  error: string | null;
  expandedCourseId: string | null;
  lessonsByCourseId: Record<string, TeacherLessonDTO[] | undefined>;
  lessonsLoadingByCourseId: Record<string, boolean | undefined>;
  lessonsErrorByCourseId: Record<string, string | null | undefined>;
  lessonBusyByLessonId: Record<string, boolean>;
  lessonErrorByLessonId: Record<string, string | null>;
  enrollmentsByCourseId: Record<string, CourseEnrollmentListItemDTO[] | undefined>;
  enrollmentsLoadingByCourseId: Record<string, boolean | undefined>;
  enrollmentsErrorByCourseId: Record<string, string | null | undefined>;
  enrollmentsMetaByCourseId: Record<string, EnrollmentsMeta | undefined>;
  unenrollBusyByEnrollmentKey: Record<string, boolean>;
  canCreateLessons?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  canCreateLessons: true,
});

const emit = defineEmits<{
  (e: 'toggleCourse', courseId: string): void;
  (e: 'enrollStudent', courseId: string): void;
  (e: 'unenroll', payload: { courseId: string; studentId: string }): void;
  (e: 'changeEnrollmentsPage', payload: { courseId: string; page: number }): void;
  (e: 'retryEnrollments', courseId: string): void;
  (e: 'retryLessons', courseId: string): void;
  (e: 'createLesson', courseId: string): void;
  (e: 'editLesson', payload: { courseId: string; lesson: TeacherLessonDTO }): void;
  (e: 'deleteLesson', payload: { courseId: string; lesson: TeacherLessonDTO }): void;
  (e: 'moveLesson', payload: { courseId: string; lessonId: string; direction: 'up' | 'down' }): void;
  (e: 'openLessonPdf', payload: { courseId: string; lessonId: string }): void;
  (e: 'message', payload: { courseId: string; studentId: string }): void;
}>();

const getEnrollmentsMeta = (courseId: string): EnrollmentsMeta => {
  return props.enrollmentsMetaByCourseId[courseId] ?? {
    total: 0,
    page: 1,
    limit: 10,
  };
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <div class="row row--between">
        <div :class="$style.headerText">
          <h1>Teacher dashboard</h1>
          <p class="muted">Your courses, lessons, and students.</p>
        </div>
      </div>

      <p v-if="error" :class="$style.error">
        {{ error }}
      </p>

      <div v-if="loading" :class="$style.list">
        <div
          v-for="skeletonIndex in 6"
          :key="skeletonIndex"
          :class="$style.skeletonRow"
          aria-hidden="true"
        />
      </div>

      <div v-else-if="courses.length > 0" :class="$style.list">
        <TeacherCourseAccordionItem
          v-for="course in courses"
          :key="course.id"
          :course="course"
          :expanded="expandedCourseId === course.id"
          :lessons="lessonsByCourseId[course.id] ?? []"
          :lessons-loading="Boolean(lessonsLoadingByCourseId[course.id])"
          :lessons-error="lessonsErrorByCourseId[course.id] ?? null"
          :lesson-busy-by-lesson-id="lessonBusyByLessonId"
          :lesson-error-by-lesson-id="lessonErrorByLessonId"
          :can-create-lessons="Boolean(canCreateLessons)"
          :enrollments="enrollmentsByCourseId[course.id] ?? []"
          :enrollments-loading="Boolean(enrollmentsLoadingByCourseId[course.id])"
          :enrollments-error="enrollmentsErrorByCourseId[course.id] ?? null"
          :enrollments-total="getEnrollmentsMeta(course.id).total"
          :enrollments-page="getEnrollmentsMeta(course.id).page"
          :enrollments-limit="getEnrollmentsMeta(course.id).limit"
          :unenroll-busy-by-enrollment-key="unenrollBusyByEnrollmentKey"
          @toggle="emit('toggleCourse', course.id)"
          @enroll="emit('enrollStudent', course.id)"
          @unenroll="emit('unenroll', { courseId: course.id, studentId: $event })"
          @change-enrollments-page="emit('changeEnrollmentsPage', { courseId: course.id, page: $event })"
          @retry-enrollments="emit('retryEnrollments', course.id)"
          @retry-lessons="emit('retryLessons', course.id)"
          @create-lesson="emit('createLesson', course.id)"
          @edit-lesson="emit('editLesson', { courseId: course.id, lesson: $event })"
          @delete-lesson="emit('deleteLesson', { courseId: course.id, lesson: $event })"
          @move-lesson="emit('moveLesson', { courseId: course.id, lessonId: $event.lessonId, direction: $event.direction })"
          @open-lesson-pdf="emit('openLessonPdf', { courseId: course.id, lessonId: $event })"
          @message="emit('message', { courseId: course.id, studentId: $event })"
        />
      </div>

      <div v-else :class="$style.empty">
        <p class="muted">You do not have any courses yet.</p>
      </div>
    </div>
  </section>
</template>

<style module>
.headerText {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error {
  margin-top: 12px;
  color: var(--color-danger);
}

.list {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: 14px;
}

.empty {
  margin-top: 14px;
  padding: var(--space-5);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.skeletonRow {
  position: relative;
  height: 72px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.05);
}

.skeletonRow::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 640px) {
  .empty {
    padding: var(--space-4);
  }
}
</style>





