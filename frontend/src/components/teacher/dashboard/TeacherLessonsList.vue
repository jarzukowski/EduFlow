<script setup lang="ts">
import { computed, ref } from 'vue';

import type { TeacherLessonDTO } from '@/types/teacherDashboard.types';

const props = defineProps<{
  lessons: TeacherLessonDTO[];
  loading: boolean;
  error: string | null;
  lessonBusyByLessonId: Record<string, boolean>;
  lessonErrorByLessonId: Record<string, string | null>;
  canCreate: boolean;
}>();

const emit = defineEmits<{
  (e: 'retry'): void;
  (e: 'create'): void;
  (e: 'edit', lesson: TeacherLessonDTO): void;
  (e: 'delete', lesson: TeacherLessonDTO): void;
  (e: 'move', payload: { lessonId: string; direction: 'up' | 'down' }): void;
  (e: 'openPdf', lessonId: string): void;
}>();

const expandedLessonId = ref<string | null>(null);

const sortedLessons = computed<TeacherLessonDTO[]>(() => {
  return [...props.lessons].sort((firstLesson, secondLesson) => {
    return firstLesson.orderIndex - secondLesson.orderIndex;
  });
});

const isLessonBusy = (lessonId: string): boolean => {
  return Boolean(props.lessonBusyByLessonId[lessonId]);
};

const getLessonError = (lessonId: string): string | null => {
  return props.lessonErrorByLessonId[lessonId] ?? null;
};

const getDisplayIndex = (index: number): number => {
  return index + 1;
};

const canMoveUp = (index: number, lessonId: string): boolean => {
  return !props.loading && index > 0 && !isLessonBusy(lessonId);
};

const canMoveDown = (index: number, lessonId: string): boolean => {
  return !props.loading && index < sortedLessons.value.length - 1 && !isLessonBusy(lessonId);
};

const toggleDetails = (lessonId: string): void => {
  expandedLessonId.value = expandedLessonId.value === lessonId ? null : lessonId;
};

const isExpanded = (lessonId: string): boolean => {
  return expandedLessonId.value === lessonId;
};

const openInNewTab = (url: string): void => {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return;
  }

  window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
};

const getLessonContent = (lesson: TeacherLessonDTO): string | null => {
  const normalizedContent = lesson.content?.trim();

  return normalizedContent ? normalizedContent : null;
};

const getVideoUrl = (lesson: TeacherLessonDTO): string | null => {
  const normalizedUrl = lesson.videoUrl?.trim();

  return normalizedUrl ? normalizedUrl : null;
};

const hasPdf = (lesson: TeacherLessonDTO): boolean => {
  return Boolean(lesson.hasPdf);
};

const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) {
    return '—';
  }

  const normalizedMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  if (hours > 0) {
    return `${hours} h ${remainingMinutes} min`;
  }

  return `${remainingMinutes} min`;
};
</script>

<template>
  <div :class="$style.wrap">
    <div class="row row--between" :class="$style.header">
      <div class="muted">Lessons in the course</div>

      <button
        v-if="canCreate"
        type="button"
        class="btn btn--primary"
        :disabled="loading"
        @click="emit('create')"
      >
        Add lesson
      </button>
    </div>

    <p v-if="error" class="muted" :class="$style.error">
      {{ error }}

      <button
        type="button"
        class="btn btn--ghost"
        :class="$style.inlineBtn"
        @click="emit('retry')"
      >
        Please try again
      </button>
    </p>

    <div v-if="loading" :class="$style.skeleton">
      <div
        v-for="skeletonIndex in 4"
        :key="skeletonIndex"
        :class="$style.skeletonRow"
        aria-hidden="true"
      />
    </div>

    <div v-else-if="sortedLessons.length > 0" :class="$style.table" aria-live="polite">
      <div :class="[$style.row, $style.head]" aria-hidden="true">
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
          <div class="muted" :class="$style.nr">
            {{ getDisplayIndex(lessonIndex) }}
          </div>

          <div :class="$style.lessonCol">
            <div :class="$style.lessonTitle">
              {{ lesson.title }}
            </div>

            <div class="muted" :class="$style.metaRow">
              <span>Duration: {{ formatDuration(lesson.durationMinutes) }}</span>
              <span v-if="getVideoUrl(lesson)">• Video</span>
              <span v-if="hasPdf(lesson)">• PDF</span>
            </div>

            <p v-if="getLessonError(lesson.id)" class="muted" :class="$style.lessonError">
              {{ getLessonError(lesson.id) }}
            </p>
          </div>

          <div :class="$style.actions">
            <button
              type="button"
              class="btn btn--ghost"
              :disabled="loading"
              @click.stop="toggleDetails(lesson.id)"
            >
              {{ isExpanded(lesson.id) ? 'Collapse' : 'Details' }}
            </button>

            <button
              type="button"
              class="btn btn--ghost"
              :disabled="!canMoveUp(lessonIndex, lesson.id)"
              :aria-label="`Move lesson ${lesson.title} up`"
              @click.stop="emit('move', { lessonId: lesson.id, direction: 'up' })"
            >
              ↑
            </button>

            <button
              type="button"
              class="btn btn--ghost"
              :disabled="!canMoveDown(lessonIndex, lesson.id)"
              :aria-label="`Move lesson ${lesson.title} down`"
              @click.stop="emit('move', { lessonId: lesson.id, direction: 'down' })"
            >
              ↓
            </button>

            <button
              type="button"
              class="btn btn--ghost"
              :disabled="loading || isLessonBusy(lesson.id)"
              @click="emit('edit', lesson)"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn btn--danger"
              :disabled="loading || isLessonBusy(lesson.id)"
              @click="emit('delete', lesson)"
            >
              {{ isLessonBusy(lesson.id) ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <div v-if="isExpanded(lesson.id)" :class="$style.details">
          <div v-if="getLessonContent(lesson)" :class="$style.detailsSection">
            <div class="muted" :class="$style.detailsLabel">Content</div>

            <p :class="$style.detailsContent">
              {{ getLessonContent(lesson) }}
            </p>
          </div>

          <div :class="$style.detailsSection">
            <div class="muted" :class="$style.detailsLabel">Materials</div>

            <div :class="$style.detailsActions">
              <button
                v-if="getVideoUrl(lesson)"
                type="button"
                class="btn"
                :class="$style.youtubeBtn"
                @click="openInNewTab(getVideoUrl(lesson) ?? '')"
              >
                ▶ Video
              </button>

              <button
                v-if="hasPdf(lesson)"
                type="button"
                class="btn"
                :class="$style.pdfBtn"
                :disabled="loading || isLessonBusy(lesson.id)"
                @click="emit('openPdf', lesson.id)"
              >
                ⧉ PDF
              </button>

              <span v-if="!getVideoUrl(lesson) && !hasPdf(lesson)" class="muted">
                No materials.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="muted">
      No lessons in this course.

      <button
        v-if="canCreate"
        type="button"
        class="btn btn--ghost"
        :class="$style.inlineBtn"
        @click="emit('create')"
      >
        Add the first one
      </button>
    </p>
  </div>
</template>

<style module>
.wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: 12px;
}

.header {
  gap: var(--space-3);
}

.error {
  color: var(--color-danger);
}

.inlineBtn {
  margin-left: 10px;
}

.table {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.item + .item {
  border-top: 1px solid var(--color-border);
}

.row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) minmax(240px, auto);
  gap: var(--space-3);
  align-items: start;
  min-width: 0;
  padding: 14px 16px;
}

.head {
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  font-weight: 800;
}

.actionsHead {
  justify-self: end;
}

.nr {
  padding-top: 4px;
  font-weight: 800;
}

.lessonCol {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lessonTitle {
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.metaRow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  line-height: 1.4;
}

.lessonError {
  margin: 0;
  color: var(--color-danger);
}

.actions {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
}

.details {
  padding: 0 16px 16px 72px;
  background: rgba(255, 255, 255, 0.02);
}

.detailsSection + .detailsSection {
  margin-top: 16px;
}

.detailsLabel {
  margin-top: 2px;
}

.detailsActions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.detailsContent {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.youtubeBtn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 0, 0, 0.14);
  color: rgba(255, 255, 255, 0.92);
}

.youtubeBtn:hover {
  background: rgba(255, 0, 0, 0.2);
}

.pdfBtn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.pdfBtn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeletonRow {
  position: relative;
  height: 52px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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

@media (min-width: 1170px) {
  .row {
    grid-template-columns: 44px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: start;
  }

  .head {
    grid-template-columns: 44px minmax(0, 1fr) minmax(240px, auto);
    grid-template-rows: auto;
    align-items: center;
  }

  .actions {
    grid-column: 2;
    grid-row: 2;
    margin-top: 10px;
  }
}

@media (max-width: 820px) {
  .row {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .head,
  .actionsHead {
    display: none;
  }

  .actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
    padding-top: 4px;
  }

  .details {
    padding: 0 16px 16px 16px;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
  }
}

@media (max-width: 819px) {
  .header {
    align-items: stretch;
  }

  .row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .nr {
    padding-top: 0;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: auto;
    justify-content: stretch;
    gap: 8px;
  }

  .actions :global(.btn) {
    width: 100%;
    min-width: 0;
    justify-content: center;
  }

  .actions :global(.btn:nth-child(1)) {
    grid-column: 1 / 2;
    grid-row: 1;
  }

  .actions :global(.btn:nth-child(2)) {
    grid-column: 2 / 3;
    grid-row: 1;
  }

  .actions :global(.btn:nth-child(4)) {
    grid-column: 1 / 2;
    grid-row: 2;
  }

  .actions :global(.btn:nth-child(3)) {
    grid-column: 2 / 3;
    grid-row: 2;
  }

  .actions :global(.btn:nth-child(5)) {
    grid-column: 1 / -1;
    grid-row: 3;
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

@media (max-width: 520px) {
  .wrap {
    gap: var(--space-2);
  }

  .table {
    border-radius: var(--radius-md);
  }

  .row {
    padding: 12px;
  }

  .details {
    padding: 0 12px 12px 12px;
  }

  .actions {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }

  .actions :global(.btn:nth-child(1)),
  .actions :global(.btn:nth-child(2)),
  .actions :global(.btn:nth-child(3)),
  .actions :global(.btn:nth-child(4)),
  .actions :global(.btn:nth-child(5)) {
    grid-column: auto;
    grid-row: auto;
  }

  .inlineBtn {
    margin-top: 10px;
    margin-left: 0;
  }
}
</style>






