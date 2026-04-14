<script setup lang="ts">
import CourseCard from '@/components/courses/CourseCard.vue';

import type { CourseDTO } from '@/types/course.types';

withDefaults(
  defineProps<{
    items: CourseDTO[];
    loading: boolean;
    skeletonCount?: number;
    emptyText: string;
  }>(),
  {
    skeletonCount: 12,
  },
);
</script>

<template>
  <section :class="$style.root" :aria-busy="loading ? 'true' : 'false'">
    <div v-if="loading" :class="$style.grid" aria-live="polite">
      <div
        v-for="index in skeletonCount"
        :key="index"
        :class="[$style.skeletonCard, $style.skeleton]"
        aria-hidden="true"
      >
        <div :class="$style.skeletonMedia"></div>
        <div :class="$style.skeletonBody">
          <div :class="$style.skeletonTitle"></div>
          <div :class="$style.skeletonLine"></div>
          <div :class="[$style.skeletonLine, $style.skeletonLineShort]"></div>
        </div>
      </div>
    </div>

    <ul v-else-if="items.length > 0" :class="$style.gridList">
      <li
        v-for="course in items"
        :key="course.id"
        :class="$style.gridItem"
      >
        <CourseCard :course="course" />
      </li>
    </ul>

    <p v-else :class="$style.empty" role="status">
      {{ emptyText }}
    </p>
  </section>
</template>

<style module>
.root {
  display: grid;
  gap: var(--space-4);
}

.grid,
.gridList {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gridList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.gridItem {
  min-width: 0;
  display: flex;
}

.gridItem > * {
  flex: 1;
}

@media (max-width: 1100px) {
  .grid,
  .gridList {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .grid,
  .gridList {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid,
  .gridList {
    grid-template-columns: 1fr;
  }
}

.skeletonCard {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.skeleton {
  position: relative;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.06),
    transparent
  );
  animation: shimmer 1.1s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.skeletonMedia {
  aspect-ratio: 16 / 9;
  background: rgba(255, 255, 255, 0.06);
}

.skeletonBody {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 150px;
}

.skeletonTitle,
.skeletonLine {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}

.skeletonTitle {
  height: 16px;
  width: 60%;
}

.skeletonLine {
  height: 12px;
  width: 100%;
}

.skeletonLineShort {
  width: 70%;
}

.empty {
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  padding: var(--space-6);
  color: var(--color-text-muted);
}
</style>


