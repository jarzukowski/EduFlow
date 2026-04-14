<script setup lang="ts">
import { onMounted } from 'vue';

import CourseCard from '@/components/courses/CourseCard.vue';
import { useCoursesStore } from '@/stores/courses.store';

const coursesStore = useCoursesStore();

const featuredSkeletonCount = 12;

onMounted(async (): Promise<void> => {
  await coursesStore.fetchFeaturedCourses({ limit: 12 });
});
</script>

<template>
  <section :class="$style.section" aria-labelledby="featured-courses-title">
    <header :class="$style.header">
      <div>
        <h2 id="featured-courses-title" :class="$style.title">Featured courses</h2>
        <p :class="$style.subtitle">
          Latest courses from the catalog. Start quickly with something specific.
        </p>
      </div>

      <router-link to="/courses" class="link">
        See all <span aria-hidden="true">→</span>
      </router-link>
    </header>

    <p v-if="coursesStore.featuredError" :class="$style.error" role="status">
      {{ coursesStore.featuredError }}
    </p>

    <div
      v-if="coursesStore.featuredLoading"
      :class="$style.grid"
      aria-hidden="true"
    >
      <div
        v-for="skeletonIndex in featuredSkeletonCount"
        :key="skeletonIndex"
        :class="[$style.skeletonCard, $style.skeleton]"
      >
        <div :class="$style.thumbnailSkeleton"></div>
        <div :class="$style.bodySkeleton">
          <div :class="$style.titleSkeleton"></div>
          <div :class="$style.lineSkeleton"></div>
          <div :class="[$style.lineSkeleton, $style.shortLine]"></div>
          <div :class="$style.ctaSkeleton"></div>
        </div>
      </div>
    </div>

    <div v-else :class="$style.grid">
      <CourseCard
        v-for="course in coursesStore.featuredCourses"
        :key="course.id"
        :course="course"
      />

      <div v-if="coursesStore.featuredCourses.length === 0" :class="$style.empty">
        No courses to display.
      </div>
    </div>
  </section>
</template>

<style module>
.section {
  padding: clamp(18px, 2.4vw, 32px);
}

.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.title {
  font-size: clamp(20px, 2.2vw, 28px);
  letter-spacing: var(--tracking-tight);
}

.subtitle {
  max-width: 70ch;
  margin-top: 6px;
  color: var(--color-text-muted);
}

.error {
  margin-bottom: var(--space-4);
  color: var(--color-danger);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.empty {
  grid-column: 1 / -1;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
}

.skeletonCard {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
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

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.thumbnailSkeleton {
  height: 130px;
  background: rgba(255, 255, 255, 0.05);
}

.bodySkeleton {
  padding: var(--space-5);
}

.titleSkeleton,
.lineSkeleton,
.ctaSkeleton {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}

.titleSkeleton {
  width: 62%;
  height: 18px;
  margin-bottom: 12px;
}

.lineSkeleton {
  width: 100%;
  height: 12px;
  margin-bottom: 10px;
}

.shortLine {
  width: 70%;
}

.ctaSkeleton {
  width: 40%;
  height: 12px;
  margin-top: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>



