<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import StudentCoursesPanel from '@/components/student-dashboard/StudentCoursesPanel.vue';
import StudentProgressCard from '@/components/student-dashboard/StudentProgressCard.vue';
import StudentQuickActionsCard from '@/components/student-dashboard/StudentQuickActionsCard.vue';

import { getApiErrorMessage } from '@/api/apiError.ts';
import { useMessagesStore } from '@/stores/messages.store.ts';
import { useStudentDashboardStore } from '@/stores/studentDashboard.store.ts';

const router = useRouter();

const studentDashboardStore = useStudentDashboardStore();
const messagesStore = useMessagesStore();

const messageBusyByCourseId = ref<Record<string, boolean>>({});
const messageErrorByCourseId = ref<Record<string, string | null>>({});

const pdfBusyByLessonId = ref<Record<string, boolean>>({});
const pdfErrorByLessonId = ref<Record<string, string | null>>({});

const visibleCourses = computed(() => {
  const activeCourseId =
    studentDashboardStore.selectedCourseId ?? studentDashboardStore.expandedCourseId;

  if (!activeCourseId) {
    return [];
  }

  const activeCourse = studentDashboardStore.courses.find(
    (course) => course.id === activeCourseId,
  );

  return activeCourse ? [activeCourse] : [];
});

const isPdfBusy = (lessonId: string): boolean => {
  return Boolean(pdfBusyByLessonId.value[lessonId]);
};

const getPdfError = (lessonId: string): string | null => {
  return pdfErrorByLessonId.value[lessonId] ?? null;
};

const openExternalResource = (url: string): void => {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return;
    }

    window.open(parsedUrl.toString(), '_blank', 'noopener,noreferrer');
  } catch {
    return;
  }
};

const onToggleCompletion = async (payload: {
  courseId: string;
  lessonId: string;
  completed: boolean;
}): Promise<void> => {
  await studentDashboardStore.updateLessonCompletion(
    payload.courseId,
    payload.lessonId,
    payload.completed,
  );
};

const onOpenPdf = async (lessonId: string): Promise<void> => {
  if (!lessonId || pdfBusyByLessonId.value[lessonId]) {
    return;
  }

  pdfBusyByLessonId.value[lessonId] = true;
  pdfErrorByLessonId.value[lessonId] = null;

  try {
    await router.push({
      name: 'lesson-pdf',
      params: { id: lessonId },
    });
  } catch (unknownError: unknown) {
    pdfErrorByLessonId.value[lessonId] = getApiErrorMessage(
      unknownError,
      'Failed to open PDF.',
    );
  } finally {
    pdfBusyByLessonId.value[lessonId] = false;
  }
};

const onOpenVideo = (videoUrl: string): void => {
  openExternalResource(videoUrl);
};

const onMessageTeacher = async (courseId: string): Promise<void> => {
  if (!courseId || messageBusyByCourseId.value[courseId]) {
    return;
  }

  messageBusyByCourseId.value[courseId] = true;
  messageErrorByCourseId.value[courseId] = null;

  try {
    const conversationId = await messagesStore.startConversation({ courseId });

    await router.push({
      path: '/messages',
      query: { c: conversationId },
    });
  } catch (unknownError: unknown) {
    messageErrorByCourseId.value[courseId] = getApiErrorMessage(
      unknownError,
      'Failed to start conversation.',
    );
  } finally {
    messageBusyByCourseId.value[courseId] = false;
  }
};

onMounted(async () => {
  await studentDashboardStore.fetchStudentCourses();
});
</script>

<template>
  <div class="container">
    <div :class="$style.layout">
      <section :class="$style.main">
        <StudentCoursesPanel
          title="Student dashboard"
          subtitle="Your courses and lessons."
          :courses="visibleCourses"
          :loading="studentDashboardStore.coursesLoading"
          :error="studentDashboardStore.coursesError"
          :expanded-course-id="studentDashboardStore.expandedCourseId"
          :lessons-by-course-id="studentDashboardStore.lessonsByCourseId"
          :lessons-loading-by-course-id="studentDashboardStore.lessonsLoadingByCourseId"
          :lessons-error-by-course-id="studentDashboardStore.lessonsErrorByCourseId"
          :completion-busy-by-lesson-id="studentDashboardStore.isCompletionBusy"
          :completion-error-by-lesson-id="studentDashboardStore.getCompletionError"
          :pdf-busy-by-lesson-id="isPdfBusy"
          :pdf-error-by-lesson-id="getPdfError"
          :message-busy-by-course-id="messageBusyByCourseId"
          :message-error-by-course-id="messageErrorByCourseId"
          @toggleCourse="studentDashboardStore.toggleCourse"
          @toggleCompletion="onToggleCompletion"
          @openPdf="onOpenPdf"
          @openVideo="onOpenVideo"
          @messageTeacher="onMessageTeacher"
        />
      </section>

      <aside :class="$style.side">
        <StudentQuickActionsCard
          :courses="studentDashboardStore.courses"
          :loading="studentDashboardStore.coursesLoading"
          :selected-course-id="studentDashboardStore.selectedCourseId"
          @selectCourse="studentDashboardStore.selectCourse"
        />

        <StudentProgressCard
          :course-progress="studentDashboardStore.courseProgress"
          :overall-progress="studentDashboardStore.overallProgress"
        />
      </aside>
    </div>
  </div>
</template>

<style module>
.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-6);
}

.main {
  min-width: 0;
}

.side {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>



