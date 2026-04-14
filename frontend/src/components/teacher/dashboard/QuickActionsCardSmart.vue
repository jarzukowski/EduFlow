<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import QuickActionsCard from './QuickActionsCard.vue';
import QuickActionsModal from './QuickActionsModal.vue';
import ConfirmModal from '../shared/ConfirmModal.vue';

import { useTeacherDashboardStore } from '@/stores/teacherDashboard.store';

const props = defineProps<{
  activeCourseId: string | null;
}>();

const teacherDashboardStore = useTeacherDashboardStore();
const router = useRouter();

const isCoursePickerOpen = ref(false);
const isDeleteConfirmOpen = ref(false);
const pendingDeleteCourseId = ref<string | null>(null);
const isDeleteBusy = ref(false);
const deleteErrorMessage = ref<string | null>(null);

const teacherCoursesHint = computed<string>(() => {
  if (teacherDashboardStore.coursesLoading) {
    return 'Loading courses...';
  }

  if (teacherDashboardStore.courses.length === 0) {
    return 'You do not have any courses yet.';
  }

  return 'Pick a course in the modal and take action without scrolling the list.';
});

const openCoursePicker = (): void => {
  isCoursePickerOpen.value = true;
};

const closeCoursePicker = (): void => {
  isCoursePickerOpen.value = false;
};

const closeDeleteConfirm = (): void => {
  isDeleteConfirmOpen.value = false;
  pendingDeleteCourseId.value = null;
  deleteErrorMessage.value = null;
};

const goToCreateCourse = async (): Promise<void> => {
  await router.push({ name: 'teacher-course-create' });
};

const goToCourseDetails = async (courseId: string): Promise<void> => {
  await router.push({
    name: 'teacher-course-details',
    params: { id: courseId },
  });

  closeCoursePicker();
};

const goToEditCourse = async (courseId: string): Promise<void> => {
  await router.push({
    name: 'teacher-course-edit',
    params: { id: courseId },
  });

  closeCoursePicker();
};

const goToCreateLesson = async (courseId: string): Promise<void> => {
  await router.push({
    name: 'lesson-create',
    params: { courseId },
    query: {
      redirect: 'teacher',
      courseId,
    },
  });

  closeCoursePicker();
};

const openDeleteConfirm = (courseId: string): void => {
  isCoursePickerOpen.value = false;
  pendingDeleteCourseId.value = courseId;
  deleteErrorMessage.value = null;
  isDeleteConfirmOpen.value = true;
};

const confirmDeleteCourse = async (): Promise<void> => {
  const courseId = pendingDeleteCourseId.value;

  if (!courseId || isDeleteBusy.value) {
    return;
  }

  isDeleteBusy.value = true;
  deleteErrorMessage.value = null;

  try {
    await teacherDashboardStore.deleteCourse(courseId);
    closeDeleteConfirm();
  } catch {
    deleteErrorMessage.value =
      teacherDashboardStore.coursesError ?? 'Failed to delete course.';
  } finally {
    isDeleteBusy.value = false;
  }
};
</script>

<template>
  <QuickActionsCard
    :hint="teacherCoursesHint"
    @open-course-picker="openCoursePicker"
    @create-course="goToCreateCourse"
  />

  <QuickActionsModal
    :open="isCoursePickerOpen"
    :courses="teacherDashboardStore.courses"
    :initial-course-id="props.activeCourseId"
    :busy="teacherDashboardStore.coursesLoading"
    @close="closeCoursePicker"
    @open-course="goToCourseDetails"
    @edit-course="goToEditCourse"
    @create-lesson="goToCreateLesson"
    @delete-course="openDeleteConfirm"
  />

  <ConfirmModal
    :open="isDeleteConfirmOpen"
    title="Delete course?"
    :text="
      deleteErrorMessage ??
      'This action is irreversible. The course will be deleted together with its lessons and student enrollments.'
    "
    confirm-text="Delete"
    cancel-text="Cancel"
    :busy="isDeleteBusy"
    @close="closeDeleteConfirm"
    @confirm="confirmDeleteCourse"
  />
</template>



