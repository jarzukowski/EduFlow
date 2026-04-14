<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';

import type { StudentSuggestDTO } from '@/types/teacherDashboard.types';

const props = defineProps<{
  open: boolean;
  courseId: string;
  busy?: boolean;
  error?: string | null;
  suggest: (query: string) => Promise<StudentSuggestDTO[]>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'enroll', studentId: string): void;
}>();

const query = ref('');
const results = ref<StudentSuggestDTO[]>([]);
const loading = ref(false);
const selectedStudentId = ref<string | null>(null);

const canSearch = computed<boolean>(() => query.value.trim().length >= 4);
const canClose = computed<boolean>(() => !props.busy);

let debounceId: number | null = null;

const clearDebounce = (): void => {
  if (debounceId !== null) {
    window.clearTimeout(debounceId);
    debounceId = null;
  }
};

const resetState = (): void => {
  clearDebounce();
  query.value = '';
  results.value = [];
  loading.value = false;
  selectedStudentId.value = null;
};

const close = (): void => {
  if (!canClose.value) {
    return;
  }

  resetState();
  emit('close');
};

const onEnrollClick = (studentId: string): void => {
  if (props.busy || !studentId) {
    return;
  }

  selectedStudentId.value = studentId;
  emit('enroll', studentId);
};

watch(
  () => query.value,
  (queryValue) => {
    const normalizedQuery = queryValue.trim();

    if (normalizedQuery.length < 4) {
      clearDebounce();
      results.value = [];
      loading.value = false;
      return;
    }

    clearDebounce();

    debounceId = window.setTimeout(async () => {
      loading.value = true;

      try {
        results.value = await props.suggest(normalizedQuery);
      } finally {
        loading.value = false;
      }
    }, 280);
  },
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      return;
    }

    resetState();
  },
);

const onKeyDown = (event: KeyboardEvent): void => {
  if (!props.open || event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  close();
};

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  clearDebounce();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      :class="$style.overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-student-modal-title"
    >
      <button
        type="button"
        :class="$style.overlayClickCatcher"
        :disabled="!canClose"
        aria-label="Close modal"
        @click="close"
      />

      <section :class="[$style.modal, 'card']" role="document">
        <div class="card__body">
          <div class="row row--between">
            <h2 id="enroll-student-modal-title" :class="$style.title">
              Add student
            </h2>

            <button
              type="button"
              class="btn btn--ghost"
              :disabled="Boolean(busy)"
              aria-label="Close"
              @click="close"
            >
              ✕
            </button>
          </div>

          <p class="muted" :class="$style.subtitle">
            Enter the student's email. After at least 4 characters, masked suggestions will appear.
          </p>

          <div :class="$style.field">
            <label for="enroll-student-query" :class="$style.label">
              Student email
            </label>

            <input
              id="enroll-student-query"
              v-model.trim="query"
              type="text"
              class="input"
              placeholder="e.g. jane@..."
              autocomplete="off"
              :disabled="Boolean(busy)"
            />
          </div>

          <p v-if="error" :class="$style.error">
            {{ error }}
          </p>

          <div :class="$style.content">
            <p v-if="loading" class="muted">
              Searching...
            </p>

            <div v-else-if="canSearch && results.length > 0" :class="$style.results">
              <button
                v-for="result in results"
                :key="result.userId"
                type="button"
                :class="[$style.result, busy ? $style.resultDisabled : null]"
                :disabled="Boolean(busy)"
                @click="onEnrollClick(result.userId)"
              >
                <span :class="$style.email">{{ result.emailMasked }}</span>

                <span
                  v-if="result.displayName"
                  class="muted"
                  :class="$style.small"
                >
                  {{ result.displayName }}
                </span>

                <span class="muted" :class="$style.small">
                  Click to add to the course
                </span>
              </button>
            </div>

            <p v-else-if="canSearch && !loading" class="muted">
              No suggestions. Check the spelling or enter more characters.
            </p>

            <p v-else class="muted">
              Start typing to see suggestions.
            </p>
          </div>

          <footer :class="$style.footer">
            <button
              type="button"
              class="btn"
              :disabled="Boolean(busy)"
              @click="close"
            >
              Close
            </button>
          </footer>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-5);
}

.overlayClickCatcher {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  cursor: default;
}

.modal {
  position: relative;
  z-index: calc(var(--z-modal) + 1);
  width: 100%;
  max-width: 520px;
  max-height: calc(100dvh - (2 * var(--space-5)));
  overflow: auto;
}

.title {
  margin: 0;
}

.subtitle {
  margin-top: 10px;
}

.field {
  margin-top: 12px;
}

.label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.content {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
  text-align: left;
}

.email {
  font-weight: 800;
}

.small {
  font-size: var(--text-xs);
}

.footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.error {
  margin-top: 10px;
  color: var(--color-danger);
}

.resultDisabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .footer :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>





