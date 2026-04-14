<script setup lang="ts">
import { computed, ref } from 'vue';

import type { StudentLessonDTO } from '@/types/studentDashboard.types';

const props = defineProps<{
  lessons: StudentLessonDTO[];
  loading: boolean;
  error: string | null;
  completionBusyByLessonId: (lessonId: string) => boolean;
  completionErrorByLessonId: (lessonId: string) => string | null;
  pdfBusyByLessonId?: (lessonId: string) => boolean;
  pdfErrorByLessonId?: (lessonId: string) => string | null;
}>();

const emit = defineEmits<{
  (event: 'toggleCompletion', payload: { lessonId: string; completed: boolean }): void;
  (event: 'openPdf', lessonId: string): void;
  (event: 'openVideo', videoUrl: string): void;
}>();

const expandedLessonId = ref<string | null>(null);

const sortedLessons = computed<StudentLessonDTO[]>(() => {
  return [...props.lessons].sort(
    (firstLesson, secondLesson) => firstLesson.orderIndex - secondLesson.orderIndex,
  );
});

const toggleLessonDetails = (lessonId: string): void => {
  expandedLessonId.value = expandedLessonId.value === lessonId ? null : lessonId;
};

const isLessonExpanded = (lessonId: string): boolean => {
  return expandedLessonId.value === lessonId;
};

const getLessonDetailsId = (lessonId: string): string => {
  return `student-lesson-details-${lessonId}`;
};

const formatDuration = (durationMinutes: number | null | undefined): string => {
  if (durationMinutes === null || durationMinutes === undefined) {
    return '—';
  }

  const safeDurationMinutes = Math.max(0, durationMinutes);
  const hours = Math.floor(safeDurationMinutes / 60);
  const remainingMinutes = safeDurationMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${remainingMinutes} min`;
};

const hasVideo = (lesson: StudentLessonDTO): boolean => {
  return typeof lesson.videoUrl === 'string' && lesson.videoUrl.trim().length > 0;
};

const hasContent = (lesson: StudentLessonDTO): boolean => {
  return typeof lesson.content === 'string' && lesson.content.trim().length > 0;
};

const onToggleCompletion = (lessonId: string, completed: boolean): void => {
  emit('toggleCompletion', { lessonId, completed });
};

const onOpenPdf = (lessonId: string): void => {
  emit('openPdf', lessonId);
};

const onOpenVideo = (videoUrl: string | null): void => {
  if (!videoUrl) {
    return;
  }

  emit('openVideo', videoUrl);
};
</script>

<template>
  <div :class="$style.wrapper">
    <p v-if="error" class="muted" :class="$style.error">
      {{ error }}
    </p>

    <div v-if="loading" :class="$style.skeletonList">
      <div
        v-for="skeletonIndex in 4"
        :key="skeletonIndex"
        :class="$style.skeletonRow"
        aria-hidden="true"
      />
    </div>

    <div v-else-if="sortedLessons.length > 0" :class="$style.table" aria-live="polite">
      <div :class="[$style.row, $style.head]">
        <div>Nr.</div>
        <div>Lesson</div>
        <div :class="$style.actionsHead">Actions</div>
      </div>

      <div
        v-for="(lesson, lessonIndex) in sortedLessons"
        :key="lesson.id"
        :class="$style.item"
      >
        <div :class="$style.row">
          <div class="muted" :class="$style.lessonNumber">
            {{ lessonIndex + 1 }}
          </div>

          <div :class="$style.lessonColumn">
            <div :class="$style.lessonTitle">
              {{ lesson.title }}
            </div>

            <div :class="$style.metaRow">
              <span class="muted">Duration: {{ formatDuration(lesson.durationMinutes) }}</span>
              <span v-if="lesson.completed" :class="$style.completedBadge">Completed</span>
              <span v-if="hasVideo(lesson)" class="muted">• Video</span>
              <span v-if="lesson.hasPdf" class="muted">• PDF</span>
            </div>

            <p
              v-if="completionErrorByLessonId(lesson.id)"
              class="muted"
              :class="$style.lessonError"
            >
              {{ completionErrorByLessonId(lesson.id) }}
            </p>
          </div>

          <div :class="$style.actions">
            <button
              type="button"
              class="btn btn--ghost"
              :aria-expanded="isLessonExpanded(lesson.id)"
              :aria-controls="getLessonDetailsId(lesson.id)"
              @click.stop="toggleLessonDetails(lesson.id)"
            >
              {{ isLessonExpanded(lesson.id) ? 'Collapse' : 'Details' }}
            </button>

            <label :class="$style.checkboxWrapper">
              <input
                type="checkbox"
                :checked="lesson.completed"
                :disabled="completionBusyByLessonId(lesson.id)"
                @change="onToggleCompletion(lesson.id, !lesson.completed)"
              />
              <span :class="$style.checkboxUi" aria-hidden="true" />
              <span class="muted">Completed</span>
            </label>
          </div>
        </div>

        <div
          v-if="isLessonExpanded(lesson.id)"
          :id="getLessonDetailsId(lesson.id)"
          :class="$style.details"
        >
          <div v-if="hasContent(lesson)" class="muted" :class="$style.detailsText">
            {{ lesson.content }}
          </div>

          <div v-else class="muted" :class="$style.detailsText">
            No description.
          </div>

          <div :class="$style.detailsActions">
            <button
              v-if="hasVideo(lesson)"
              type="button"
              class="btn"
              :class="$style.videoButton"
              @click="onOpenVideo(lesson.videoUrl)"
            >
              Open video
            </button>

            <button
              v-if="lesson.hasPdf"
              type="button"
              class="btn"
              :class="$style.pdfButton"
              :disabled="pdfBusyByLessonId ? pdfBusyByLessonId(lesson.id) : false"
              @click="onOpenPdf(lesson.id)"
            >
              Open PDF
            </button>

            <p
              v-if="pdfErrorByLessonId && pdfErrorByLessonId(lesson.id)"
              class="muted"
              :class="$style.lessonError"
            >
              {{ pdfErrorByLessonId(lesson.id) }}
            </p>

            <span v-if="!hasVideo(lesson) && !lesson.hasPdf" class="muted">
              No materials.
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="muted">
      No lessons in this course.
    </p>
  </div>
</template>

<style module>
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.error {
  color: var(--color-danger);
}

.table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  min-width: 0;
}

.item + .item {
  border-top: 1px solid var(--color-border);
}

.row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) minmax(220px, auto);
  gap: var(--space-3);
  align-items: start;
  padding: 14px 16px;
  min-width: 0;
}

.head {
  font-weight: 800;
  background: rgba(255, 255, 255, 0.04);
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.actionsHead {
  justify-self: end;
}

.lessonNumber {
  font-weight: 800;
  padding-top: 4px;
}

.lessonColumn {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lessonTitle {
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.metaRow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.completedBadge {
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: var(--text-xs);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 255, 120, 0.1);
}

.lessonError {
  margin: 0;
  color: var(--color-danger);
}

.actions {
  min-width: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.checkboxWrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  flex: 0 0 auto;
}

.checkboxWrapper input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkboxUi {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  position: relative;
}

.checkboxWrapper input:checked + .checkboxUi::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 6px;
  background: rgba(120, 120, 255, 0.9);
}

.checkboxWrapper:focus-within .checkboxUi {
  box-shadow: var(--focus-ring);
}

.details {
  padding: 0 16px 16px 80px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.detailsText {
  margin-top: 10px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.65;
}

.detailsActions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.videoButton {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 0, 0, 0.14);
}

.pdfButton {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
}

.skeletonList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeletonRow {
  height: 52px;
  border-radius: var(--radius-md);
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
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.08),
    transparent
  );
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (min-width: 1100px) {
  .row {
    grid-template-columns: 56px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: start;
  }

  .actions {
    grid-column: 2;
    grid-row: 2;
    justify-content: flex-start;
    margin-top: 8px;
  }
}

@media (max-width: 1099px) {
  .head {
    display: none;
  }

  .row {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 12px;
  }

  .actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
    padding-top: 4px;
  }

  .details {
    padding: 0 16px 16px 16px;
  }
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }

  .lessonNumber {
    padding-top: 0;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .actions :global(.btn) {
    width: 100%;
    justify-content: center;
  }

  .checkboxWrapper {
    width: 100%;
    justify-content: flex-start;
  }

  .details {
    padding: 0 12px 12px 12px;
  }

  .detailsActions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .detailsActions :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>





