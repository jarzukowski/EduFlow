<script setup lang="ts">
type CoursesPaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

defineProps<{
  page: number;
  totalPages: number;
  items: CoursesPaginationItem[];
  busy: boolean;
}>();

defineEmits<{
  (event: 'prev'): void;
  (event: 'next'): void;
  (event: 'page', value: number): void;
}>();
</script>

<template>
  <nav :class="$style.pager" aria-label="Course pagination">
    <button
      class="btn btn--ghost"
      type="button"
      :disabled="busy || page <= 1"
      aria-label="Previous page"
      @click="$emit('prev')"
    >
      Previous
    </button>

    <template v-for="item in items" :key="String(item)">
      <span
        v-if="typeof item !== 'number'"
        :class="$style.ellipsis"
        aria-hidden="true"
      >
        …
      </span>

      <button
        v-else
        class="btn btn--ghost"
        :class="$style.pageButton"
        type="button"
        :data-active="item === page"
        :disabled="busy"
        :aria-current="item === page ? 'page' : undefined"
        :aria-label="`Go to page ${item}`"
        @click="$emit('page', item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      class="btn btn--ghost"
      type="button"
      :disabled="busy || page >= totalPages"
      aria-label="Next page"
      @click="$emit('next')"
    >
      Next
    </button>
  </nav>
</template>

<style module>
.pager {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  box-shadow: var(--shadow-sm);
}

.pageButton,
.pager :global(.btn) {
  min-width: 44px;
}

.pageButton[data-active='true'] {
  box-shadow: var(--focus-ring);
  border-color: var(--color-border-strong);
}

.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  color: var(--color-text-muted);
}
</style>



