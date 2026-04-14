<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import QuickActionsCardSmart from '@/components/teacher/dashboard/QuickActionsCardSmart.vue';
import TeacherOverviewCard from '@/components/teacher/dashboard/TeacherOverviewCard.vue';
import TeacherCoursesPanel from '@/components/teacher/dashboard/TeacherCoursesPanel.vue';
import EnrollStudentModal from '@/components/teacher/shared/EnrollStudentModal.vue';
import ConfirmModal from '@/components/teacher/shared/ConfirmModal.vue';
import LessonUpsertModal from '@/components/teacher/editor/LessonUpsertModal.vue';

import { useTeacherDashboardStore } from '@/stores/teacherDashboard.store';
import { useTeacherLessonsStore } from '@/stores/teacherLessons.store';
import { useMessagesStore } from '@/stores/messages.store';

import { getApiErrorMessage } from '@/api/apiError';

import type { TeacherLessonDTO } from '@/types/teacherDashboard.types';
import type {
  LessonCreatePayload,
  LessonUpdatePayload,
} from '@/types/lesson.types';

type LessonModalMode = 'create' | 'edit';

const teacherDashboardStore = useTeacherDashboardStore();
const teacherLessonsStore = useTeacherLessonsStore();
const messagesStore = useMessagesStore();
const router = useRouter();

const activeCourseId = computed<string | null>(() => teacherDashboardStore.expandedCourseId);

const isLessonModalOpen = ref(false);
const lessonModalMode = ref<LessonModalMode>('create');
const lessonModalCourseId = ref<string | null>(null);
const lessonToEdit = ref<TeacherLessonDTO | null>(null);
const lessonModalError = ref<string | null>(null);
const lessonModalBusy = ref(false);

const isDeleteLessonConfirmOpen = ref(false);
const deleteLessonCourseId = ref<string | null>(null);
const lessonToDelete = ref<TeacherLessonDTO | null>(null);

const startChatError = ref<string | null>(null);
const startChatBusyByStudentKey = ref<Record<string, boolean>>({});

const getStartChatBusyKey = (courseId: string, studentId: string): string => {
  return `${courseId}:${studentId}`;
};

const resetLessonModalState = (): void => {
  lessonModalCourseId.value = null;
  lessonToEdit.value = null;
  lessonModalError.value = null;
  lessonModalBusy.value = false;
};

const openCreateLessonModal = (courseId: string): void => {
  lessonModalMode.value = 'create';
  lessonModalCourseId.value = courseId;
  lessonToEdit.value = null;
  lessonModalError.value = null;
  lessonModalBusy.value = false;
  isLessonModalOpen.value = true;
};

const openEditLessonModal = (courseId: string, lesson: TeacherLessonDTO): void => {
  lessonModalMode.value = 'edit';
  lessonModalCourseId.value = courseId;
  lessonToEdit.value = lesson;
  lessonModalError.value = null;
  lessonModalBusy.value = false;
  isLessonModalOpen.value = true;
};

const closeLessonModal = (options?: { force?: boolean }): void => {
  if (lessonModalBusy.value && !options?.force) {
    return;
  }

  isLessonModalOpen.value = false;
  resetLessonModalState();
};

const onSubmitLessonCreate = async (payload: {
  courseId: string;
  data: LessonCreatePayload;
  pdfFile: File | null;
}): Promise<void> => {
  if (lessonModalBusy.value) {
    return;
  }

  lessonModalBusy.value = true;
  lessonModalError.value = null;

  try {
    await teacherLessonsStore.createLessonForCourse(
      payload.courseId,
      payload.data,
      payload.pdfFile,
    );

    closeLessonModal({ force: true });
  } catch (error: unknown) {
    lessonModalError.value = getApiErrorMessage(error, 'Failed to add lesson.');
  } finally {
    lessonModalBusy.value = false;
  }
};

const onSubmitLessonEdit = async (payload: {
  courseId: string;
  lessonId: string;
  data: LessonUpdatePayload;
  pdfFile: File | null;
}): Promise<void> => {
  if (lessonModalBusy.value) {
    return;
  }

  lessonModalBusy.value = true;
  lessonModalError.value = null;

  try {
    await teacherLessonsStore.updateLesson(
      payload.courseId,
      payload.lessonId,
      payload.data,
      payload.pdfFile,
    );

    closeLessonModal({ force: true });
  } catch (error: unknown) {
    lessonModalError.value = getApiErrorMessage(error, 'Failed to save changes.');
  } finally {
    lessonModalBusy.value = false;
  }
};

const requestDeleteLesson = (courseId: string, lesson: TeacherLessonDTO): void => {
  deleteLessonCourseId.value = courseId;
  lessonToDelete.value = lesson;
  isDeleteLessonConfirmOpen.value = true;
};

const closeDeleteLessonConfirm = (): void => {
  isDeleteLessonConfirmOpen.value = false;
  deleteLessonCourseId.value = null;
  lessonToDelete.value = null;
};

const confirmDeleteLesson = async (): Promise<void> => {
  const courseId = deleteLessonCourseId.value;
  const lessonId = lessonToDelete.value?.id;

  if (!courseId || !lessonId) {
    return;
  }

  await teacherLessonsStore.deleteLesson(courseId, lessonId);
  closeDeleteLessonConfirm();
};

const deleteLessonBusy = computed<boolean>(() => {
  return lessonToDelete.value
    ? teacherLessonsStore.isLessonBusy(lessonToDelete.value.id)
    : false;
});

const onOpenLessonPdf = async (payload: { lessonId: string }): Promise<void> => {
  await router.push({
    name: 'lesson-pdf',
    params: { id: payload.lessonId },
  });
};

const onEnrollStudent = async (studentId: string): Promise<void> => {
  const courseId = teacherDashboardStore.enrollModalCourseId;

  if (!courseId) {
    return;
  }

  await teacherDashboardStore.enrollStudentToCourse(courseId, studentId);
};

const onEnrollForCourse = (courseId: string): void => {
  teacherDashboardStore.openEnrollModal(courseId);
};

const onUnenroll = async (payload: {
  courseId: string;
  studentId: string;
}): Promise<void> => {
  await teacherDashboardStore.unenrollStudentFromCourse(payload.courseId, payload.studentId);
};

const onChangeEnrollmentsPage = async (payload: {
  courseId: string;
  page: number;
}): Promise<void> => {
  await teacherDashboardStore.changeEnrollmentsPage(payload.courseId, payload.page);
};

const onRetryEnrollments = async (courseId: string): Promise<void> => {
  await teacherDashboardStore.retryEnrollments(courseId);
};

const onRetryLessons = async (courseId: string): Promise<void> => {
  await teacherLessonsStore.retryLessonsForCourse(courseId);
};

const onMoveLesson = async (payload: {
  courseId: string;
  lessonId: string;
  direction: 'up' | 'down';
}): Promise<void> => {
  await teacherLessonsStore.moveLesson(payload.courseId, payload.lessonId, payload.direction);
};

const onToggleCourse = async (courseId: string): Promise<void> => {
  teacherDashboardStore.toggleCourse(courseId);

  if (teacherDashboardStore.expandedCourseId !== courseId) {
    return;
  }

  await Promise.all([
    teacherLessonsStore.fetchLessonsForCourse(courseId),
    teacherDashboardStore.fetchEnrollmentsForCourse(courseId, {
      page: 1,
      limit: 10,
    }),
  ]);
};

const onMessageStudent = async (payload: {
  courseId: string;
  studentId: string;
}): Promise<void> => {
  const { courseId, studentId } = payload;

  if (!courseId || !studentId) {
    return;
  }

  const busyKey = getStartChatBusyKey(courseId, studentId);

  if (startChatBusyByStudentKey.value[busyKey]) {
    return;
  }

  startChatError.value = null;
  startChatBusyByStudentKey.value[busyKey] = true;

  try {
    const conversationId = await messagesStore.startConversation({
      courseId,
      studentId,
    });

    await router.push({
      name: 'messages',
      query: { c: conversationId },
    });
  } catch (error: unknown) {
    startChatError.value = getApiErrorMessage(error, 'Failed to start conversation.');
  } finally {
    startChatBusyByStudentKey.value[busyKey] = false;
  }
};

onMounted(() => {
  void teacherDashboardStore.fetchTeacherCourses();
});
</script>

<template>
  <div class="container" :class="$style.layout">
    <div :class="$style.left">
      <p v-if="startChatError" :class="$style.errorInline">
        {{ startChatError }}
      </p>

      <TeacherCoursesPanel
        :courses="teacherDashboardStore.courses"
        :loading="teacherDashboardStore.coursesLoading"
        :error="teacherDashboardStore.coursesError"
        :expanded-course-id="teacherDashboardStore.expandedCourseId"
        :lessons-by-course-id="teacherLessonsStore.lessonsByCourseId"
        :lessons-loading-by-course-id="teacherLessonsStore.lessonsLoadingByCourseId"
        :lessons-error-by-course-id="teacherLessonsStore.lessonsErrorByCourseId"
        :lesson-busy-by-lesson-id="teacherLessonsStore.lessonBusyByLessonId"
        :lesson-error-by-lesson-id="teacherLessonsStore.lessonErrorByLessonId"
        :enrollments-by-course-id="teacherDashboardStore.enrollmentsByCourseId"
        :enrollments-loading-by-course-id="teacherDashboardStore.enrollmentsLoadingByCourseId"
        :enrollments-error-by-course-id="teacherDashboardStore.enrollmentsErrorByCourseId"
        :enrollments-meta-by-course-id="teacherDashboardStore.enrollmentsMetaByCourseId"
        :unenroll-busy-by-enrollment-key="teacherDashboardStore.unenrollBusyByEnrollmentKey"
        @toggle-course="onToggleCourse"
        @enroll-student="onEnrollForCourse"
        @unenroll="onUnenroll"
        @change-enrollments-page="onChangeEnrollmentsPage"
        @retry-enrollments="onRetryEnrollments"
        @retry-lessons="onRetryLessons"
        @create-lesson="openCreateLessonModal($event)"
        @edit-lesson="openEditLessonModal($event.courseId, $event.lesson)"
        @delete-lesson="requestDeleteLesson($event.courseId, $event.lesson)"
        @move-lesson="onMoveLesson"
        @open-lesson-pdf="onOpenLessonPdf({ lessonId: $event.lessonId })"
        @message="onMessageStudent"
      />
    </div>

    <aside class="stack" :class="$style.right">
      <QuickActionsCardSmart :active-course-id="activeCourseId" />
      <TeacherOverviewCard :overview="teacherDashboardStore.overview" />
    </aside>

    <EnrollStudentModal
      v-if="teacherDashboardStore.enrollModalCourseId"
      :open="teacherDashboardStore.isEnrollModalOpen"
      :course-id="teacherDashboardStore.enrollModalCourseId"
      :suggest="teacherDashboardStore.suggestStudents"
      :busy="teacherDashboardStore.enrollBusy"
      :error="teacherDashboardStore.enrollError"
      @close="teacherDashboardStore.closeEnrollModal"
      @enroll="onEnrollStudent"
    />

    <LessonUpsertModal
      :open="isLessonModalOpen"
      :mode="lessonModalMode"
      :busy="lessonModalBusy"
      :error="lessonModalError"
      :course-id="lessonModalCourseId ?? ''"
      :lesson="lessonToEdit ?? undefined"
      @close="closeLessonModal"
      @submit:create="onSubmitLessonCreate"
      @submit:edit="onSubmitLessonEdit"
    />

    <ConfirmModal
      :open="isDeleteLessonConfirmOpen"
      title="Delete lesson?"
      :text="
        lessonToDelete
          ? `This action is irreversible. Lesson: ${lessonToDelete.title}`
          : 'This action is irreversible.'
      "
      confirm-text="Delete"
      cancel-text="Cancel"
      :busy="deleteLessonBusy"
      @close="closeDeleteLessonConfirm"
      @confirm="confirmDeleteLesson"
    />
  </div>
</template>

<style module>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: var(--space-6);
  align-items: start;
}

.errorInline {
  margin-bottom: var(--space-3);
  color: var(--color-danger);
}

.left {
  min-width: 0;
}

.right {
  position: sticky;
  top: calc(var(--space-4) + 72px);
  min-width: 0;
}

@media (max-width: 1180px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .right {
    position: static;
    order: -1;
  }
}

@media (max-width: 640px) {
  .layout {
    gap: var(--space-4);
  }
}
</style>




