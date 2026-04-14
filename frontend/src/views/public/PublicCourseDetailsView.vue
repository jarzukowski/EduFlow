<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CourseBanner from '@/components/courses/CourseBanner.vue';

import { useCoursesStore } from '@/stores/courses.store';
import { usePublicLessonsStore } from '@/stores/publicLessons.store';

const route = useRoute();
const router = useRouter();

const coursesStore = useCoursesStore();
const publicLessonsStore = usePublicLessonsStore();

const courseId = computed<string>(() => {
  const rawCourseId = route.params.id;
  return typeof rawCourseId === 'string' ? rawCourseId : '';
});

const course = computed(() => coursesStore.currentCourse);
const courseLessons = computed(() => publicLessonsStore.activeCourseLessons);

const goBack = async (): Promise<void> => {
  await router.push({ name: 'courses' });
};

const loadCourseDetailsPage = async (nextCourseId: string): Promise<void> => {
  const fetchedCourse = await coursesStore.fetchCourseById(nextCourseId);

  if (!fetchedCourse) {
    publicLessonsStore.clearActiveCourse();
    return;
  }

  await publicLessonsStore.fetchLessonsForCourse(nextCourseId);
};

watch(
  courseId,
  (nextCourseId) => {
    if (!nextCourseId) {
      coursesStore.clearCurrentCourse();
      publicLessonsStore.clearActiveCourse();
      return;
    }

    void loadCourseDetailsPage(nextCourseId);
  },
  { immediate: true },
);
</script>

<template>
  <div class="container">
    <section :class="$style.page">
      <button class="btn btn--ghost" type="button" @click="goBack">
        ← Back to the course list
      </button>

      <p v-if="coursesStore.detailsLoading" :class="$style.info">
        Loading course...
      </p>

      <p v-else-if="coursesStore.detailsError" :class="$style.error" role="alert">
        {{ coursesStore.detailsError }}
      </p>

      <div v-else-if="course" :class="$style.layout">
        <CourseBanner
          :title="course.title"
          :thumbnail-url="course.thumbnailUrl"
        />

        <header :class="$style.header">
          <h1 :class="$style.title">{{ course.title }}</h1>

          <p v-if="course.description" :class="$style.description">
            {{ course.description }}
          </p>
        </header>

        <section :class="$style.section">
          <h2 :class="$style.sectionTitle">Lessons in this course</h2>

          <p v-if="publicLessonsStore.listLoading" :class="$style.info">
            Loading lessons...
          </p>

          <p
            v-else-if="publicLessonsStore.listError"
            :class="$style.error"
            role="alert"
          >
            {{ publicLessonsStore.listError }}
          </p>

          <ul v-else-if="courseLessons.length > 0" :class="$style.lessonList">
            <li
              v-for="lesson in courseLessons"
              :key="lesson.id"
              :class="$style.lessonItem"
            >
              <router-link
                :to="{ name: 'lesson-details', params: { id: lesson.id } }"
                :class="$style.lessonLink"
              >
                <span :class="$style.lessonIndex">{{ lesson.orderIndex }}.</span>
                <span :class="$style.lessonTitle">{{ lesson.title }}</span>
              </router-link>
            </li>
          </ul>

          <p v-else :class="$style.muted">
            No lessons in this course.
          </p>
        </section>
      </div>

      <p v-else :class="$style.muted">Course not found.</p>
    </section>
  </div>
</template>

<style module>
.page {
  padding: var(--space-6) 0;
  display: grid;
  gap: var(--space-5);
}

.layout {
  display: grid;
  gap: var(--space-5);
}

.header {
  display: grid;
  gap: var(--space-2);
}

.title {
  margin: 0;
  font-size: var(--text-2xl);
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
  overflow-wrap: anywhere;
}

.section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  padding: var(--space-6);
}

.sectionTitle {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.lessonList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-3);
}

.lessonItem {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

@media (hover: hover) {
  .lessonItem:hover {
    border-color: var(--color-border-strong);
  }
}

.lessonLink {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4);
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.lessonLink:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-lg);
}

.lessonIndex {
  color: var(--color-text-muted);
  min-width: 2ch;
  flex-shrink: 0;
}

.lessonTitle {
  min-width: 0;
  overflow-wrap: anywhere;
}

.info {
  margin: 0;
  color: var(--color-text-muted);
}

.error {
  margin: 0;
  color: var(--color-danger);
}

.muted {
  margin: 0;
  color: var(--color-text-muted);
}
</style>






