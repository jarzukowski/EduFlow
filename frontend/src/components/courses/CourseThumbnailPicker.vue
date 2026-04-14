<script setup lang="ts">
import {
  COURSE_THUMBNAILS,
  getCourseThumbnailSrc,
} from '@/components/courses/courseThumbnails';
import type { CourseThumbnailKey } from '@/components/courses/courseThumbnails';

defineProps<{
  modelValue: CourseThumbnailKey | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: CourseThumbnailKey | null): void;
}>();

const onSelectThumbnail = (thumbnailKey: CourseThumbnailKey | null): void => {
  emit('update:modelValue', thumbnailKey);
};
</script>

<template>
  <fieldset :class="$style.root" :disabled="disabled">
    <legend :class="$style.legend">Course thumbnail</legend>

    <div :class="$style.grid">
      <label
        :class="[$style.item, modelValue === null ? $style.active : '']"
      >
        <input
          :class="$style.radio"
          type="radio"
          name="courseThumbnail"
          :checked="modelValue === null"
          @change="onSelectThumbnail(null)"
        />

        <span :class="[$style.preview, $style.previewEmpty]" aria-hidden="true"></span>
        <span :class="$style.label">No thumbnail</span>
      </label>

      <label
        v-for="thumbnail in COURSE_THUMBNAILS"
        :key="thumbnail.key"
        :class="[$style.item, modelValue === thumbnail.key ? $style.active : '']"
      >
        <input
          :class="$style.radio"
          type="radio"
          name="courseThumbnail"
          :value="thumbnail.key"
          :checked="modelValue === thumbnail.key"
          @change="onSelectThumbnail(thumbnail.key)"
        />

        <span :class="$style.preview" aria-hidden="true">
          <img
            :class="$style.previewImage"
            :src="getCourseThumbnailSrc(thumbnail.key)"
            :alt="`Thumbnail: ${thumbnail.label}`"
            loading="lazy"
            decoding="async"
          />
        </span>

        <span :class="$style.label">{{ thumbnail.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style module>
.root {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: var(--space-5);
}

.legend {
  padding: 0 var(--space-2);
  color: var(--color-text);
  font-weight: 600;
  font-size: var(--text-sm);
}

.grid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.item {
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-3);
  display: grid;
  gap: var(--space-2);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

@media (hover: hover) {
  .item:hover {
    border-color: var(--color-border-strong);
    transform: translateY(-1px);
  }
}

.item:focus-within {
  box-shadow: var(--focus-ring);
  border-color: var(--color-border-strong);
}

.active {
  border-color: rgba(109, 94, 252, 0.55);
  box-shadow: var(--focus-ring);
}

.radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.preview {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--radius-md);
  aspect-ratio: 16 / 9;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.preview::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(500px 220px at 20% 20%, rgba(47, 139, 255, 0.22), transparent 55%),
    radial-gradient(500px 220px at 80% 40%, rgba(109, 94, 252, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  pointer-events: none;
}

.previewEmpty {
  background:
    radial-gradient(500px 220px at 20% 20%, rgba(47, 139, 255, 0.22), transparent 55%),
    radial-gradient(500px 220px at 80% 40%, rgba(109, 94, 252, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
}

.previewImage {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.label {
  font-size: var(--text-sm);
  color: var(--color-text);
  opacity: 0.95;
}

.hint {
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>



