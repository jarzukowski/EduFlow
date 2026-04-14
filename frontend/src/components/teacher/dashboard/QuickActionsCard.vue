<script setup lang="ts">
defineProps<{
  hint: string;
}>();

const emit = defineEmits<{
  (e: 'openCoursePicker'): void;
  (e: 'createCourse'): void;
}>();
</script>

<template>
  <section class="card card--glass">
    <div class="card__body">
      <div class="row row--between">
        <h2 :class="$style.heading">Quick actions</h2>

        <button type="button" class="btn" @click="emit('openCoursePicker')">
          Choose course...
        </button>
      </div>

      <div :class="$style.actions">
        <button type="button" class="btn btn--primary" @click="emit('createCourse')">
          Add course
        </button>
      </div>

      <p class="muted" :class="$style.hint">
        {{ hint }}
      </p>
    </div>
  </section>
</template>

<style module>
.heading {
  margin: 0;
  font-size: var(--text-lg);
}

.actions {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hint {
  margin-top: 12px;
  font-size: var(--text-sm);
}
</style>

