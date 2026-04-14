<script setup lang="ts">
import { computed } from 'vue';

type Props = {
  page: number;
  totalPages: number;
  loading?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  prevAriaLabel?: string;
  nextAriaLabel?: string;
};

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  prevLabel: 'Previous',
  nextLabel: 'Next',
  prevAriaLabel: 'Previous page',
  nextAriaLabel: 'Next page',
});

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
}>();

const isPrevDisabled = computed<boolean>(
  () => Boolean(props.loading) || props.page <= 1,
);

const isNextDisabled = computed<boolean>(
  () => Boolean(props.loading) || props.page >= props.totalPages,
);

const onPrevClick = (): void => {
  if (isPrevDisabled.value) {
    return;
  }

  emit('prev');
};

const onNextClick = (): void => {
  if (isNextDisabled.value) {
    return;
  }

  emit('next');
};
</script>

<template>
  <nav :class="$style.root" aria-label="Pagination">
    <button
      type="button"
      class="btn btn--ghost"
      :disabled="isPrevDisabled"
      :aria-label="prevAriaLabel"
      @click="onPrevClick"
    >
      <span :class="$style.buttonLabelText">{{ prevLabel }}</span>
      <span :class="$style.buttonLabelIcon" aria-hidden="true">‹</span>
      <span class="sr-only">{{ prevLabel }}</span>
    </button>

    <div :class="[$style.pageInfo, 'muted']">
      Page {{ page }} / {{ totalPages }}
    </div>

    <button
      type="button"
      class="btn btn--ghost"
      :disabled="isNextDisabled"
      :aria-label="nextAriaLabel"
      @click="onNextClick"
    >
      <span :class="$style.buttonLabelText">{{ nextLabel }}</span>
      <span :class="$style.buttonLabelIcon" aria-hidden="true">›</span>
      <span class="sr-only">{{ nextLabel }}</span>
    </button>
  </nav>
</template>

<style module>
.root {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.pageInfo {
  text-align: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.buttonLabelIcon {
  display: none;
  font-size: 22px;
  line-height: 1;
}

@media (max-width: 470px) {
  .root {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'info info'
      'prev next';
    gap: var(--space-3);
    align-items: stretch;
  }

  .pageInfo {
    grid-area: info;
    padding: 6px 0;
  }

  .root :global(.btn) {
    width: 100%;
    justify-content: center;
    white-space: nowrap;
  }

  .root :global(.btn):first-child {
    grid-area: prev;
  }

  .root :global(.btn):last-child {
    grid-area: next;
  }
}

@media (max-width: 350px) {
  .buttonLabelText {
    display: none;
  }

  .buttonLabelIcon {
    display: inline;
  }

  .root {
    grid-template-columns: 1fr;
    grid-template-areas:
      'info'
      'prev'
      'next';
  }

  .root :global(.btn) {
    padding: 10px 12px;
    border-radius: var(--radius-md);
  }
}
</style>

