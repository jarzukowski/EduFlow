<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usePublicLessonsStore } from '@/stores/publicLessons.store';

const route = useRoute();
const router = useRouter();
const publicLessonsStore = usePublicLessonsStore();

const lessonId = computed<string>(() => {
  const rawLessonId = route.params.id;
  return typeof rawLessonId === 'string' ? rawLessonId : '';
});

const lesson = computed(() => publicLessonsStore.currentLesson);

const goBack = async (): Promise<void> => {
  const currentLesson = lesson.value;

  if (window.history.length > 1) {
    router.back();
    return;
  }

  if (currentLesson?.courseId) {
    await router.push({
      name: 'course-details',
      params: { id: currentLesson.courseId },
    });
    return;
  }

  await router.push({ name: 'courses' });
};

watch(
  lessonId,
  (nextLessonId) => {
    if (!nextLessonId) {
      publicLessonsStore.clearCurrentLesson();
      return;
    }

    void publicLessonsStore.fetchLessonById(nextLessonId);
  },
  { immediate: true },
);
</script>

<template>
  <div class="container">
    <section :class="$style.page">
      <button class="btn btn--ghost" type="button" @click="goBack">
        ← Back to the course
      </button>

      <p v-if="publicLessonsStore.detailsLoading" :class="$style.info">
        Loading lessons...
      </p>

      <p
        v-else-if="publicLessonsStore.detailsError"
        :class="$style.error"
        role="alert"
      >
        {{ publicLessonsStore.detailsError }}
      </p>

      <article v-else-if="lesson" :class="$style.lessonBox">
        <h1 :class="$style.title">{{ lesson.title }}</h1>

        <p v-if="lesson.content" :class="$style.content">
          {{ lesson.content }}
        </p>
      </article>

      <p v-else :class="$style.muted">Lesson not found.</p>
    </section>
  </div>
</template>

<style module>
.page {
  padding: var(--space-6) 0;
  display: grid;
  gap: var(--space-4);
}

.lessonBox {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  display: grid;
  gap: var(--space-4);
}

.title {
  margin: 0;
  font-size: var(--text-2xl);
  letter-spacing: var(--tracking-tight);
}

.content {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
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




