<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { TeacherLessonDTO } from '@/types/teacherDashboard.types';
import type {
  LessonCreatePayload,
  LessonUpdatePayload,
} from '@/types/lesson.types';

type LessonUpsertMode = 'create' | 'edit';

type Props = {
  open: boolean;
  mode: LessonUpsertMode;
  busy: boolean;
  error: string | null;
  courseId: string;
  lesson?: TeacherLessonDTO;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (
    e: 'close',
  ): void;
  (
    e: 'submit:create',
    payload: { courseId: string; data: LessonCreatePayload; pdfFile: File | null },
  ): void;
  (
    e: 'submit:edit',
    payload: {
      courseId: string;
      lessonId: string;
      data: LessonUpdatePayload;
      pdfFile: File | null;
    },
  ): void;
}>();

const TITLE_MIN = 3;
const TITLE_MAX = 90;
const CONTENT_MIN = 3;
const CONTENT_MAX = 1_000;
const PDF_MAX_BYTES = 10 * 1024 * 1024;

const titleInputRef = ref<HTMLInputElement | null>(null);
const pdfInputRef = ref<HTMLInputElement | null>(null);

const formTitle = ref('');
const formContent = ref('');
const formOrderIndex = ref('');
const formVideoUrl = ref('');
const formDurationMinutes = ref('');
const formPdfFile = ref<File | null>(null);

const localError = ref<string | null>(null);

const isEdit = computed<boolean>(() => props.mode === 'edit');
const modalTitle = computed<string>(() => (isEdit.value ? 'Edit lesson' : 'Add lesson'));
const canClose = computed<boolean>(() => !props.busy);
const mergedError = computed<string | null>(() => props.error ?? localError.value);

const titleLength = computed<number>(() => formTitle.value.trim().length);
const contentLength = computed<number>(() => formContent.value.trim().length);
const lessonHasPdf = computed<boolean>(() => Boolean(props.lesson?.hasPdf));

const resetPdfInput = (): void => {
  formPdfFile.value = null;

  if (pdfInputRef.value) {
    pdfInputRef.value.value = '';
  }
};

const resetFromProps = (): void => {
  localError.value = null;

  if (isEdit.value && props.lesson) {
    formTitle.value = props.lesson.title ?? '';
    formContent.value = props.lesson.content ?? '';
    formOrderIndex.value = String(props.lesson.orderIndex ?? '');
    formVideoUrl.value = props.lesson.videoUrl ?? '';
    formDurationMinutes.value =
      props.lesson.durationMinutes === null || props.lesson.durationMinutes === undefined
        ? ''
        : String(props.lesson.durationMinutes);

    resetPdfInput();
    return;
  }

  formTitle.value = '';
  formContent.value = '';
  formOrderIndex.value = '';
  formVideoUrl.value = '';
  formDurationMinutes.value = '';
  resetPdfInput();
};

watch(
  () => [props.open, props.mode, props.lesson?.id] as const,
  async () => {
    if (!props.open) {
      return;
    }

    resetFromProps();
    await nextTick();
    titleInputRef.value?.focus();
  },
  { immediate: true },
);

const requireTrimmedInRange = (
  value: string,
  fieldLabel: string,
  min: number,
  max: number,
): string => {
  const trimmedValue = value.trim();

  if (trimmedValue.length < min) {
    throw new Error(`${fieldLabel} must have at least ${min} characters.`);
  }

  if (trimmedValue.length > max) {
    throw new Error(`${fieldLabel} can have at most ${max} characters.`);
  }

  return trimmedValue;
};

const parseOptionalPositiveInteger = (
  rawValue: string,
  fieldLabel: string,
  options: { min: number; max: number },
): number | undefined => {
  const normalizedValue = rawValue.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue < options.min || parsedValue > options.max) {
    throw new Error(
      `${fieldLabel} must be an integer from ${options.min} to ${options.max}.`,
    );
  }

  return parsedValue;
};

const parseOptionalVideoUrl = (): string | undefined => {
  const normalizedValue = formVideoUrl.value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
};

const assertPdfFileIfPresent = (file: File | null): void => {
  if (!file) {
    return;
  }

  const isPdfFile =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfFile) {
    throw new Error('PDF: only .pdf files are allowed.');
  }

  if (file.size > PDF_MAX_BYTES) {
    throw new Error('PDF is too large. The maximum size is 10 MB.');
  }
};

const buildCreatePayload = (): LessonCreatePayload => {
  return {
    title: requireTrimmedInRange(formTitle.value, 'Title', TITLE_MIN, TITLE_MAX),
    content: requireTrimmedInRange(formContent.value, 'Content', CONTENT_MIN, CONTENT_MAX),
    orderIndex: parseOptionalPositiveInteger(formOrderIndex.value, 'Order', {
      min: 1,
      max: 100_000,
    }),
    videoUrl: parseOptionalVideoUrl() ?? null,
    durationMinutes:
      parseOptionalPositiveInteger(formDurationMinutes.value, 'Duration', {
        min: 0,
        max: 1_000_000,
      }) ?? null,
  };
};

const buildUpdatePayload = (): LessonUpdatePayload => {
  const title = requireTrimmedInRange(formTitle.value, 'Title', TITLE_MIN, TITLE_MAX);
  const trimmedContent = formContent.value.trim();

  if (
    trimmedContent.length > 0 &&
    (trimmedContent.length < CONTENT_MIN || trimmedContent.length > CONTENT_MAX)
  ) {
    throw new Error(`Content must have at least ${CONTENT_MIN} i max. ${CONTENT_MAX} characters.`);
  }

  const payload: LessonUpdatePayload = {
    title,
    orderIndex: parseOptionalPositiveInteger(formOrderIndex.value, 'Order', {
      min: 1,
      max: 100_000,
    }),
    durationMinutes: parseOptionalPositiveInteger(formDurationMinutes.value, 'Duration', {
      min: 0,
      max: 1_000_000,
    }),
  };

  if (trimmedContent.length > 0) {
    payload.content = trimmedContent;
  }

  const videoUrl = parseOptionalVideoUrl();
  if (videoUrl !== undefined) {
    payload.videoUrl = videoUrl;
  }

  return payload;
};

const onPdfChange = (event: Event): void => {
  const eventTarget = event.target;

  if (!(eventTarget instanceof HTMLInputElement)) {
    return;
  }

  const selectedFile = eventTarget.files?.[0] ?? null;

  try {
    assertPdfFileIfPresent(selectedFile);
    formPdfFile.value = selectedFile;
    localError.value = null;
  } catch (error: unknown) {
    resetPdfInput();
    localError.value =
      error instanceof Error ? error.message : 'Failed to process the PDF file.';
  }
};

const clearPdf = (): void => {
  resetPdfInput();
};

const onClose = (): void => {
  if (!canClose.value) {
    return;
  }

  emit('close');
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (!props.open || event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  onClose();
};

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

const onSubmit = (): void => {
  if (props.busy) {
    return;
  }

  localError.value = null;

  try {
    assertPdfFileIfPresent(formPdfFile.value);

    if (!isEdit.value) {
      emit('submit:create', {
        courseId: props.courseId,
        data: buildCreatePayload(),
        pdfFile: formPdfFile.value,
      });
      return;
    }

    if (!props.lesson) {
      localError.value = 'Lesson to edit was not found.';
      return;
    }

    emit('submit:edit', {
      courseId: props.courseId,
      lessonId: props.lesson.id,
      data: buildUpdatePayload(),
      pdfFile: formPdfFile.value,
    });
  } catch (error: unknown) {
    localError.value = error instanceof Error ? error.message : 'Invalid form data.';
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      :class="$style.overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-upsert-modal-title"
    >
      <button
        type="button"
        :class="$style.overlayClickCatcher"
        :disabled="!canClose"
        aria-label="Close modal"
        @click="onClose"
      />

      <div :class="[$style.modal, 'card']">
        <div class="card__body">
          <div class="row row--between">
            <h2 id="lesson-upsert-modal-title" :class="$style.modalTitle">
              {{ modalTitle }}
            </h2>

            <button
              type="button"
              class="btn btn--ghost"
              :disabled="!canClose"
              aria-label="Close"
              @click="onClose"
            >
              ✕
            </button>
          </div>

          <p class="muted" :class="$style.subtitle">
            {{ isEdit ? 'Update the fields and save your changes.' : 'Fill in the new lesson details.' }}
          </p>

          <p v-if="isEdit" class="muted" :class="$style.hint">
            You can update the title, content, order, and lesson materials.
          </p>

          <p v-if="mergedError" :class="$style.error">
            {{ mergedError }}
          </p>

          <form :class="$style.form" @submit.prevent="onSubmit">
            <div :class="$style.field">
              <div :class="$style.labelRow">
                <label for="lesson-title" :class="$style.label">Title</label>
                <span class="muted" :class="$style.counter">
                  {{ titleLength }} / {{ TITLE_MAX }}
                </span>
              </div>

              <input
                id="lesson-title"
                ref="titleInputRef"
                v-model="formTitle"
                type="text"
                class="input"
                autocomplete="off"
                :disabled="busy"
                :maxlength="TITLE_MAX"
                :aria-invalid="titleLength > TITLE_MAX"
                placeholder="e.g. Introduction"
              />
            </div>

            <div :class="$style.field">
              <div :class="$style.labelRow">
                <label for="lesson-content" :class="$style.label">Content</label>
                <span class="muted" :class="$style.counter">
                  {{ contentLength }} / {{ CONTENT_MAX }}
                </span>
              </div>

              <textarea
                id="lesson-content"
                v-model="formContent"
                class="input"
                :class="$style.textarea"
                :disabled="busy"
                :maxlength="CONTENT_MAX"
                :aria-invalid="contentLength > CONTENT_MAX"
                placeholder="Lesson content..."
                rows="6"
              />
            </div>

            <div :class="$style.row2">
              <div :class="$style.field">
                <label for="lesson-video-url" :class="$style.label">Video URL (optional)</label>
                <input
                  id="lesson-video-url"
                  v-model="formVideoUrl"
                  type="text"
                  class="input"
                  autocomplete="off"
                  :disabled="busy"
                  placeholder="https://…"
                />
              </div>

              <div :class="$style.field">
                <label for="lesson-duration-minutes" :class="$style.label">
                  Duration (min) (optional)
                </label>
                <input
                  id="lesson-duration-minutes"
                  v-model="formDurationMinutes"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  autocomplete="off"
                  :disabled="busy"
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            <div :class="$style.row2">
              <div :class="$style.field">
                <label for="lesson-order-index" :class="$style.label">
                  Order (optional)
                </label>
                <input
                  id="lesson-order-index"
                  v-model="formOrderIndex"
                  type="text"
                  inputmode="numeric"
                  class="input"
                  autocomplete="off"
                  :disabled="busy"
                  placeholder="e.g. 3"
                />
              </div>

              <div :class="$style.field">
                <label for="lesson-pdf-file" :class="$style.label">PDF (optional)</label>

                <input
                  id="lesson-pdf-file"
                  ref="pdfInputRef"
                  type="file"
                  accept="application/pdf"
                  class="input"
                  :disabled="busy"
                  @change="onPdfChange"
                />

                <div v-if="formPdfFile" class="muted" :class="$style.fileHint">
                  <span>
                    Selected: <strong>{{ formPdfFile.name }}</strong>
                  </span>

                  <button
                    type="button"
                    class="btn btn--ghost"
                    :disabled="busy"
                    @click="clearPdf"
                  >
                    Clear selection
                  </button>
                </div>

                <div v-else-if="isEdit && lessonHasPdf" class="muted" :class="$style.fileHint">
                  The PDF is saved. You can replace it by selecting a new file.
                </div>

                <div v-else class="muted" :class="$style.fileHint">
                  No PDF.
                </div>
              </div>
            </div>

            <div :class="$style.actions">
              <button
                type="button"
                class="btn btn--ghost"
                :disabled="!canClose"
                @click="onClose"
              >
                Cancel
              </button>

              <button type="submit" class="btn btn--primary" :disabled="busy">
                {{ busy ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
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
  max-width: 760px;
}

.modalTitle {
  margin: 0;
  font-size: var(--text-lg);
}

.subtitle {
  margin-top: 10px;
}

.hint {
  margin-top: 10px;
  font-size: var(--text-xs);
}

.error {
  margin-top: 12px;
  color: var(--color-danger);
}

.form {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.labelRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.counter {
  font-size: var(--text-xs);
  opacity: 0.85;
}

.textarea {
  resize: vertical;
  min-height: 140px;
}

.row2 {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--space-4);
}

.fileHint {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.actions {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@media (max-width: 720px) {
  .row2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .actions {
    flex-direction: column-reverse;
  }

  .actions :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>




