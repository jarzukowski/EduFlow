<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import CourseThumbnailPicker from '@/components/courses/CourseThumbnailPicker.vue';

import type {
  CourseFormInitialValues,
  CourseFormValues,
  CreateCoursePayload,
  UpdateCoursePayload,
} from '@/types/course.types';

type CourseFormMode = 'create' | 'edit';

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 90;
const DESCRIPTION_MAX_LENGTH = 2000;

const props = defineProps<{
  mode: CourseFormMode;
  busy: boolean;
  error: string | null;
  initialValues?: CourseFormInitialValues;
}>();

const emit = defineEmits<{
  (event: 'submit:create', payload: CreateCoursePayload): void;
  (event: 'submit:edit', payload: UpdateCoursePayload): void;
  (event: 'cancel'): void;
}>();

const localError = ref<string | null>(null);
const submitAttempted = ref(false);
const titleTouched = ref(false);
const descriptionTouched = ref(false);

const formState = reactive<CourseFormValues>({
  title: '',
  description: '',
  thumbnailKey: null,
});

const applyInitialValues = (initialValues?: CourseFormInitialValues): void => {
  formState.title = initialValues?.title ?? '';
  formState.description = initialValues?.description ?? '';
  formState.thumbnailKey = initialValues?.thumbnailKey ?? null;

  localError.value = null;
  submitAttempted.value = false;
  titleTouched.value = false;
  descriptionTouched.value = false;
};

const normalizeTitle = (value: string): string => value.trim();
const normalizeDescription = (value: string): string => value.trim();

const getTitleError = (value: string): string => {
  const normalizedTitle = normalizeTitle(value);

  if (normalizedTitle.length === 0) {
    return 'Title is required.';
  }

  if (normalizedTitle.length < TITLE_MIN_LENGTH) {
    return `Title must have at least ${TITLE_MIN_LENGTH} characters.`;
  }

  if (normalizedTitle.length > TITLE_MAX_LENGTH) {
    return `Title can have at most ${TITLE_MAX_LENGTH} characters.`;
  }

  return '';
};

const getDescriptionError = (value: string): string => {
  const normalizedDescription = normalizeDescription(value);

  if (normalizedDescription.length === 0) {
    return 'Description is required.';
  }

  if (normalizedDescription.length < 10) {
    return 'Description must have at least 10 characters.';
  }

  if (normalizedDescription.length > DESCRIPTION_MAX_LENGTH) {
    return `Description can have at most ${DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return '';
};

const titleLength = computed<number>(() => formState.title.length);
const descriptionLength = computed<number>(() => formState.description.length);

const titleError = computed<string>(() => getTitleError(formState.title));
const descriptionError = computed<string>(() => getDescriptionError(formState.description));

const visibleTitleError = computed<string>(() =>
  submitAttempted.value || titleTouched.value ? titleError.value : '',
);

const visibleDescriptionError = computed<string>(() =>
  submitAttempted.value || descriptionTouched.value ? descriptionError.value : '',
);

const isFormValid = computed<boolean>(
  () => !titleError.value && !descriptionError.value,
);

const mergedError = computed<string | null>(() => props.error ?? localError.value);

const formTitle = computed<string>(() =>
  props.mode === 'create' ? 'Create a new course' : 'Edit course',
);

const formSubtitle = computed<string>(() =>
  props.mode === 'create'
    ? 'Fill in the basic information and choose a thumbnail.'
    : 'Update the course details and save your changes.',
);

const submitLabel = computed<string>(() =>
  props.mode === 'create' ? 'Create course' : 'Save changes',
);

const busyLabel = computed<string>(() =>
  props.mode === 'create' ? 'Creating...' : 'Saving...',
);

const clearLocalError = (): void => {
  localError.value = null;
};

const onTitleBlur = (): void => {
  titleTouched.value = true;
};

const onDescriptionBlur = (): void => {
  descriptionTouched.value = true;
};

const onCancel = (): void => {
  emit('cancel');
};

const onSubmit = (): void => {
  if (props.busy) return;

  submitAttempted.value = true;
  localError.value = null;

  if (!isFormValid.value) {
    return;
  }

  const normalizedTitle = normalizeTitle(formState.title);
  const normalizedDescription = normalizeDescription(formState.description);

  if (props.mode === 'create') {
    const payload: CreateCoursePayload = {
      title: normalizedTitle,
      description: normalizedDescription,
      thumbnailKey: formState.thumbnailKey,
    };

    emit('submit:create', payload);
    return;
  }

  const payload: UpdateCoursePayload = {
    title: normalizedTitle,
    description: normalizedDescription ? normalizedDescription : null,
    thumbnailKey: formState.thumbnailKey,
  };

  emit('submit:edit', payload);
};

watch(
  [() => props.mode, () => props.initialValues],
  () => {
    applyInitialValues(props.initialValues);
  },
  { immediate: true },
);
</script>

<template>
  <section :class="$style.card">
    <header :class="$style.header">
      <h1 :class="$style.title">{{ formTitle }}</h1>
      <p :class="$style.subtitle">{{ formSubtitle }}</p>
    </header>

    <form :class="$style.form" novalidate @submit.prevent="onSubmit">
      <div :class="$style.field">
        <div :class="$style.labelRow">
          <label :class="$style.label" for="course-title">Course title *</label>
          <span class="muted" :class="$style.counter">
            {{ titleLength }} / {{ TITLE_MAX_LENGTH }}
          </span>
        </div>

        <input
          id="course-title"
          v-model="formState.title"
          class="input"
          type="text"
          :disabled="busy"
          :maxlength="TITLE_MAX_LENGTH"
          placeholder="e.g. JavaScript Basics"
          :aria-invalid="visibleTitleError ? 'true' : 'false'"
          @input="clearLocalError"
          @blur="onTitleBlur"
        />

        <p v-if="visibleTitleError" :class="$style.fieldError" role="alert">
          {{ visibleTitleError }}
        </p>
      </div>

      <div :class="$style.field">
        <div :class="$style.labelRow">
          <label :class="$style.label" for="course-description">
            Course description *
          </label>

          <span class="muted" :class="$style.counter">
            {{ descriptionLength }} / {{ DESCRIPTION_MAX_LENGTH }}
          </span>
        </div>

        <textarea
          id="course-description"
          v-model="formState.description"
          class="input"
          :class="$style.textarea"
          :disabled="busy"
          :maxlength="DESCRIPTION_MAX_LENGTH"
          rows="5"
          placeholder="A short description of what the student will learn..."
          :aria-invalid="visibleDescriptionError ? 'true' : 'false'"
          @input="clearLocalError"
          @blur="onDescriptionBlur"
        />

        <p v-if="visibleDescriptionError" :class="$style.fieldError" role="alert">
          {{ visibleDescriptionError }}
        </p>
      </div>

      <CourseThumbnailPicker
        v-model="formState.thumbnailKey"
        :disabled="busy"
      />

      <p v-if="mergedError" :class="$style.globalError" role="alert">
        {{ mergedError }}
      </p>

      <div :class="$style.actions">
        <button class="btn btn--primary" type="submit" :disabled="busy">
          {{ busy ? busyLabel : submitLabel }}
        </button>

        <button
          class="btn btn--ghost"
          type="button"
          :disabled="busy"
          @click="onCancel"
        >
          Cancel
        </button>
      </div>
    </form>
  </section>
</template>

<style module>
.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface-2);
  backdrop-filter: blur(10px);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}

.header {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.title {
  margin: 0;
  font-size: var(--text-2xl);
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.form {
  display: grid;
  gap: var(--space-5);
}

.field {
  display: grid;
  gap: var(--space-2);
}

.labelRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.label {
  font-size: var(--text-sm);
  color: var(--color-text);
  opacity: 0.95;
  font-weight: 600;
}

.counter {
  font-size: var(--text-xs);
  opacity: 0.85;
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

.fieldError {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.globalError {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}
</style>



