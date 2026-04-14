<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CoursesGrid from '@/components/courses/CoursesGrid.vue';
import CoursesPagination from '@/components/courses/CoursesPagination.vue';
import CoursesToolbar from '@/components/courses/CoursesToolbar.vue';

import { useCoursesStore } from '@/stores/courses.store';

type CoursesPaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

const DEFAULT_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 300;

const route = useRoute();
const router = useRouter();
const coursesStore = useCoursesStore();

const searchInput = ref<string>('');
let searchDebounceTimer: ReturnType<typeof window.setTimeout> | null = null;

const parsePositiveIntegerQuery = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string') return fallback;

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const normalizeSearchQuery = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const queryPage = computed<number>(() => parsePositiveIntegerQuery(route.query.page, 1));
const queryLimit = computed<number>(() =>
  parsePositiveIntegerQuery(route.query.limit, DEFAULT_LIMIT),
);
const querySearch = computed<string>(() => normalizeSearchQuery(route.query.search));

const createPaginationItems = (
  currentPage: number,
  totalPages: number,
): CoursesPaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis-left',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    'ellipsis-left',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-right',
    totalPages,
  ];
};

const pageItems = computed<CoursesPaginationItem[]>(() =>
  createPaginationItems(coursesStore.page, coursesStore.totalPages),
);

const syncUrl = async (): Promise<void> => {
  const nextQuery: Record<string, string> = {};

  if (coursesStore.page > 1) {
    nextQuery.page = String(coursesStore.page);
  }

  if (coursesStore.search) {
    nextQuery.search = coursesStore.search;
  }

  if (coursesStore.limit !== DEFAULT_LIMIT) {
    nextQuery.limit = String(coursesStore.limit);
  }

  const currentPageValue = typeof route.query.page === 'string' ? route.query.page : '';
  const currentSearchValue =
    typeof route.query.search === 'string' ? route.query.search : '';
  const currentLimitValue =
    typeof route.query.limit === 'string' ? route.query.limit : '';

  const nextPageValue = nextQuery.page ?? '';
  const nextSearchValue = nextQuery.search ?? '';
  const nextLimitValue = nextQuery.limit ?? '';

  const isSameQuery =
    currentPageValue === nextPageValue &&
    currentSearchValue === nextSearchValue &&
    currentLimitValue === nextLimitValue;

  if (isSameQuery) return;

  await router.replace({
    name: 'courses',
    query: nextQuery,
  });
};

const loadCourses = async (): Promise<void> => {
  await coursesStore.fetchCourses();
};

const changePage = async (nextPage: number): Promise<void> => {
  if (coursesStore.listLoading) return;
  if (nextPage < 1 || nextPage > coursesStore.totalPages) return;

  coursesStore.setPage(nextPage);
  await syncUrl();
};

const goPrev = async (): Promise<void> => {
  await changePage(coursesStore.page - 1);
};

const goNext = async (): Promise<void> => {
  await changePage(coursesStore.page + 1);
};

const goPage = async (nextPage: number): Promise<void> => {
  await changePage(nextPage);
};

const onUpdateLimit = async (nextLimit: number): Promise<void> => {
  coursesStore.setLimit(nextLimit);
  await syncUrl();
};

const onReload = async (): Promise<void> => {
  if (coursesStore.listLoading) return;
  await loadCourses();
};

watch(
  searchInput,
  (nextSearchInput) => {
    if (searchDebounceTimer) {
      window.clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = window.setTimeout(async () => {
      coursesStore.setSearch(nextSearchInput);
      await syncUrl();
    }, SEARCH_DEBOUNCE_MS);
  },
  { flush: 'post' },
);

watch(
  [queryPage, querySearch, queryLimit],
  async ([nextPage, nextSearch, nextLimit]) => {
    const searchChanged = nextSearch !== coursesStore.search;
    const limitChanged = nextLimit !== coursesStore.limit;

    if (limitChanged) {
      coursesStore.setLimit(nextLimit);
    }

    if (searchChanged) {
      coursesStore.setSearch(nextSearch);
    } else if (!limitChanged) {
      coursesStore.setPage(nextPage);
    }

    searchInput.value = nextSearch;

    await coursesStore.fetchCourses();
    await syncUrl();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (searchDebounceTimer) {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
});
</script>

<template>
  <div class="container">
    <section :class="$style.page">
      <CoursesToolbar
        title="Course list"
        :model-value="searchInput"
        :busy="coursesStore.listLoading"
        :total="coursesStore.total"
        :page="coursesStore.page"
        :total-pages="coursesStore.totalPages"
        :limit="coursesStore.limit"
        search-placeholder="Search courses..."
        @update:modelValue="searchInput = $event"
        @update:limit="onUpdateLimit"
        @reload="onReload"
      />

      <p v-if="coursesStore.listError" :class="$style.error" role="alert">
        {{ coursesStore.listError }}
      </p>

      <CoursesPagination
        v-if="coursesStore.totalPages > 1"
        :page="coursesStore.page"
        :total-pages="coursesStore.totalPages"
        :items="pageItems"
        :busy="coursesStore.listLoading"
        @prev="goPrev"
        @next="goNext"
        @page="goPage"
      />

      <CoursesGrid
        :items="coursesStore.courses"
        :loading="coursesStore.listLoading"
        :skeleton-count="coursesStore.limit"
        empty-text="No courses to display."
      />

      <CoursesPagination
        v-if="coursesStore.totalPages > 1"
        :page="coursesStore.page"
        :total-pages="coursesStore.totalPages"
        :items="pageItems"
        :busy="coursesStore.listLoading"
        @prev="goPrev"
        @next="goNext"
        @page="goPage"
      />
    </section>
  </div>
</template>

<style module>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.error {
  margin: 0;
  color: var(--color-danger);
}
</style>



