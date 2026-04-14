<script setup lang="ts">
import { computed } from 'vue';

import type { CourseEnrollmentListItemDTO } from '@/types/teacherDashboard.types';

type Props = {
  courseId: string;
  enrollments: CourseEnrollmentListItemDTO[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  unenrollBusyByEnrollmentKey: Record<string, boolean>;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'requestUnenroll', payload: { studentId: string; studentLabel: string }): void;
  (e: 'changePage', nextPage: number): void;
  (e: 'retry'): void;
  (e: 'message', studentId: string): void;
}>();

const getEnrollmentBusyKey = (courseId: string, studentId: string): string => {
  return `${courseId}:${studentId}`;
};

const isUnenrollBusy = (studentId: string): boolean => {
  const enrollmentBusyKey = getEnrollmentBusyKey(props.courseId, studentId);
  return Boolean(props.unenrollBusyByEnrollmentKey[enrollmentBusyKey]);
};

const totalPages = computed<number>(() => {
  return Math.max(1, Math.ceil(props.total / Math.max(1, props.limit)));
});

const safePage = computed<number>(() => {
  return Math.min(Math.max(1, props.page), totalPages.value);
});

const startIndex = computed<number>(() => {
  if (props.total === 0) {
    return 0;
  }

  return (safePage.value - 1) * props.limit + 1;
});

const endIndex = computed<number>(() => {
  if (props.total === 0) {
    return 0;
  }

  return Math.min(safePage.value * props.limit, props.total);
});

const canGoPrev = computed<boolean>(() => {
  return safePage.value > 1 && !props.loading;
});

const canGoNext = computed<boolean>(() => {
  return safePage.value < totalPages.value && !props.loading;
});

const goPrev = (): void => {
  if (!canGoPrev.value) {
    return;
  }

  emit('changePage', safePage.value - 1);
};

const goNext = (): void => {
  if (!canGoNext.value) {
    return;
  }

  emit('changePage', safePage.value + 1);
};

const onMessageClick = (studentId: string): void => {
  if (!studentId || props.loading) {
    return;
  }

  emit('message', studentId);
};

const onRetryClick = (): void => {
  if (props.loading) {
    return;
  }

  emit('retry');
};

const onRequestUnenroll = (studentId: string, studentLabel: string): void => {
  if (!studentId || isUnenrollBusy(studentId)) {
    return;
  }

  emit('requestUnenroll', { studentId, studentLabel });
};
</script>

<template>
  <div :class="$style.wrap">
    <div v-if="error" :class="$style.errorBox">
      <p class="muted" :class="$style.errorText">
        {{ error }}
      </p>

      <button
        type="button"
        class="btn btn--ghost"
        :disabled="loading"
        @click="onRetryClick"
      >
        Please try again
      </button>
    </div>

    <div v-if="loading" :class="$style.skeleton">
      <div
        v-for="skeletonIndex in 4"
        :key="skeletonIndex"
        :class="$style.skeletonRow"
        aria-hidden="true"
      />
    </div>

    <div v-else-if="enrollments.length > 0" :class="$style.table" aria-live="polite">
      <div :class="[$style.row, $style.head]">
        <div>Student</div>
        <div>Enrollment</div>
        <div></div>
      </div>

      <div
        v-for="enrollment in enrollments"
        :key="enrollment.studentId"
        :class="$style.row"
      >
        <div :class="$style.student">
          <div :class="$style.email">{{ enrollment.emailMasked }}</div>

          <div v-if="enrollment.displayName" class="muted" :class="$style.small">
            {{ enrollment.displayName }}
          </div>
        </div>

        <div class="muted" :class="[$style.small, $style.enrolledAt]">
          {{ enrollment.enrolledAt }}
        </div>

        <div :class="$style.actions">
          <button
            type="button"
            class="btn btn--ghost"
            :disabled="loading || !enrollment.studentId"
            aria-label="Write message"
            title="Write message"
            @click.stop="onMessageClick(enrollment.studentId)"
          >
            ✉️
          </button>

          <button
            type="button"
            class="btn btn--danger"
            :disabled="isUnenrollBusy(enrollment.studentId)"
            @click="
              onRequestUnenroll(
                enrollment.studentId,
                enrollment.displayName ?? enrollment.emailMasked,
              )
            "
          >
            {{ isUnenrollBusy(enrollment.studentId) ? 'Removing...' : 'Remove' }}
          </button>
        </div>
      </div>

      <div :class="$style.footer">
        <p class="muted" :class="$style.meta">
          Total: {{ total }} • {{ startIndex }}–{{ endIndex }}
        </p>

        <div :class="$style.pager">
          <button
            type="button"
            class="btn btn--ghost"
            :disabled="!canGoPrev"
            @click="goPrev"
          >
            ← Previous
          </button>

          <div class="muted" :class="$style.pageInfo">
            Page {{ safePage }} / {{ totalPages }}
          </div>

          <button
            type="button"
            class="btn btn--ghost"
            :disabled="!canGoNext"
            @click="goNext"
          >
            Next →
          </button>
        </div>
      </div>
    </div>

    <p v-else class="muted">
      No enrolled students in this course.
    </p>
  </div>
</template>

<style module>
.wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: 12px;
}

.errorBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.errorText {
  margin: 0;
  color: var(--color-danger);
}

.table {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(120px, 0.9fr) auto;
  gap: var(--space-3);
  align-items: center;
  padding: 12px 14px;
  border-top: 1px solid var(--color-border);
}

.row:first-child {
  border-top: 0;
}

.head {
  background: rgba(255, 255, 255, 0.04);
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
}

.student {
  min-width: 0;
}

.email {
  font-weight: 800;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.small {
  font-size: var(--text-xs);
}

.enrolledAt {
  min-width: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 10px 14px 14px;
  border-top: 1px solid var(--color-border);
}

.meta {
  margin: 0;
}

.pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.pageInfo {
  font-size: var(--text-xs);
  white-space: nowrap;
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeletonRow {
  position: relative;
  height: 52px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.05);
}

.skeletonRow::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  animation: shimmer 1.1s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 980px) {
  .head {
    display: none;
  }

  .row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'student actions'
      'enrolled actions';
    align-items: start;
    gap: 10px 16px;
  }

  .student {
    grid-area: student;
  }

  .enrolledAt {
    grid-area: enrolled;
  }

  .actions {
    grid-area: actions;
    align-self: center;
    justify-content: flex-start;
  }

  .footer {
    align-items: stretch;
  }

  .pager {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .errorBox {
    flex-direction: column;
    align-items: stretch;
  }

  .row {
    grid-template-columns: 1fr;
    grid-template-areas:
      'student'
      'enrolled'
      'actions';
    gap: 10px;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .actions :global(.btn) {
    width: 100%;
    justify-content: center;
  }

  .pager {
    display: grid;
    grid-template-columns: 1fr;
  }

  .pager :global(.btn) {
    width: 100%;
    justify-content: center;
  }

  .pageInfo {
    text-align: center;
    white-space: normal;
  }
}
</style>



