<script setup lang="ts">
import { computed } from 'vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
import type { AdminCourseDTO } from '@/types/admin.types';

type Props = {
  items: AdminCourseDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  page: number;
  limit: number;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:page', value: number): void;
  (e: 'update:limit', value: number): void;
  (e: 'refresh'): void;
}>();

const ALLOWED_LIMITS: readonly number[] = [10, 20, 30, 50];

const readInputValue = (event: Event): string | null => {
  const eventTarget = event.target;
  if (!(eventTarget instanceof HTMLInputElement)) {
    return null;
  }

  return eventTarget.value;
};

const readSelectValue = (event: Event): string | null => {
  const eventTarget = event.target;
  if (!(eventTarget instanceof HTMLSelectElement)) {
    return null;
  }

  return eventTarget.value;
};

const parseLimit = (value: string): number | null => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return ALLOWED_LIMITS.includes(parsedValue) ? parsedValue : null;
};

const formatIsoDateTime = (value: string | null): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
};

const totalPages = computed<number>(() => {
  const pages = Math.ceil(props.total / props.limit);
  return Math.max(1, pages);
});

const onSearchInput = (event: Event): void => {
  const nextValue = readInputValue(event);

  if (nextValue === null) {
    return;
  }

  emit('update:search', nextValue);
};

const onLimitChange = (event: Event): void => {
  const nextValue = readSelectValue(event);

  if (nextValue === null) {
    return;
  }

  const nextLimit = parseLimit(nextValue);

  if (nextLimit === null) {
    return;
  }

  emit('update:limit', nextLimit);
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <header :class="$style.header">
        <div>
          <h2 :class="$style.title">Courses</h2>
          <p class="muted">Total: {{ total }}</p>
        </div>

        <button
          type="button"
          class="btn btn--ghost"
          :disabled="loading"
          @click="emit('refresh')"
        >
          Refresh
        </button>
      </header>

      <div :class="$style.filters">
        <label :class="$style.field">
          <span :class="$style.label">Search by title</span>
          <input
            class="input"
            type="search"
            :value="search"
            placeholder="e.g. vue"
            @input="onSearchInput"
          />
        </label>

        <label :class="$style.field">
          <span :class="$style.label">Limit</span>
          <select class="input" :value="limit" @change="onLimitChange">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="30">30</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>

      <p v-if="error" :class="$style.error" role="status">{{ error }}</p>

      <div :class="['hScroll', $style.tableWrap]" :aria-busy="loading ? 'true' : 'false'">
        <table :class="$style.table">
          <thead>
          <tr>
            <th>Title</th>
            <th>Owner</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
          </thead>

          <tbody v-if="loading">
          <tr v-for="rowIndex in 6" :key="rowIndex">
            <td colspan="4" :class="$style.skeleton">Loading...</td>
          </tr>
          </tbody>

          <tbody v-else-if="items.length === 0">
          <tr>
            <td colspan="4" class="muted">No courses for the selected filter.</td>
          </tr>
          </tbody>

          <tbody v-else>
          <tr v-for="course in items" :key="course.id">
            <td data-label="Title">{{ course.title }}</td>
            <td data-label="Owner">{{ course.ownerEmail }}</td>
            <td data-label="Created">{{ formatIsoDateTime(course.createdAt) }}</td>
            <td data-label="Updated">{{ formatIsoDateTime(course.updatedAt) }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls
        :page="page"
        :total-pages="totalPages"
        :loading="loading"
        @prev="emit('update:page', page - 1)"
        @next="emit('update:page', page + 1)"
      />
    </div>
  </section>
</template>

<style module>
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.title {
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.filters {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.tableWrap {
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: auto;
}

.table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.table th {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 650;
}

.skeleton {
  color: rgba(245, 246, 255, 0.55);
}

.error {
  margin-bottom: var(--space-3);
  color: rgba(255, 170, 170, 0.95);
}

@media (max-width: 640px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .table {
    min-width: 0;
    table-layout: auto;
  }

  .table thead {
    display: none;
  }

  .table,
  .table tbody,
  .table tr,
  .table td {
    display: block;
    width: 100%;
  }

  .tableWrap {
    border: 0;
    background: transparent;
  }

  .table tr {
    margin-bottom: var(--space-4);
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }

  .table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border);
  }

  .table td:last-child {
    border-bottom: 0;
  }

  .table td::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 6px;
    font-size: var(--text-sm);
    font-weight: 650;
    color: var(--color-text-muted);
  }
}
</style>




