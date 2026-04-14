<script setup lang="ts">
import { computed } from 'vue';

import StudentLessonsList from './StudentLessonsList.vue';

import type { StudentCourseDTO, StudentLessonDTO } from '@/types/studentDashboard.types';

type Props = {
  course: StudentCourseDTO;
  expanded: boolean;
  lessons: StudentLessonDTO[];
  lessonsLoading: boolean;
  lessonsError: string | null;
  completionBusyByLessonId: (lessonId: string) => boolean;
  completionErrorByLessonId: (lessonId: string) => string | null;
  pdfBusyByLessonId?: (lessonId: string) => boolean;
  pdfErrorByLessonId?: (lessonId: string) => string | null;
  messageBusy?: boolean;
  messageError?: string | null;
};

const props = withDefaults(defineProps<Props>(), {
  messageBusy: false,
  messageError: null,
});

const emit = defineEmits<{
  (event: 'toggle'): void;
  (event: 'toggleCompletion', payload: { lessonId: string; completed: boolean }): void;
  (event: 'openPdf', lessonId: string): void;
  (event: 'openVideo', videoUrl: string): void;
  (event: 'messageTeacher', courseId: string): void;
}>();

const panelId = computed<string>(() => {
  return `student-course-panel-${props.course.id}`;
});

const onToggleCompletion = (lessonId: string, completed: boolean): void => {
  emit('toggleCompletion', { lessonId, completed });
};

const onMessageTeacher = (): void => {
  if (!props.course.id || props.messageBusy) {
    return;
  }

  emit('messageTeacher', props.course.id);
};
</script>

<template>
  <article :class="$style.item">
    <button
      type="button"
      :class="$style.header"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      @click="emit('toggle')"
    >
      <div :class="$style.titleArea">
        <h2 :class="$style.title">{{ course.title }}</h2>

        <p v-if="course.description" class="muted" :class="$style.description">
          {{ course.description }}
        </p>

        <div :class="$style.metaRow">
          <div :class="$style.meta">
            <span :class="$style.badge">
              {{ course.completedLessonsCount }} / {{ course.lessonsCount }} completed
            </span>

            <span :class="$style.badge">
              {{ course.totalDurationMinutes }} min
            </span>

            <button
              type="button"
              class="btn btn--ghost"
              :class="$style.messageButton"
              :disabled="messageBusy"
              aria-label="Message the instructor"
              @click.stop="onMessageTeacher"
            >
              ✉️
            </button>
          </div>

          <p v-if="messageError" :class="$style.messageError">
            {{ messageError }}
          </p>
        </div>
      </div>

      <div :class="$style.actions" aria-hidden="true">
        <span :class="$style.chevron">
          <span :class="expanded ? $style.chevronUp : $style.chevronDown">⌄</span>
        </span>
      </div>

      <span :class="$style.srOnly">
        {{ expanded ? 'Collapse course' : 'Expand course' }}
      </span>
    </button>

    <div v-if="expanded" :id="panelId" :class="$style.body">
      <StudentLessonsList
        :lessons="lessons"
        :loading="lessonsLoading"
        :error="lessonsError"
        :completion-busy-by-lesson-id="completionBusyByLessonId"
        :completion-error-by-lesson-id="completionErrorByLessonId"
        :pdf-busy-by-lesson-id="pdfBusyByLessonId"
        :pdf-error-by-lesson-id="pdfErrorByLessonId"
        @toggleCompletion="onToggleCompletion($event.lessonId, $event.completed)"
        @openPdf="emit('openPdf', $event)"
        @openVideo="emit('openVideo', $event)"
      />
    </div>
  </article>
</template>

<style module>
.item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
  min-width: 0;
  overflow: hidden;
}

.header {
  width: 100%;
  text-align: left;
  padding: var(--space-5);
  background: transparent;
  border: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  align-items: start;
  gap: var(--space-4);
  cursor: pointer;
  position: relative;
  min-width: 0;
}

.header:focus-visible {
  border-radius: var(--radius-lg);
}

.titleArea {
  min-width: 0;
}

.title {
  margin: 0;
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
}

.description {
  margin-top: 6px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.metaRow {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.badge {
  font-size: var(--text-xs);
  padding: 6px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
}

.messageButton {
  width: 44px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border-radius: var(--radius-pill);
}

.messageButton:focus-visible {
  box-shadow: var(--focus-ring);
}

.messageError {
  color: var(--color-danger);
  font-size: var(--text-xs);
}

.actions {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
}

.chevron {
  opacity: 0.85;
}

.chevronUp {
  display: inline-block;
  transform: rotate(180deg);
  transition: transform var(--dur-fast) var(--ease-out);
}

.chevronDown {
  display: inline-block;
  transition: transform var(--dur-fast) var(--ease-out);
}

.body {
  border-top: 1px solid var(--color-border);
  padding: var(--space-5);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .header {
    padding: var(--space-4);
    gap: var(--space-3);
  }

  .body {
    padding: var(--space-4);
  }
}
</style>



