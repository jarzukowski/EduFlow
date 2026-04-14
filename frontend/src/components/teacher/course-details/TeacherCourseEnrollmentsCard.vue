<script setup lang="ts">
import { ref } from 'vue';

import ConfirmModal from '@/components/teacher/shared/ConfirmModal.vue';
import TeacherEnrollmentsList from '@/components/teacher/shared/TeacherEnrollmentsList.vue';

import type {
  CourseEnrollmentListItemDTO,
  TeacherEnrollmentsMeta,
} from '@/types/teacherDashboard.types';

type Props = {
  courseId: string;
  enrollments: CourseEnrollmentListItemDTO[];
  enrollmentsMeta: TeacherEnrollmentsMeta;
  loading: boolean;
  error: string | null;
  unenrollBusyByEnrollmentKey: Record<string, boolean>;
  startChatError: string | null;
};

defineProps<Props>();

const emit = defineEmits<{
  (e: 'openEnrollModal'): void;
  (e: 'unenroll', studentId: string): void;
  (e: 'changePage', page: number): void;
  (e: 'retry'): void;
  (e: 'message', studentId: string): void;
}>();

const isConfirmOpen = ref(false);
const pendingStudentId = ref<string | null>(null);
const pendingStudentLabel = ref<string>('');

const openUnenrollConfirm = (payload: {
  studentId: string;
  studentLabel: string;
}): void => {
  pendingStudentId.value = payload.studentId;
  pendingStudentLabel.value = payload.studentLabel;
  isConfirmOpen.value = true;
};

const closeUnenrollConfirm = (): void => {
  isConfirmOpen.value = false;
  pendingStudentId.value = null;
  pendingStudentLabel.value = '';
};

const confirmUnenroll = (): void => {
  if (!pendingStudentId.value) {
    return;
  }

  emit('unenroll', pendingStudentId.value);
  closeUnenrollConfirm();
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <div class="row row--between" :class="$style.sectionHeader">
        <h2 :class="$style.sectionTitle">Students</h2>

        <button type="button" class="btn btn--primary" @click="emit('openEnrollModal')">
          Add student
        </button>
      </div>

      <p v-if="startChatError" :class="$style.errorInline">
        {{ startChatError }}
      </p>

      <TeacherEnrollmentsList
        :course-id="courseId"
        :enrollments="enrollments"
        :loading="loading"
        :error="error"
        :total="enrollmentsMeta.total"
        :page="enrollmentsMeta.page"
        :limit="enrollmentsMeta.limit"
        :unenroll-busy-by-enrollment-key="unenrollBusyByEnrollmentKey"
        @request-unenroll="openUnenrollConfirm"
        @change-page="emit('changePage', $event)"
        @retry="emit('retry')"
        @message="emit('message', $event)"
      />

      <ConfirmModal
        :open="isConfirmOpen"
        title="Confirm removal"
        :text="`Are you sure you want to remove student: ${pendingStudentLabel}?`"
        confirm-text="Remove"
        cancel-text="Cancel"
        @close="closeUnenrollConfirm"
        @confirm="confirmUnenroll"
      />
    </div>
  </section>
</template>

<style module>
.sectionHeader {
  gap: var(--space-4);
}

.sectionTitle {
  margin: 0;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.errorInline {
  margin-top: var(--space-3);
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .sectionHeader {
    align-items: stretch;
  }

  .sectionHeader :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>


