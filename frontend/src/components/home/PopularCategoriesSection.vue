<script setup lang="ts">
type HomeCategory = {
  key: string;
  label: string;
  search: string;
};

const emit = defineEmits<{
  (e: 'category', value: string): void;
}>();

const categories: readonly HomeCategory[] = [
  {
    key: 'programming',
    label: 'Programming',
    search: 'programming',
  },
  {
    key: 'design',
    label: 'Design',
    search: 'design',
  },
  {
    key: 'business',
    label: 'Business',
    search: 'business',
  },
  {
    key: 'data-science',
    label: 'Databases',
    search: 'data',
  },
  {
    key: 'analytics',
    label: 'Data analytics',
    search: 'analytics',
  },
  {
    key: 'security',
    label: 'Security',
    search: 'security',
  },
  {
    key: 'languages',
    label: 'Foreign languages',
    search: 'languages',
  },
  {
    key: 'personal-development',
    label: 'Personal development',
    search: 'development',
  },
];
</script>

<template>
  <section :class="$style.section" aria-labelledby="popular-categories-title">
    <header :class="$style.header">
      <div>
        <h2 id="popular-categories-title" :class="$style.title">
          Popular categories
        </h2>
        <p :class="$style.subtitle">
          Click a category to open the catalog with a ready-made filter.
        </p>
      </div>
    </header>

    <div :class="$style.tiles">
      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        :class="$style.tile"
        @click="emit('category', category.search)"
      >
        <div :class="$style.tileLabel">{{ category.label }}</div>
        <div :class="$style.tileHint">Browse -></div>
      </button>
    </div>
  </section>
</template>

<style module>
.section {
  padding: clamp(18px, 2.4vw, 32px);
}

.header {
  margin-bottom: var(--space-4);
}

.title {
  font-size: clamp(20px, 2.2vw, 28px);
  letter-spacing: var(--tracking-tight);
}

.subtitle {
  margin-top: 6px;
  color: var(--color-text-muted);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.tile {
  min-height: 110px;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  backdrop-filter: blur(10px);
  text-align: left;
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.tile:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.tile:focus-visible {
  outline: none;
  border-color: var(--color-border-strong);
  box-shadow: var(--focus-ring), var(--shadow-md);
}

.tileLabel {
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.tileHint {
  margin-top: 6px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (max-width: 980px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .tiles {
    grid-template-columns: 1fr;
  }
}
</style>



