<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    modelValue: string;
    busy: boolean;
    total: number;
    page: number;
    totalPages: number;
    limit: number;
    searchPlaceholder?: string;
  }>(),
  {
    searchPlaceholder: 'Search courses…',
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'update:limit', value: number): void;
  (event: 'reload'): void;
}>();

const onSearchInput = (event: Event): void => {
  const eventTarget = event.target;
  if (!(eventTarget instanceof HTMLInputElement)) return;

  emit('update:modelValue', eventTarget.value);
};

const onLimitChange = (event: Event): void => {
  const eventTarget = event.target;
  if (!(eventTarget instanceof HTMLSelectElement)) return;

  emit('update:limit', Number(eventTarget.value));
};
</script>

<template>
  <header :class="$style.header">
    <div :class="$style.info">
      <h1 :class="$style.title">{{ title }}</h1>

      <p :class="$style.meta">
        Results: <strong>{{ total }}</strong>
        <span aria-hidden="true"> · </span>
        Page <strong>{{ page }}</strong> z <strong>{{ totalPages }}</strong>
      </p>
    </div>

    <div :class="$style.controls">
      <div :class="$style.searchBox">
        <label class="sr-only" for="courses-search">Search courses</label>

        <input
          id="courses-search"
          class="input"
          type="search"
          :placeholder="searchPlaceholder"
          :value="modelValue"
          inputmode="search"
          autocomplete="off"
          @input="onSearchInput"
        />
      </div>

      <label :class="$style.limitLabel" for="courses-limit">
        <span>Per page:</span>

        <select
          id="courses-limit"
          class="input"
          :value="limit"
          :disabled="busy"
          @change="onLimitChange"
        >
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="36">36</option>
        </select>
      </label>

      <button
        class="btn btn--ghost"
        type="button"
        :disabled="busy"
        @click="$emit('reload')"
      >
        {{ busy ? 'Loading...' : 'Refresh' }}
      </button>
    </div>
  </header>
</template>

<style module>
.header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  backdrop-filter: blur(10px);
  padding: var(--space-5);
}

.info {
  min-width: 0;
}

.title {
  margin: 0;
  font-size: var(--text-xl);
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
}

.meta {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.controls {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
}

.searchBox {
  flex: 1;
  min-width: 220px;
}

.limitLabel {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.controls :global(.btn) {
  white-space: nowrap;
}

.controls :global(select.input) {
  color-scheme: dark;
  background-color: var(--color-surface-2);
  color: var(--color-text);
}

.controls :global(select.input option) {
  background-color: var(--color-surface-2);
  color: var(--color-text);
}

@media (max-width: 980px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .controls {
    justify-content: flex-start;
  }
}
</style>



