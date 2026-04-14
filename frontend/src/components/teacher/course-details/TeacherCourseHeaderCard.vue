<script setup lang="ts">
type Props = {
  title: string;
  description?: string | null;
  lessonsCount: number;
  studentsCount: number;
  totalDurationLabel: string;
  error?: string | null;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: 'editCourse'): void;
  (e: 'deleteCourse'): void;
}>();
</script>

<template>
  <section class="card">
    <div class="card__body">
      <div class="row row--between" :class="$style.header">
        <div :class="$style.headerText">
          <h1 :class="$style.title">{{ title }}</h1>

          <p v-if="description" :class="$style.description">
            {{ description }}
          </p>

          <div :class="$style.badges" aria-label="Course metadata">
            <span class="badge">Lessons: <strong>{{ lessonsCount }}</strong></span>
            <span class="badge">Students: <strong>{{ studentsCount }}</strong></span>
            <span class="badge">Duration: <strong>{{ totalDurationLabel }}</strong></span>
          </div>
        </div>

        <div :class="$style.headerActions">
          <button type="button" class="btn btn--primary" @click="emit('editCourse')">
            Edit
          </button>

          <button type="button" class="btn btn--danger" @click="emit('deleteCourse')">
            Delete
          </button>
        </div>
      </div>

      <p v-if="error" :class="$style.errorInline">
        {{ error }}
      </p>
    </div>
  </section>
</template>

<style module>
.header {
  gap: var(--space-4);
  align-items: flex-start;
}

.headerText {
  min-width: 0;
  flex: 1 1 auto;
  max-width: min(100%, 120ch);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: var(--text-xl);
  line-height: 1.2;
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
}

.description {
  max-width: none;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.headerActions {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  white-space: nowrap;
}

.errorInline {
  margin-top: var(--space-3);
  color: var(--color-danger);
}

@media (max-width: 1024px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .headerActions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .headerActions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .headerActions :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>

