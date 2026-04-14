<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  title: string;
  thumbnailUrl?: string | null;
}>();

const isImageAvailable = ref(true);

const imageSource = computed<string>(() => {
  if (!isImageAvailable.value) return '';

  const rawThumbnailUrl = props.thumbnailUrl;
  if (typeof rawThumbnailUrl !== 'string') return '';

  const normalizedThumbnailUrl = rawThumbnailUrl.trim();
  return normalizedThumbnailUrl.length > 0 ? normalizedThumbnailUrl : '';
});

const imageAlt = computed<string>(() => `Course thumbnail: ${props.title}`);

const onImageError = (): void => {
  isImageAvailable.value = false;
};

watch(
  () => props.thumbnailUrl,
  () => {
    isImageAvailable.value = true;
  },
);
</script>

<template>
  <div :class="$style.banner">
    <img
      v-if="imageSource"
      :class="$style.image"
      :src="imageSource"
      :alt="imageAlt"
      loading="lazy"
      decoding="async"
      @error="onImageError"
    />

    <div v-else :class="$style.fallback" aria-hidden="true"></div>
  </div>
</template>

<style module>
.banner {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: var(--shadow-lg);
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
    radial-gradient(700px 280px at 20% 20%, rgba(47, 139, 255, 0.22), transparent 55%),
    radial-gradient(700px 280px at 80% 40%, rgba(109, 94, 252, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}
</style>



