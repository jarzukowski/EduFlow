<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CourseForm from '@/components/courses/CourseForm.vue';

import { useCoursesStore } from '@/stores/courses.store';

import type {
  CourseFormInitialValues,
  UpdateCoursePayload,
} from '@/types/course.types';

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();

const courseId = computed<string>(() => {
  return typeof route.params.id === 'string' ? route.params.id : '';
});

const loading = ref(true);
const notFound = ref(false);
const busy = ref(false);
const initialValues = ref<CourseFormInitialValues>({});

const loadCourse = async (): Promise<void> => {
  loading.value = true;
  notFound.value = false;

  if (!courseId.value) {
    notFound.value = true;
    loading.value = false;
    return;
  }

  try {
    const cachedCourse = coursesStore.getCourseById(courseId.value);

    if (cachedCourse) {
      initialValues.value = {
        title: cachedCourse.title,
        description: cachedCourse.description ?? '',
        thumbnailKey: null,
      };
    }

    const freshCourse = await coursesStore.fetchCourseById(courseId.value);

    if (!freshCourse) {
      notFound.value = true;
      return;
    }

    initialValues.value = {
      title: freshCourse.title,
      description: freshCourse.description ?? '',
      thumbnailKey: null,
    };
  } finally {
    loading.value = false;
  }
};

watch(
  courseId,
  async () => {
    await loadCourse();
  },
  { immediate: true },
);

const onSubmitEdit = async (payload: UpdateCoursePayload): Promise<void> => {
  if (!courseId.value || busy.value) {
    return;
  }

  busy.value = true;

  try {
    await coursesStore.updateCourse(courseId.value, payload);

    await router.push({
      name: 'teacher-course-details',
      params: { id: courseId.value },
    });
  } finally {
    busy.value = false;
  }
};

const onCancel = async (): Promise<void> => {
  if (!courseId.value) {
    await router.push({ name: 'teacher-panel' });
    return;
  }

  await router.push({
    name: 'teacher-course-details',
    params: { id: courseId.value },
  });
};
</script>

<template>
  <div class="container">
    <div :class="$style.page">
      <p v-if="loading" :class="$style.info">
        Loading course...
      </p>

      <div v-else-if="notFound" :class="$style.notFound">
        <p :class="$style.errorText">The course toes not exist or has been deleted.</p>

        <button class="btn btn--ghost" type="button" @click="onCancel">
          Back
        </button>
      </div>

      <CourseForm
        v-else
        mode="edit"
        :busy="busy"
        :error="coursesStore.error"
        :initial-values="initialValues"
        @submit:edit="onSubmitEdit"
        @cancel="onCancel"
      />
    </div>
  </div>
</template>

<style module>
.page {
  padding: var(--space-6) 0;
}

.info {
  padding: var(--space-6) 0;
  color: var(--color-text-muted);
}

.notFound {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6) 0;
}

.errorText {
  color: var(--color-danger);
}
</style>



