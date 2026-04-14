<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useLessonPdfStore } from '@/stores/lessonPdf.store';

const route = useRoute();
const router = useRouter();
const lessonPdfStore = useLessonPdfStore();

const lessonId = computed<string>(() => {
  const rawLessonId = route.params.id;

  return typeof rawLessonId === 'string' ? rawLessonId.trim() : '';
});

const navigateBack = async (): Promise<void> => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  await router.push({ name: 'courses' });
};

const handleErrorRouting = async (): Promise<void> => {
  const currentErrorKind = lessonPdfStore.errorKind;

  if (currentErrorKind === 'unauthorized') {
    await router.push({
      name: 'auth',
      query: {
        mode: 'signin',
        redirect: route.fullPath,
      },
    });

    return;
  }

  if (currentErrorKind === 'forbidden') {
    await router.replace({
      name: 'forbidden',
      query: {
        from: route.fullPath,
      },
    });

    return;
  }

  if (currentErrorKind === 'not_found') {
    await router.replace({ name: 'not-found' });
  }
};

const loadPdf = async (): Promise<void> => {
  if (!lessonId.value) {
    await router.replace({ name: 'not-found' });
    return;
  }

  try {
    await lessonPdfStore.loadPdfForLesson(lessonId.value);
  } catch {
    await handleErrorRouting();
  }
};

watch(
  lessonId,
  async () => {
    await loadPdf();
  },
  { immediate: true },
);

onUnmounted(() => {
  lessonPdfStore.resetState();
});
</script>

<template>
  <main class="container" :class="$style.page">
    <section class="card" :class="$style.card" aria-labelledby="pdf-view-title">
      <div class="card__body" :class="$style.header">
        <button type="button" class="btn btn--ghost" @click="navigateBack">
          ← Back
        </button>

        <h1 id="pdf-view-title" class="muted" :class="$style.title">
          PDF preview
        </h1>
      </div>

      <div class="card__body" :class="$style.body">
        <div
          v-if="lessonPdfStore.loading"
          :class="$style.skeleton"
          aria-hidden="true"
        >
          <div :class="$style.skeletonTop"></div>
          <div :class="$style.skeletonFrame"></div>
        </div>

        <p
          v-else-if="lessonPdfStore.errorMessage"
          class="muted"
          :class="$style.error"
          role="alert"
        >
          {{ lessonPdfStore.errorMessage }}
        </p>

        <div v-else-if="lessonPdfStore.objectUrl" :class="$style.viewer">
          <iframe
            :src="lessonPdfStore.objectUrl"
            :class="$style.iframe"
            title="PDF file preview"
          />
        </div>

        <p v-else class="muted" :class="$style.emptyState">
          No PDF.
        </p>
      </div>
    </section>
  </main>
</template>

<style module>
.page {
  padding-block: var(--space-6);
}

.card {
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.title {
  margin: 0;
  font-weight: 800;
}

.body {
  padding-top: 0;
}

.viewer {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.iframe {
  display: block;
  width: 100%;
  height: min(78vh, 900px);
  border: 0;
}

.error {
  color: var(--color-danger);
}

.emptyState {
  margin: 0;
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeletonTop,
.skeletonFrame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
}

.skeletonTop {
  height: 42px;
  border-radius: var(--radius-md);
}

.skeletonFrame {
  height: min(78vh, 900px);
  border-radius: var(--radius-lg);
}

.skeletonTop::after,
.skeletonFrame::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.08),
    transparent
  );
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 640px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .iframe,
  .skeletonFrame {
    height: min(72vh, 760px);
  }
}
</style>



