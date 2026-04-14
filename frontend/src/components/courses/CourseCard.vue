<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { CourseDTO } from '@/types/course.types';

const props = defineProps<{
  course: CourseDTO;
}>();

const isImageAvailable = ref(true);

const imageSource = computed<string>(() => {
  if (!isImageAvailable.value) return '';

  const rawThumbnailUrl = props.course.thumbnailUrl;
  if (typeof rawThumbnailUrl !== 'string') return '';

  const normalizedThumbnailUrl = rawThumbnailUrl.trim();
  return normalizedThumbnailUrl.length > 0 ? normalizedThumbnailUrl : '';
});

const imageAlt = computed<string>(() => `Course thumbnail: ${props.course.title}`);

const hasDescription = computed<boolean>(() => {
  const rawDescription = props.course.description;
  return typeof rawDescription === 'string' && rawDescription.trim().length > 0;
});

const onImageError = (): void => {
  isImageAvailable.value = false;
};

watch(
  () => props.course.thumbnailUrl,
  () => {
    isImageAvailable.value = true;
  },
);
</script>

<template>
  <router-link
    :to="{ name: 'course-details', params: { id: course.id } }"
    :class="$style.card"
    :aria-label="`Open course: ${course.title}`"
  >
    <div :class="$style.media" aria-hidden="true">
      <img
        v-if="imageSource"
        :src="imageSource"
        :alt="imageAlt"
        :class="$style.image"
        loading="lazy"
        decoding="async"
        @error="onImageError"
      />

      <div v-else :class="$style.fallback"></div>
    </div>

    <div :class="$style.body">
      <h3 :class="$style.title">{{ course.title }}</h3>

      <p v-if="hasDescription" :class="$style.description">
        {{ course.description }}
      </p>

      <div :class="$style.cta">
        View course <span aria-hidden="true">→</span>
      </div>
    </div>
  </router-link>
</template>

<style module>
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-2px);
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-lg);
  }
}

.card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring), var(--shadow-lg);
}

.media {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  flex-shrink: 0;
}

.image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(500px 220px at 20% 20%, rgba(47, 139, 255, 0.22), transparent 55%),
    radial-gradient(500px 220px at 80% 40%, rgba(109, 94, 252, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  min-height: 0;
}

.title {
  margin: 0;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cta {
  margin-top: auto;
  font-size: var(--text-sm);
  opacity: 0.92;
}
</style>



