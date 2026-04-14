<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { StudentCourseDTO } from '@/types/studentDashboard.types';

const props = defineProps<{
  courses: StudentCourseDTO[];
  loading: boolean;
  selectedCourseId: string | null;
}>();

const emit = defineEmits<{
  (event: 'selectCourse', courseId: string): void;
}>();

const MAX_VISIBLE_COURSES = 5;

const visibleWindowStartIndex = ref(0);

const maxWindowStartIndex = computed<number>(() => {
  return Math.max(0, props.courses.length - MAX_VISIBLE_COURSES);
});

const visibleCourses = computed<StudentCourseDTO[]>(() => {
  return props.courses.slice(
    visibleWindowStartIndex.value,
    visibleWindowStartIndex.value + MAX_VISIBLE_COURSES,
  );
});

const canScrollUp = computed<boolean>(() => {
  return visibleWindowStartIndex.value > 0;
});

const canScrollDown = computed<boolean>(() => {
  return visibleWindowStartIndex.value < maxWindowStartIndex.value;
});

const syncVisibleWindowToSelectedCourse = (): void => {
  const activeCourseId = props.selectedCourseId;

  if (!activeCourseId) {
    return;
  }

  const selectedCourseIndex = props.courses.findIndex((course) => course.id === activeCourseId);

  if (selectedCourseIndex < 0) {
    return;
  }

  const currentWindowStartIndex = visibleWindowStartIndex.value;
  const currentWindowEndIndex = currentWindowStartIndex + MAX_VISIBLE_COURSES - 1;

  if (selectedCourseIndex < currentWindowStartIndex) {
    visibleWindowStartIndex.value = selectedCourseIndex;
    return;
  }

  if (selectedCourseIndex > currentWindowEndIndex) {
    visibleWindowStartIndex.value = Math.min(
      selectedCourseIndex - (MAX_VISIBLE_COURSES - 1),
      maxWindowStartIndex.value,
    );
  }
};

const clampVisibleWindow = (): void => {
  if (visibleWindowStartIndex.value > maxWindowStartIndex.value) {
    visibleWindowStartIndex.value = maxWindowStartIndex.value;
  }

  if (visibleWindowStartIndex.value < 0) {
    visibleWindowStartIndex.value = 0;
  }
};

const scrollVisibleWindow = (direction: 'up' | 'down'): void => {
  if (direction === 'up') {
    if (!canScrollUp.value) {
      return;
    }

    visibleWindowStartIndex.value = Math.max(0, visibleWindowStartIndex.value - 1);
    return;
  }

  if (!canScrollDown.value) {
    return;
  }

  visibleWindowStartIndex.value = Math.min(
    maxWindowStartIndex.value,
    visibleWindowStartIndex.value + 1,
  );
};

const onSelectCourse = (courseId: string): void => {
  emit('selectCourse', courseId);
};

watch(
  () => props.courses.length,
  () => {
    clampVisibleWindow();
    syncVisibleWindowToSelectedCourse();
  },
  { immediate: true },
);

watch(
  () => props.selectedCourseId,
  () => {
    syncVisibleWindowToSelectedCourse();
  },
  { immediate: true },
);
</script>

<template>
  <section class="card card--glass">
    <div class="card__body">
      <div class="row row--between" :class="$style.header">
        <h2 :class="$style.heading">Quick actions</h2>

        <div :class="$style.controls" aria-label="Course list scrolling">
          <button
            type="button"
            class="btn btn--ghost"
            :class="$style.iconButton"
            :disabled="!canScrollUp"
            aria-label="Scroll up"
            @click="scrollVisibleWindow('up')"
          >
            <svg viewBox="0 0 24 24" :class="$style.icon" aria-hidden="true">
              <path
                d="M6.7 14.8a1 1 0 0 1 0-1.4l4.6-4.6a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 1 1-1.4 1.4L12 10.9l-3.9 3.9a1 1 0 0 1-1.4 0Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <button
            type="button"
            class="btn btn--ghost"
            :class="$style.iconButton"
            :disabled="!canScrollDown"
            aria-label="Scroll down"
            @click="scrollVisibleWindow('down')"
          >
            <svg viewBox="0 0 24 24" :class="$style.icon" aria-hidden="true">
              <path
                d="M6.7 9.2a1 1 0 0 1 1.4 0L12 13.1l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L6.7 10.6a1 1 0 0 1 0-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="loading" :class="$style.skeletonList">
        <div
          v-for="skeletonIndex in 5"
          :key="skeletonIndex"
          :class="$style.skeletonItem"
          aria-hidden="true"
        />
      </div>

      <div v-else :class="$style.wrapper">
        <div v-if="canScrollUp" :class="[$style.fade, $style.fadeTop]" aria-hidden="true" />
        <div v-if="canScrollDown" :class="[$style.fade, $style.fadeBottom]" aria-hidden="true" />

        <div :class="$style.courseList">
          <button
            v-for="course in visibleCourses"
            :key="course.id"
            type="button"
            :class="[
              $style.courseItem,
              course.id === selectedCourseId ? $style.courseItemActive : null,
            ]"
            :aria-pressed="course.id === selectedCourseId"
            @click="onSelectCourse(course.id)"
          >
            <div :class="$style.courseTitle" :title="course.title">
              {{ course.title }}
            </div>

            <div class="muted" :class="$style.courseSubtitle">
              {{ course.completedLessonsCount }} / {{ course.lessonsCount }}
            </div>
          </button>

          <div v-if="visibleCourses.length === 0" class="muted">
            No courses.
          </div>
        </div>

        <div v-if="courses.length > MAX_VISIBLE_COURSES" class="muted" :class="$style.hint">
          Showing {{ MAX_VISIBLE_COURSES }} of {{ courses.length }} courses.
        </div>
      </div>
    </div>
  </section>
</template>

<style module>
.header {
  gap: var(--space-3);
}

.heading {
  margin: 0;
  font-size: var(--text-lg);
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.iconButton {
  padding: 8px 10px;
  border-radius: var(--radius-pill);
  line-height: 1;
}

.iconButton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.icon {
  width: 18px;
  height: 18px;
}

.wrapper {
  position: relative;
  margin-top: var(--space-4);
}

.courseList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 28px;
  pointer-events: none;
  z-index: 1;
}

.fadeTop {
  top: 0;
  background: linear-gradient(180deg, rgba(13, 18, 36, 0.92), rgba(13, 18, 36, 0));
}

.fadeBottom {
  bottom: 0;
  background: linear-gradient(0deg, rgba(13, 18, 36, 0.92), rgba(13, 18, 36, 0));
}

.courseItem {
  text-align: left;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  padding: 12px;
  cursor: pointer;
}

.courseItem:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.courseItemActive {
  border-color: rgba(120, 120, 255, 0.65);
  box-shadow: 0 0 0 2px rgba(120, 120, 255, 0.2) inset;
}

.courseTitle {
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.courseSubtitle {
  margin-top: 4px;
  font-size: var(--text-xs);
}

.hint {
  margin-top: 10px;
  font-size: var(--text-xs);
}

.skeletonList {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeletonItem {
  height: 56px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}

.skeletonItem::after {
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




