<script setup lang="ts">
import StudentCourseAccordionItem from './StudentCourseAccordionItem.vue';

import type { StudentCourseDTO, StudentLessonDTO } from '@/types/studentDashboard.types';

type Props = {
  title: string;
  subtitle: string;
  courses: StudentCourseDTO[];
  loading: boolean;
  error: string | null;
  expandedCourseId: string | null;
  lessonsByCourseId: Record<string, StudentLessonDTO[] | undefined>;
  lessonsLoadingByCourseId: Record<string, boolean | undefined>;
  lessonsErrorByCourseId: Record<string, string | null | undefined>;
  completionBusyByLessonId: (lessonId: string) => boolean;
  completionErrorByLessonId: (lessonId: string) => string | null;
  pdfBusyByLessonId?: (lessonId: string) => boolean;
  pdfErrorByLessonId?: (lessonId: string) => string | null;
  messageBusyByCourseId?: Record<string, boolean | undefined>;
  messageErrorByCourseId?: Record<string, string | null | undefined>;
};

const props = withDefaults(defineProps<Props>(), {
  messageBusyByCourseId: () => ({}),
  messageErrorByCourseId: () => ({}),
});

const emit = defineEmits<{
  (event: 'toggleCourse', courseId: string): void;
  (
    event: 'toggleCompletion',
    payload: { courseId: string; lessonId: string; completed: boolean },
  ): void;
  (event: 'openPdf', lessonId: string): void;
  (event: 'openVideo', videoUrl: string): void;
  (event: 'messageTeacher', courseId: string): void;
}>();

const onToggleCompletion = (
  courseId: string,
  lessonId: string,
  completed: boolean,
): void => {
  emit('toggleCompletion', { courseId, lessonId, completed });
};

const isMessageBusy = (courseId: string): boolean => {
  return Boolean(props.messageBusyByCourseId[courseId]);
};

const getMessageError = (courseId: string): string | null => {
  return props.messageErrorByCourseId[courseId] ?? null;
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <div :class="$style.header">
        <div>
          <h1 :class="$style.title">{{ title }}</h1>
          <p class="muted">{{ subtitle }}</p>
        </div>
      </div>

      <p v-if="error" :class="$style.error">{{ error }}</p>

      <div v-if="loading" :class="$style.list">
        <div
          v-for="skeletonIndex in 6"
          :key="skeletonIndex"
          :class="$style.skeletonRow"
          aria-hidden="true"
        />
      </div>

      <div v-else-if="courses.length > 0" :class="$style.list">
        <StudentCourseAccordionItem
          v-for="course in courses"
          :key="course.id"
          :course="course"
          :expanded="expandedCourseId === course.id"
          :lessons="lessonsByCourseId[course.id] ?? []"
          :lessons-loading="Boolean(lessonsLoadingByCourseId[course.id])"
          :lessons-error="lessonsErrorByCourseId[course.id] ?? null"
          :completion-busy-by-lesson-id="completionBusyByLessonId"
          :completion-error-by-lesson-id="completionErrorByLessonId"
          :pdf-busy-by-lesson-id="pdfBusyByLessonId"
          :pdf-error-by-lesson-id="pdfErrorByLessonId"
          :message-busy="isMessageBusy(course.id)"
          :message-error="getMessageError(course.id)"
          @toggle="emit('toggleCourse', course.id)"
          @toggleCompletion="onToggleCompletion(course.id, $event.lessonId, $event.completed)"
          @openPdf="emit('openPdf', $event)"
          @openVideo="emit('openVideo', $event)"
          @messageTeacher="emit('messageTeacher', $event)"
        />
      </div>

      <div v-else :class="$style.empty">
        <p class="muted">You to not have any courses yet.</p>
      </div>
    </div>
  </section>
</template>

<style module>
.header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.title {
  margin: 0;
}

.error {
  margin-top: 12px;
  color: var(--color-danger);
}

.list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.empty {
  margin-top: 14px;
  padding: var(--space-5);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.skeletonRow {
  height: 72px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
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
</style>


