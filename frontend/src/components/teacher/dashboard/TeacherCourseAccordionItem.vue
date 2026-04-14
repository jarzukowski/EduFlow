<script setup lang="ts">
import { computed, ref } from 'vue';

import ConfirmModal from '../shared/ConfirmModal.vue';
import TeacherLessonsList from './TeacherLessonsList.vue';
import TeacherEnrollmentsList from '../shared/TeacherEnrollmentsList.vue';

import type {
  TeacherCourseSummaryDTO,
  CourseEnrollmentListItemDTO,
  TeacherLessonDTO,
} from '@/types/teacherDashboard.types';

type Props = {
  course: TeacherCourseSummaryDTO;
  expanded: boolean;
  lessons?: TeacherLessonDTO[];
  lessonsLoading?: boolean;
  lessonsError?: string | null;
  lessonBusyByLessonId: Record<string, boolean>;
  lessonErrorByLessonId: Record<string, string | null>;
  enrollments?: CourseEnrollmentListItemDTO[];
  enrollmentsLoading?: boolean;
  enrollmentsError?: string | null;
  enrollmentsTotal?: number;
  enrollmentsPage?: number;
  enrollmentsLimit?: number;
  unenrollBusyByEnrollmentKey?: Record<string, boolean>;
  canCreateLessons?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  unenrollBusyByEnrollmentKey: () => ({}),
  canCreateLessons: true,
});

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'enroll'): void;
  (e: 'unenroll', studentId: string): void;
  (e: 'changeEnrollmentsPage', nextPage: number): void;
  (e: 'retryEnrollments'): void;
  (e: 'retryLessons'): void;
  (e: 'createLesson'): void;
  (e: 'editLesson', lesson: TeacherLessonDTO): void;
  (e: 'deleteLesson', lesson: TeacherLessonDTO): void;
  (e: 'moveLesson', payload: { lessonId: string; direction: 'up' | 'down' }): void;
  (e: 'openLessonPdf', lessonId: string): void;
  (e: 'message', studentId: string): void;
}>();

const panelId = computed<string>(() => `teacher-course-panel-${props.course.id}`);

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
  <article :class="$style.item">
    <button
      type="button"
      :class="$style.header"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      @click="emit('toggle')"
    >
      <span :class="$style.titleArea">
        <span :class="$style.title">{{ course.title }}</span>

        <span v-if="course.description" class="muted" :class="$style.desc">
          {{ course.description }}
        </span>

        <span :class="$style.meta">
          <span :class="$style.badge">{{ course.studentsCount }} students</span>
          <span :class="$style.badge">{{ course.lessonsCount }} lessons</span>
          <span :class="$style.badge">{{ course.totalDurationMinutes }} min</span>
        </span>
      </span>

      <span :class="$style.actions" aria-hidden="true">
        <span :class="$style.chev">
          <span :class="expanded ? $style.chevUp : $style.chevDown">⌄</span>
        </span>
      </span>

      <span :class="$style.srOnly">
        {{ expanded ? 'Collapse course' : 'Expand course' }}
      </span>
    </button>

    <div v-if="expanded" :id="panelId" :class="$style.body">
      <section :class="$style.section">
        <div class="row row--between" :class="$style.sectionHeader">
          <h2 :class="$style.h2">Lessons</h2>
        </div>

        <TeacherLessonsList
          :lessons="lessons ?? []"
          :loading="Boolean(lessonsLoading)"
          :error="lessonsError ?? null"
          :lesson-busy-by-lesson-id="lessonBusyByLessonId"
          :lesson-error-by-lesson-id="lessonErrorByLessonId"
          :can-create="Boolean(canCreateLessons)"
          @retry="emit('retryLessons')"
          @create="emit('createLesson')"
          @edit="emit('editLesson', $event)"
          @delete="emit('deleteLesson', $event)"
          @move="emit('moveLesson', $event)"
          @open-pdf="emit('openLessonPdf', $event)"
        />
      </section>

      <section :class="$style.section">
        <div class="row row--between" :class="$style.sectionHeader">
          <h2 :class="$style.h2">Students</h2>

          <button type="button" class="btn btn--primary" @click="emit('enroll')">
            Add student
          </button>
        </div>

        <TeacherEnrollmentsList
          :course-id="course.id"
          :enrollments="enrollments ?? []"
          :total="enrollmentsTotal ?? 0"
          :page="enrollmentsPage ?? 1"
          :limit="enrollmentsLimit ?? 10"
          :loading="Boolean(enrollmentsLoading)"
          :error="enrollmentsError ?? null"
          :unenroll-busy-by-enrollment-key="unenrollBusyByEnrollmentKey"
          @request-unenroll="openUnenrollConfirm"
          @change-page="emit('changeEnrollmentsPage', $event)"
          @retry="emit('retryEnrollments')"
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
      </section>
    </div>
  </article>
</template>

<style module>
.item {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
}

.header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  gap: var(--space-4);
  align-items: start;
  width: 100%;
  min-width: 0;
  padding: var(--space-5);
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.header:focus-visible {
  border-radius: var(--radius-lg);
}

.titleArea {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.title {
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.desc {
  margin-top: 6px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.badge {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.05);
  font-size: var(--text-xs);
}

.actions {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  align-self: start;
}

.chev {
  opacity: 0.85;
}

.chevUp {
  display: inline-block;
  transform: rotate(180deg);
  transition: transform var(--dur-fast) var(--ease-out);
}

.chevDown {
  display: inline-block;
  transition: transform var(--dur-fast) var(--ease-out);
}

.body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.section {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sectionHeader {
  gap: var(--space-4);
}

.h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 768px) {
  .header {
    padding: var(--space-4);
    gap: var(--space-3);
  }

  .body {
    padding: var(--space-4);
    gap: var(--space-5);
  }

  .sectionHeader {
    flex-wrap: wrap;
    align-items: center;
  }

  .desc {
    -webkit-line-clamp: 7;
  }
}

@media (max-width: 560px) {
  .sectionHeader {
    align-items: stretch;
  }

  .sectionHeader :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>






