<script setup lang="ts">
import { computed } from 'vue';

import type { TeacherLessonDTO } from '@/types/teacherDashboard.types';

type Props = {
  lessons: TeacherLessonDTO[];
  loading: boolean;
  error: string | null;
  lessonBusyByLessonId: Record<string, boolean>;
  lessonErrorByLessonId: Record<string, string | null>;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'createLesson'): void;
  (e: 'editLesson', lessonId: string): void;
  (e: 'deleteLesson', lessonId: string): void;
}>();

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

const formatMinutes = (totalMinutes: number): string => {
  const normalizedMinutes = Number.isFinite(totalMinutes)
    ? Math.max(0, Math.floor(totalMinutes))
    : 0;

  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

const getLessonContent = (content: string | null | undefined): string | null => {
  if (typeof content !== 'string') {
    return null;
  }

  const normalizedContent = content.trim();
  return normalizedContent.length > 0 ? normalizedContent : null;
};

const hasLessonVideo = (lesson: TeacherLessonDTO): boolean => {
  return typeof lesson.videoUrl === 'string' && lesson.videoUrl.trim().length > 0;
};

const hasLessonDuration = (lesson: TeacherLessonDTO): boolean => {
  return typeof lesson.durationMinutes === 'number' && Number.isFinite(lesson.durationMinutes);
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <div class="row row--between" :class="$style.sectionHeader">
        <h2 :class="$style.sectionTitle">Lessons</h2>

        <button type="button" class="btn btn--primary" @click="emit('createLesson')">
          Add lesson
        </button>
      </div>

      <p v-if="loading" class="muted" :class="$style.state">
        Loading lessons...
      </p>

      <p v-if="error" :class="$style.errorInline">
        {{ error }}
      </p>

      <ul v-if="sortedLessons.length > 0" :class="$style.lessonList">
        <li
          v-for="lesson in sortedLessons"
          :key="lesson.id"
          :class="$style.lessonRow"
        >
          <div :class="$style.lessonMain">
            <div :class="$style.lessonIndex">
              {{ lesson.orderIndex }}
            </div>

            <div :class="$style.lessonContent">
              <div :class="$style.lessonTitle">
                {{ lesson.title }}
              </div>

              <p v-if="getLessonContent(lesson.content)" :class="$style.lessonExcerpt">
                {{ getLessonContent(lesson.content) }}
              </p>

              <div :class="$style.lessonMeta">
                <span v-if="hasLessonDuration(lesson)">
                  {{ formatMinutes(lesson.durationMinutes ?? 0) }}
                </span>
                <span v-if="hasLessonVideo(lesson)">• Video</span>
                <span v-if="lesson.hasPdf">• PDF</span>
              </div>

              <p v-if="getLessonError(lesson.id)" :class="$style.lessonError">
                {{ getLessonError(lesson.id) }}
              </p>
            </div>
          </div>

          <div :class="$style.lessonActions">
            <button
              type="button"
              class="btn btn--ghost"
              :disabled="loading || isLessonBusy(lesson.id)"
              @click="emit('editLesson', lesson.id)"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn btn--danger"
              :disabled="loading || isLessonBusy(lesson.id)"
              @click="emit('deleteLesson', lesson.id)"
            >
              {{ isLessonBusy(lesson.id) ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </li>
      </ul>

      <p v-else-if="!loading" class="muted" :class="$style.state">
        No lessons in this course.
      </p>
    </div>
  </section>
</template>

<style module>
.sectionHeader {
  gap: var(--space-4);
}

.sectionTitle {
  margin: 0;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.state {
  margin-top: var(--space-3);
}

.errorInline {
  margin-top: var(--space-3);
  color: var(--color-danger);
}

.lessonList {
  list-style: none;
  margin: var(--space-3) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lessonRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-4);
  align-items: start;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.lessonMain {
  min-width: 0;
  display: flex;
  gap: var(--space-3);
}

.lessonIndex {
  min-width: 20px;
  padding-top: 2px;
  font-weight: 800;
  opacity: 0.55;
}

.lessonContent {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lessonTitle {
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.lessonExcerpt {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.lessonMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: var(--text-xs);
}

.lessonError {
  margin: 0;
  color: var(--color-danger);
}

.lessonActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .lessonRow {
    grid-template-columns: 1fr;
  }

  .lessonActions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .sectionHeader {
    align-items: stretch;
  }

  .sectionHeader :global(.btn) {
    width: 100%;
    justify-content: center;
  }

  .lessonActions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .lessonActions :global(.btn) {
    width: 100%;
    justify-content: center;
  }

  .lessonRow {
    padding: 12px;
  }

  .lessonMain {
    align-items: flex-start;
  }
}
</style>





