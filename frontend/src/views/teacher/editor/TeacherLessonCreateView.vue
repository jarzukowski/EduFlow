<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LessonUpsertModal from '@/components/teacher/editor/LessonUpsertModal.vue';

import { getApiErrorMessage } from '@/api/apiError';
import { useTeacherLessonsStore } from '@/stores/teacherLessons.store';

import type { LessonCreatePayload } from '@/types/lesson.types';

const route = useRoute();
const router = useRouter();
const teacherLessonsStore = useTeacherLessonsStore();

const courseIdFromParams = computed<string>(() => {
  return typeof route.params.courseId === 'string' ? route.params.courseId : '';
});

const redirectTarget = computed<string>(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : '';
});

const courseIdFromQuery = computed<string>(() => {
  return typeof route.query.courseId === 'string' ? route.query.courseId : '';
});

const courseId = computed<string>(() => {
  return courseIdFromQuery.value || courseIdFromParams.value;
});

const isTeacherFlow = computed<boolean>(() => redirectTarget.value === 'teacher');

const isModalOpen = ref(false);
const modalBusy = ref(false);
const modalError = ref<string | null>(null);

const redirectBackToTeacherCourse = async (): Promise<void> => {
  await router.replace({
    name: 'teacher-course-details',
    params: { id: courseId.value },
  });
};

onMounted(async () => {
  if (!courseId.value) {
    await router.replace({ name: 'teacher-panel' });
    return;
  }

  if (!isTeacherFlow.value) {
    await router.replace({
      name: 'course-details',
      params: { id: courseId.value },
    });
    return;
  }

  isModalOpen.value = true;
});

const onClose = async (): Promise<void> => {
  if (modalBusy.value) {
    return;
  }

  await redirectBackToTeacherCourse();
};

const onSubmitCreate = async (payload: {
  courseId: string;
  data: LessonCreatePayload;
  pdfFile: File | null;
}): Promise<void> => {
  if (modalBusy.value) {
    return;
  }

  modalBusy.value = true;
  modalError.value = null;

  try {
    await teacherLessonsStore.createLessonForCourse(
      payload.courseId,
      payload.data,
      payload.pdfFile,
    );

    await redirectBackToTeacherCourse();
  } catch (error: unknown) {
    modalError.value = getApiErrorMessage(error, 'Failed to add lesson.');
  } finally {
    modalBusy.value = false;
  }
};
</script>

<template>
  <LessonUpsertModal
    :open="isModalOpen"
    mode="create"
    :busy="modalBusy"
    :error="modalError"
    :course-id="courseId"
    @close="onClose"
    @submit:create="onSubmitCreate"
  />
</template>

