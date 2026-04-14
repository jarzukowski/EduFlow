import axios from 'axios';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getApiErrorMessage } from '@/api/apiError';
import { getLessonPdfBlob } from '@/api/lessons/lessons.api';

type PdfErrorKind = 'unauthorized' | 'forbidden' | 'not_found' | 'other';

const getHttpStatus = (error: unknown): number | null => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return error.response?.status ?? null;
};

const mapPdfErrorKind = (status: number | null): PdfErrorKind => {
  if (status === 401) {
    return 'unauthorized';
  }

  if (status === 403) {
    return 'forbidden';
  }

  if (status === 404) {
    return 'not_found';
  }

  return 'other';
};

const isAbortError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  return error.code === 'ERR_CANCELED';
};

export const useLessonPdfStore = defineStore('lessonPdf', () => {
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);
  const errorKind = ref<PdfErrorKind | null>(null);
  const objectUrl = ref<string | null>(null);
  const activeAbortController = ref<AbortController | null>(null);

  const hasPdfLoaded = computed<boolean>(() => Boolean(objectUrl.value));

  const cleanupObjectUrl = (): void => {
    if (!objectUrl.value) {
      return;
    }

    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  };

  const abortActiveRequest = (): void => {
    if (!activeAbortController.value) {
      return;
    }

    activeAbortController.value.abort();
    activeAbortController.value = null;
  };

  const clearErrorState = (): void => {
    errorMessage.value = null;
    errorKind.value = null;
  };

  const resetState = (): void => {
    loading.value = false;
    clearErrorState();
    abortActiveRequest();
    cleanupObjectUrl();
  };

  const loadPdfForLesson = async (lessonId: string): Promise<void> => {
    abortActiveRequest();
    cleanupObjectUrl();
    clearErrorState();

    loading.value = true;

    const abortController = new AbortController();
    activeAbortController.value = abortController;

    try {
      const blob = await getLessonPdfBlob(lessonId, abortController.signal);

      if (activeAbortController.value !== abortController) {
        return;
      }

      const normalizedMimeType = blob.type.toLowerCase();
      const safeBlob = normalizedMimeType.includes('pdf')
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

      objectUrl.value = URL.createObjectURL(safeBlob);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return;
      }

      const status = getHttpStatus(error);

      errorKind.value = mapPdfErrorKind(status);
      errorMessage.value = getApiErrorMessage(
        error,
        'Failed to load PDF.',
      );

      throw error;
    } finally {
      if (activeAbortController.value === abortController) {
        activeAbortController.value = null;
      }

      loading.value = false;
    }
  };

  return {
    loading,
    errorMessage,
    errorKind,
    objectUrl,
    hasPdfLoaded,
    loadPdfForLesson,
    resetState,
  };
});

