<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import type { TeacherCourseSummaryDTO } from '@/types/teacherDashboard.types';

const props = defineProps<{
  open: boolean;
  courses: TeacherCourseSummaryDTO[];
  initialCourseId: string | null;
  busy: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openCourse', courseId: string): void;
  (e: 'editCourse', courseId: string): void;
  (e: 'createLesson', courseId: string): void;
  (e: 'deleteCourse', courseId: string): void;
}>();

const selectedCourseId = ref<string>('');

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    selectedCourseId.value = props.initialCourseId ?? props.courses[0]?.id ?? '';
  },
  { immediate: true },
);

const selectedCourse = computed<TeacherCourseSummaryDTO | null>(() => {
  return props.courses.find((course) => course.id === selectedCourseId.value) ?? null;
});

const canProceed = computed<boolean>(() => {
  return Boolean(selectedCourseId.value) && !props.busy;
});

const close = (): void => {
  emit('close');
};

const emitOpenCourse = (): void => {
  if (!selectedCourseId.value) {
    return;
  }

  emit('openCourse', selectedCourseId.value);
};

const emitEditCourse = (): void => {
  if (!selectedCourseId.value) {
    return;
  }

  emit('editCourse', selectedCourseId.value);
};

const emitCreateLesson = (): void => {
  if (!selectedCourseId.value) {
    return;
  }

  emit('createLesson', selectedCourseId.value);
};

const emitDeleteCourse = (): void => {
  if (!selectedCourseId.value) {
    return;
  }

  emit('deleteCourse', selectedCourseId.value);
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (!props.open || event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  close();
};

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      :class="$style.overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Quick actions for the course"
    >
      <button
        type="button"
        :class="$style.overlayClickCatcher"
        aria-label="Close modal"
        @click="close"
      />

      <div :class="[$style.modal, 'card', 'card--glass']" role="document">
        <button
          type="button"
          class="btn btn--icon"
          :class="$style.close"
          aria-label="Close"
          @click="close"
        >
          ✕
        </button>

        <div class="card__body">
          <h2 :class="$style.heading">Quick actions</h2>
          <p class="muted" :class="$style.description">
            Pick a course and take action without scrolling the list.
          </p>

          <div :class="$style.formRow">
            <label :class="$style.label" for="quick-actions-course">
              Course
            </label>

            <select
              id="quick-actions-course"
              v-model="selectedCourseId"
              class="input"
              :disabled="busy"
            >
              <option v-if="courses.length === 0" value="" disabled>
                No courses
              </option>

              <option
                v-for="course in courses"
                :key="course.id"
                :value="course.id"
              >
                {{ course.title }}
              </option>
            </select>
          </div>

          <div v-if="selectedCourse?.description" class="muted" :class="$style.courseDescription">
            {{ selectedCourse.description }}
          </div>

          <div :class="$style.actions">
            <button
              type="button"
              class="btn"
              :disabled="!canProceed"
              @click="emitOpenCourse"
            >
              Open course
            </button>

            <button
              type="button"
              class="btn"
              :disabled="!canProceed"
              @click="emitEditCourse"
            >
              Edit course
            </button>

            <button
              type="button"
              class="btn btn--primary"
              :disabled="!canProceed"
              @click="emitCreateLesson"
            >
              Add lesson
            </button>

            <button
              type="button"
              class="btn btn--danger"
              :disabled="!canProceed"
              @click="emitDeleteCourse"
            >
              Delete course
            </button>
          </div>

          <p class="muted" :class="$style.hint">
            Deleting a course also removes its lessons and student enrollments. This action is irreversible.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-6);
}

.overlayClickCatcher {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  cursor: default;
}

.modal {
  position: relative;
  z-index: calc(var(--z-modal) + 1);
  width: min(720px, 100%);
  border-radius: var(--radius-xl);
}

.close {
  position: absolute;
  top: 14px;
  right: 14px;
}

.heading {
  margin: 0;
  font-size: var(--text-xl);
  letter-spacing: var(--tracking-tight);
}

.description {
  margin-top: 6px;
}

.formRow {
  margin-top: var(--space-4);
  display: grid;
  gap: 8px;
}

.label {
  font-size: var(--text-sm);
  font-weight: 700;
}

.actions {
  margin-top: var(--space-5);
  display: grid;
  gap: var(--space-3);
}

.courseDescription {
  margin-top: 10px;
  overflow-wrap: anywhere;
}

.hint {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
}
</style>




