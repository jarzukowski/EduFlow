<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ConfirmModal from '@/components/teacher/shared/ConfirmModal.vue';
import EnrollStudentModal from '@/components/teacher/shared/EnrollStudentModal.vue';
import TeacherCourseEnrollmentsCard from '@/components/teacher/course-details/TeacherCourseEnrollmentsCard.vue';
import TeacherCourseHeaderCard from '@/components/teacher/course-details/TeacherCourseHeaderCard.vue';
import TeacherCourseLessonsCard from '@/components/teacher/course-details/TeacherCourseLessonsCard.vue';

import { getApiErrorMessage } from '@/api/apiError';

import { useTeacherDashboardStore } from '@/stores/teacherDashboard.store';
import { useTeacherLessonsStore } from '@/stores/teacherLessons.store';
import { useMessagesStore } from '@/stores/messages.store';

import type {
  TeacherCourseDetailsHeader,
  CourseEnrollmentListItemDTO,
  TeacherEnrollmentsMeta,
  TeacherLessonDTO,
} from '@/types/teacherDashboard.types';

const route = useRoute();
const router = useRouter();

const teacherDashboardStore = useTeacherDashboardStore();
const teacherLessonsStore = useTeacherLessonsStore();
const messagesStore = useMessagesStore();

const course = ref<TeacherCourseDetailsHeader | null>(null);

const isDeleteCourseModalOpen = ref(false);
const deleteCourseBusy = ref(false);
const deleteCourseError = ref<string | null>(null);

const isDeleteLessonModalOpen = ref(false);
const deleteLessonBusy = ref(false);
const deleteLessonError = ref<string | null>(null);
const deleteLessonId = ref<string | null>(null);

const startChatBusyByStudentId = ref<Record<string, boolean>>({});
const startChatError = ref<string | null>(null);

const courseId = computed<string>(() => {
  const rawCourseId = route.params.id;
  return typeof rawCourseId === 'string' ? rawCourseId : '';
});

const lessons = computed<TeacherLessonDTO[]>(() => {
  return teacherLessonsStore.lessonsByCourseId[courseId.value] ?? [];
});

const lessonsLoading = computed<boolean>(() => {
  return Boolean(teacherLessonsStore.lessonsLoadingByCourseId[courseId.value]);
});

const lessonsError = computed<string | null>(() => {
  return teacherLessonsStore.lessonsErrorByCourseId[courseId.value] ?? null;
});

const enrollments = computed<CourseEnrollmentListItemDTO[]>(() => {
  return teacherDashboardStore.enrollmentsByCourseId[courseId.value] ?? [];
});

const enrollmentsMeta = computed<TeacherEnrollmentsMeta>(() => {
  return teacherDashboardStore.enrollmentsMetaByCourseId[courseId.value] ?? {
    total: 0,
    page: 1,
    limit: 10,
  };
});

const enrollmentsLoading = computed<boolean>(() => {
  return Boolean(teacherDashboardStore.enrollmentsLoadingByCourseId[courseId.value]);
});

const enrollmentsError = computed<string | null>(() => {
  return teacherDashboardStore.enrollmentsErrorByCourseId[courseId.value] ?? null;
});

const lessonsCount = computed<number>(() => {
  return lessons.value.length;
});

const studentsCount = computed<number>(() => {
  return enrollmentsMeta.value.total;
});

const totalDurationMinutes = computed<number>(() => {
  return lessons.value.reduce((sum, lesson) => {
    return sum + (typeof lesson.durationMinutes === 'number' ? lesson.durationMinutes : 0);
  }, 0);
});

const formatMinutes = (totalMinutes: number): string => {
  const normalizedMinutes = Number.isFinite(totalMinutes)
    ? Math.max(0, Math.floor(totalMinutes))
    : 0;

  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

const totalDurationLabel = computed<string>(() => {
  return formatMinutes(totalDurationMinutes.value);
});

const getStartChatBusyKey = (studentId: string): string => {
  return `${courseId.value}:${studentId}`;
};

const bootstrapTeacherCourseDetails = async (nextCourseId: string): Promise<void> => {
  const matchingTeacherCourse = teacherDashboardStore.courses.find(
    (teacherCourse) => teacherCourse.id === nextCourseId,
  );

  if (matchingTeacherCourse) {
    course.value = {
      id: matchingTeacherCourse.id,
      title: matchingTeacherCourse.title,
      description: matchingTeacherCourse.description,
    } as TeacherCourseDetailsHeader;
  }

  if (!matchingTeacherCourse) {
    course.value = null;
  }

  await Promise.all([
    teacherLessonsStore.fetchLessonsForCourse(nextCourseId, { force: true }),
    teacherDashboardStore.fetchEnrollmentsForCourse(nextCourseId, {
      page: 1,
      limit: 10,
      force: true,
    }),
  ]);

  if (!course.value) {
    const refreshedTeacherCourse = teacherDashboardStore.courses.find(
      (teacherCourse) => teacherCourse.id === nextCourseId,
    );

    if (refreshedTeacherCourse) {
      course.value = {
        id: refreshedTeacherCourse.id,
        title: refreshedTeacherCourse.title,
        description: refreshedTeacherCourse.description,
      } as TeacherCourseDetailsHeader;
    }
  }
};

const goBack = async (): Promise<void> => {
  await router.push({ name: 'teacher-panel' });
};

const goEditCourse = async (): Promise<void> => {
  if (!courseId.value) {
    return;
  }

  await router.push({
    name: 'teacher-course-edit',
    params: { id: courseId.value },
  });
};

const goCreateLesson = async (): Promise<void> => {
  if (!courseId.value) {
    return;
  }

  await router.push({
    name: 'lesson-create',
    params: { courseId: courseId.value },
    query: {
      redirect: 'teacher',
      courseId: courseId.value,
    },
  });
};

const goEditLesson = async (lessonId: string): Promise<void> => {
  if (!lessonId) {
    return;
  }

  await router.push({
    name: 'lesson-edit',
    params: { id: lessonId },
    query: {
      redirect: 'teacher',
      courseId: courseId.value,
    },
  });
};

const openDeleteCourseModal = (): void => {
  deleteCourseError.value = null;
  isDeleteCourseModalOpen.value = true;
};

const closeDeleteCourseModal = (): void => {
  if (deleteCourseBusy.value) {
    return;
  }

  isDeleteCourseModalOpen.value = false;
};

const confirmDeleteCourse = async (): Promise<void> => {
  const currentCourseId = courseId.value;

  if (!currentCourseId) {
    return;
  }

  deleteCourseBusy.value = true;
  deleteCourseError.value = null;

  try {
    await teacherDashboardStore.deleteCourse(currentCourseId);
    teacherLessonsStore.clearCourseLessons(currentCourseId);

    isDeleteCourseModalOpen.value = false;

    await router.push({ name: 'teacher-panel' });
  } catch {
    deleteCourseError.value =
      teacherDashboardStore.coursesError ?? 'Failed to delete course.';
  } finally {
    deleteCourseBusy.value = false;
  }
};

const openDeleteLessonModal = (lessonId: string): void => {
  deleteLessonError.value = null;
  deleteLessonId.value = lessonId;
  isDeleteLessonModalOpen.value = true;
};

const closeDeleteLessonModal = (): void => {
  if (deleteLessonBusy.value) {
    return;
  }

  isDeleteLessonModalOpen.value = false;
  deleteLessonId.value = null;
};

const confirmDeleteLesson = async (): Promise<void> => {
  const currentCourseId = courseId.value;
  const currentLessonId = deleteLessonId.value;

  if (!currentCourseId || !currentLessonId) {
    return;
  }

  deleteLessonBusy.value = true;
  deleteLessonError.value = null;

  try {
    await teacherLessonsStore.deleteLesson(currentCourseId, currentLessonId);
    isDeleteLessonModalOpen.value = false;
    deleteLessonId.value = null;
  } catch {
    deleteLessonError.value =
      teacherLessonsStore.getLessonError(currentLessonId) ?? 'Failed to delete lesson.';
  } finally {
    deleteLessonBusy.value = false;
  }
};

const openEnrollModal = (): void => {
  if (!courseId.value) {
    return;
  }

  teacherDashboardStore.openEnrollModal(courseId.value);
};

const enrollStudent = async (studentId: string): Promise<void> => {
  if (!courseId.value) {
    return;
  }

  await teacherDashboardStore.enrollStudentToCourse(courseId.value, studentId);
};

const unenrollStudent = async (studentId: string): Promise<void> => {
  if (!courseId.value) {
    return;
  }

  await teacherDashboardStore.unenrollStudentFromCourse(courseId.value, studentId);
};

const changeEnrollmentsPage = async (nextPage: number): Promise<void> => {
  if (!courseId.value) {
    return;
  }

  await teacherDashboardStore.changeEnrollmentsPage(courseId.value, nextPage);
};

const retryEnrollments = async (): Promise<void> => {
  if (!courseId.value) {
    return;
  }

  await teacherDashboardStore.retryEnrollments(courseId.value);
};

const startTeacherChat = async (studentId: string): Promise<void> => {
  const currentCourseId = courseId.value;

  if (!currentCourseId || !studentId) {
    return;
  }

  const busyKey = getStartChatBusyKey(studentId);

  if (startChatBusyByStudentId.value[busyKey]) {
    return;
  }

  startChatError.value = null;
  startChatBusyByStudentId.value[busyKey] = true;

  try {
    const conversationId = await messagesStore.startConversation({
      courseId: currentCourseId,
      studentId,
    });

    await router.push({
      name: 'messages',
      query: { c: conversationId },
    });
  } catch (error: unknown) {
    startChatError.value = getApiErrorMessage(error, 'Failed to start conversation.');
  } finally {
    startChatBusyByStudentId.value[busyKey] = false;
  }
};

watch(
  courseId,
  async (nextCourseId) => {
    if (!nextCourseId) {
      course.value = null;
      return;
    }

    await bootstrapTeacherCourseDetails(nextCourseId);
  },
  { immediate: true },
);
</script>

<template>
  <div class="container" :class="$style.root">
    <button type="button" class="btn btn--ghost" @click="goBack">
      ← Back to teacher dashboard
    </button>

    <template v-if="course">
      <div :class="$style.sections">
        <TeacherCourseHeaderCard
          :title="course.title"
          :description="course.description"
          :lessons-count="lessonsCount"
          :students-count="studentsCount"
          :total-duration-label="totalDurationLabel"
          :error="deleteCourseError"
          @edit-course="goEditCourse"
          @delete-course="openDeleteCourseModal"
        />

        <TeacherCourseLessonsCard
          :lessons="lessons"
          :loading="lessonsLoading"
          :error="lessonsError"
          :lesson-busy-by-lesson-id="teacherLessonsStore.lessonBusyByLessonId"
          :lesson-error-by-lesson-id="teacherLessonsStore.lessonErrorByLessonId"
          @create-lesson="goCreateLesson"
          @edit-lesson="goEditLesson"
          @delete-lesson="openDeleteLessonModal"
        />

        <TeacherCourseEnrollmentsCard
          :course-id="courseId"
          :enrollments="enrollments"
          :enrollments-meta="enrollmentsMeta"
          :loading="enrollmentsLoading"
          :error="enrollmentsError"
          :unenroll-busy-by-enrollment-key="teacherDashboardStore.unenrollBusyByEnrollmentKey"
          :start-chat-error="startChatError"
          @open-enroll-modal="openEnrollModal"
          @unenroll="unenrollStudent"
          @change-page="changeEnrollmentsPage"
          @retry="retryEnrollments"
          @message="startTeacherChat"
        />
      </div>

      <ConfirmModal
        :open="isDeleteCourseModalOpen"
        title="Delete course"
        text="Are you sure you want to delete this course?"
        confirm-text="Delete"
        cancel-text="Cancel"
        :busy="deleteCourseBusy"
        @close="closeDeleteCourseModal"
        @confirm="confirmDeleteCourse"
      />

      <ConfirmModal
        :open="isDeleteLessonModalOpen"
        title="Delete lesson"
        text="Are you sure you want to delete this lesson?"
        confirm-text="Delete"
        cancel-text="Cancel"
        :busy="deleteLessonBusy"
        @close="closeDeleteLessonModal"
        @confirm="confirmDeleteLesson"
      />

      <EnrollStudentModal
        :open="teacherDashboardStore.isEnrollModalOpen"
        :course-id="courseId"
        :busy="teacherDashboardStore.enrollBusy"
        :error="teacherDashboardStore.enrollError"
        :suggest="teacherDashboardStore.suggestStudents"
        @close="teacherDashboardStore.closeEnrollModal"
        @enroll="enrollStudent"
      />
    </template>
  </div>
</template>

<style module>
.root {
  padding-bottom: var(--space-7);
}

.sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
</style>



