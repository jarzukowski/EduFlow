<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LessonUpsertModal from '@/components/teacher/editor/LessonUpsertModal.vue';

import { useTeacherLessonsStore } from '@/stores/teacherLessons.store';

import type {
  TeacherLessonDTO,
} from '@/types/teacherDashboard.types';
import type {LessonUpdatePayload} from "@/types/lesson.types.ts";

const route = useRoute();
const router = useRouter();
const teacherLessonsStore = useTeacherLessonsStore();

const lessonId = computed<string>(() => {
  return typeof route.params.id === 'string' ? route.params.id : '';
});

const courseId = computed<string>(() => {
  return typeof route.query.courseId === 'string' ? route.query.courseId : '';
});

const lesson = ref<TeacherLessonDTO | null>(null);

const busy = computed<boolean>(() => {
  return lessonId.value ? teacherLessonsStore.isLessonBusy(lessonId.value) : false;
});

const error = computed<string | null>(() => {
  return lessonId.value ? teacherLessonsStore.getLessonError(lessonId.value) : null;
});

const loadLesson = async (): Promise<void> => {
  if (!courseId.value || !lessonId.value) {
    await router.replace({ name: 'teacher-panel' });
    return;
  }

  await teacherLessonsStore.fetchLessonsForCourse(courseId.value, { force: true });

  const lessonsForCourse = teacherLessonsStore.lessonsByCourseId[courseId.value] ?? [];
  lesson.value = lessonsForCourse.find((lessonItem) => lessonItem.id === lessonId.value) ?? null;

  if (!lesson.value) {
    await router.replace({
      name: 'teacher-course-details',
      params: { id: courseId.value },
    });
  }
};

watch(
  [courseId, lessonId],
  async () => {
    await loadLesson();
  },
  { immediate: true },
);

const onClose = async (): Promise<void> => {
  await router.push({
    name: 'teacher-course-details',
    params: { id: courseId.value },
  });
};

const onEdit = async (payload: {
  courseId: string;
  lessonId: string;
  data: LessonUpdatePayload;
  pdfFile: File | null;
}): Promise<void> => {
  await teacherLessonsStore.updateLesson(
    payload.courseId,
    payload.lessonId,
    payload.data,
    payload.pdfFile,
  );

  await onClose();
};
</script>

<template>
  <LessonUpsertModal
    v-if="lesson"
    :open="true"
    mode="edit"
    :course-id="courseId"
    :lesson="lesson"
    :busy="busy"
    :error="error"
    @close="onClose"
    @submit:edit="onEdit"
  />
</template>
