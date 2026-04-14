<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import CourseForm from '@/components/courses/CourseForm.vue';

import { getApiErrorMessage } from '@/api/apiError';
import { useCoursesStore } from '@/stores/courses.store';

import type { CreateCoursePayload } from '@/types/course.types';

const router = useRouter();
const coursesStore = useCoursesStore();

const busy = ref(false);
const submitError = ref<string | null>(null);

const onSubmitCreate = async (payload: CreateCoursePayload): Promise<void> => {
  if (busy.value) {
    return;
  }

  const normalizedTitle = payload.title?.trim() ?? '';

  if (normalizedTitle.length < 3) {
    submitError.value = 'Title must have at least 3 characters.';
    return;
  }

  busy.value = true;
  submitError.value = null;

  try {
    const createdCourse = await coursesStore.createCourse({
      ...payload,
      title: normalizedTitle,
    });

    await router.push({
      name: 'teacher-course-details',
      params: { id: createdCourse.id },
    });
  } catch (error: unknown) {
    submitError.value = getApiErrorMessage(error, 'Failed to create course.');
  } finally {
    busy.value = false;
  }
};

const onCancel = async (): Promise<void> => {
  await router.push({ name: 'teacher-panel' });
};
</script>

<template>
  <div class="container">
    <div :class="$style.page">
      <p v-if="submitError" :class="$style.error">
        {{ submitError }}
      </p>

      <CourseForm
        mode="create"
        :busy="busy"
        :error="coursesStore.error"
        @submit:create="onSubmitCreate"
        @cancel="onCancel"
      />
    </div>
  </div>
</template>

<style module>
.page {
  padding: var(--space-6) 0;
}

.error {
  margin-bottom: var(--space-4);
  color: var(--color-danger);
}
</style>

