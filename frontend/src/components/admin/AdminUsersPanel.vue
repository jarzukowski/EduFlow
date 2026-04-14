<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PaginationControls from '@/components/common/PaginationControls.vue';
import type {
  AdminUserDTO,
  AdminUserStatus,
  UserRole,
} from '@/types/admin.types';

type RoleFilter = UserRole | 'ALL';
type StatusFilter = AdminUserStatus | 'ALL';

type Props = {
  items: AdminUserDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  role: RoleFilter;
  status: StatusFilter;
  lastLoginFrom: string;
  lastLoginTo: string;
  page: number;
  limit: number;
  roleBusyByUserId: Record<string, boolean>;
  forceLogoutBusyByUserId: Record<string, boolean>;
  lastActionOk: string | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:role', value: RoleFilter): void;
  (e: 'update:status', value: StatusFilter): void;
  (e: 'update:lastLoginFrom', value: string): void;
  (e: 'update:lastLoginTo', value: string): void;
  (e: 'update:page', value: number): void;
  (e: 'update:limit', value: number): void;
  (e: 'refresh'): void;
  (e: 'changeRole', userId: string, role: UserRole): void;
  (e: 'requestForceLogout', user: AdminUserDTO): void;
  (e: 'dismissOk'): void;
}>();

const ALLOWED_LIMITS: readonly number[] = [10, 20, 30, 50];

const parseRoleFilter = (value: string): RoleFilter | null => {
  if (value === 'ALL') return 'ALL';
  if (value === 'STUDENT') return 'STUDENT';
  if (value === 'TEACHER') return 'TEACHER';
  if (value === 'ADMIN') return 'ADMIN';
  return null;
};

const parseStatusFilter = (value: string): StatusFilter | null => {
  if (value === 'ALL') return 'ALL';
  if (value === 'ACTIVE') return 'ACTIVE';
  if (value === 'BLOCKED') return 'BLOCKED';
  return null;
};

const parseUserRole = (value: string): UserRole | null => {
  if (value === 'STUDENT') return 'STUDENT';
  if (value === 'TEACHER') return 'TEACHER';
  if (value === 'ADMIN') return 'ADMIN';
  return null;
};

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

const draftRoleByUserId = ref<Record<string, UserRole>>({});

watch(
  () => props.items,
  (items) => {
    const nextDraftRoleByUserId: Record<string, UserRole> = {};

    for (const user of items) {
      nextDraftRoleByUserId[user.id] = user.role;
    }

    draftRoleByUserId.value = nextDraftRoleByUserId;
  },
  { immediate: true },
);

const isRowBusy = (userId: string): boolean =>
  Boolean(
    props.roleBusyByUserId[userId] || props.forceLogoutBusyByUserId[userId],
  );

const canSaveRole = (user: AdminUserDTO): boolean => {
  const draftRole = draftRoleByUserId.value[user.id];
  return draftRole !== undefined && draftRole !== user.role;
};

const onSearchInput = (event: Event): void => {
  const nextValue = readInputValue(event);

  if (nextValue === null) {
    return;
  }

  emit('update:search', nextValue);
};

const onRoleFilterChange = (event: Event): void => {
  const nextValue = readSelectValue(event);

  if (nextValue === null) {
    return;
  }

  const parsedRoleFilter = parseRoleFilter(nextValue);

  if (!parsedRoleFilter) {
    return;
  }

  emit('update:role', parsedRoleFilter);
};

const onStatusFilterChange = (event: Event): void => {
  const nextValue = readSelectValue(event);

  if (nextValue === null) {
    return;
  }

  const parsedStatusFilter = parseStatusFilter(nextValue);

  if (!parsedStatusFilter) {
    return;
  }

  emit('update:status', parsedStatusFilter);
};

const onLastLoginFromInput = (event: Event): void => {
  const nextValue = readInputValue(event);

  if (nextValue === null) {
    return;
  }

  emit('update:lastLoginFrom', nextValue);
};

const onLastLoginToInput = (event: Event): void => {
  const nextValue = readInputValue(event);

  if (nextValue === null) {
    return;
  }

  emit('update:lastLoginTo', nextValue);
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

const onDraftRoleChange = (userId: string, event: Event): void => {
  const nextValue = readSelectValue(event);

  if (nextValue === null) {
    return;
  }

  const nextRole = parseUserRole(nextValue);

  if (!nextRole) {
    return;
  }

  draftRoleByUserId.value = {
    ...draftRoleByUserId.value,
    [userId]: nextRole,
  };
};

const onSaveRoleClick = (user: AdminUserDTO): void => {
  const draftRole = draftRoleByUserId.value[user.id];

  if (!draftRole) {
    return;
  }

  emit('changeRole', user.id, draftRole);
};

const onForceLogoutClick = (user: AdminUserDTO): void => {
  emit('requestForceLogout', user);
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <header :class="$style.header">
        <div>
          <h2 :class="$style.title">Users</h2>
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

      <div v-if="lastActionOk" :class="$style.ok" role="status">
        <span>{{ lastActionOk }}</span>
        <button
          type="button"
          class="btn btn--ghost"
          @click="emit('dismissOk')"
        >
          OK
        </button>
      </div>

      <div :class="$style.filters">
        <label :class="$style.field">
          <span :class="$style.label">Search by email or username</span>
          <input
            class="input"
            type="search"
            :value="search"
            placeholder="e.g. adam"
            @input="onSearchInput"
          />
        </label>

        <label :class="$style.field">
          <span :class="$style.label">Role</span>
          <select class="input" :value="role" @change="onRoleFilterChange">
            <option value="ALL">All</option>
            <option value="STUDENT">STUDENT</option>
            <option value="TEACHER">TEACHER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        <label :class="$style.field">
          <span :class="$style.label">Status</span>
          <select class="input" :value="status" @change="onStatusFilterChange">
            <option value="ALL">All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </label>

        <label :class="$style.field">
          <span :class="$style.label">Signed in from</span>
          <input
            class="input"
            type="date"
            :value="lastLoginFrom"
            @input="onLastLoginFromInput"
          />
        </label>

        <label :class="$style.field">
          <span :class="$style.label">Signed in to</span>
          <input
            class="input"
            type="date"
            :value="lastLoginTo"
            @input="onLastLoginToInput"
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
            <th :class="$style.colEmail">Email</th>
            <th :class="$style.colUsername">Username</th>
            <th :class="$style.colRole">Role</th>
            <th :class="$style.colStatus">Status</th>
            <th :class="$style.colLastLogin">Last sign-in</th>
            <th :class="$style.colCreated">Created</th>
            <th :class="$style.colActions">Actions</th>
          </tr>
          </thead>

          <tbody v-if="loading">
          <tr v-for="rowIndex in 6" :key="rowIndex">
            <td colspan="7" :class="$style.skeleton">Loading...</td>
          </tr>
          </tbody>

          <tbody v-else-if="items.length === 0">
          <tr>
            <td colspan="7" class="muted">No users for the selected filters.</td>
          </tr>
          </tbody>

          <tbody v-else>
          <tr v-for="user in items" :key="user.id">
            <td data-label="Email">{{ user.email }}</td>
            <td data-label="Username">{{ user.username }}</td>

            <td data-label="Role">
              <select
                :class="['input', $style.roleSelect]"
                :value="draftRoleByUserId[user.id] ?? user.role"
                :disabled="isRowBusy(user.id)"
                @change="onDraftRoleChange(user.id, $event)"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </td>

            <td data-label="Status">
                <span
                  :class="[
                    $style.statusBadge,
                    user.status === 'ACTIVE'
                      ? $style.statusActive
                      : $style.statusBlocked,
                  ]"
                >
                  {{ user.status }}
                </span>
            </td>

            <td data-label="Last sign-in">
              {{ formatIsoDateTime(user.lastLoginAt) }}
            </td>

            <td data-label="Created">
              {{ formatIsoDateTime(user.createdAt) }}
            </td>

            <td data-label="Actions" :class="$style.actionsCell">
              <div :class="$style.rowActions">
                <button
                  type="button"
                  class="btn btn--ghost"
                  :disabled="isRowBusy(user.id) || !canSaveRole(user)"
                  @click="onSaveRoleClick(user)"
                >
                  Save role
                </button>

                <button
                  type="button"
                  class="btn btn--danger"
                  :disabled="isRowBusy(user.id)"
                  @click="onForceLogoutClick(user)"
                >
                  Force logout
                </button>
              </div>

              <p v-if="roleBusyByUserId[user.id]" :class="$style.rowHint">
                Updating role...
              </p>
              <p
                v-else-if="forceLogoutBusyByUserId[user.id]"
                :class="$style.rowHint"
              >
                Signing out...
              </p>
            </td>
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

.ok {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: 10px 12px;
  border: 1px solid rgba(120, 210, 170, 0.35);
  border-radius: var(--radius-lg);
  background: rgba(120, 210, 170, 0.12);
}

.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
}

.table {
  width: 100%;
  min-width: 1080px;
  table-layout: fixed;
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

.colEmail {
  width: 260px;
}

.colUsername {
  width: 160px;
}

.colRole {
  width: 160px;
}

.colStatus {
  width: 120px;
}

.colLastLogin {
  width: 190px;
}

.colCreated {
  width: 190px;
}

.colActions {
  width: 300px;
}

.roleSelect {
  width: 100%;
  min-width: 140px;
  white-space: nowrap;
}

.statusBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.06);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.statusActive {
  border-color: rgba(120, 210, 170, 0.35);
  background: rgba(120, 210, 170, 0.12);
  color: rgba(180, 255, 220, 0.92);
}

.statusBlocked {
  border-color: rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.12);
  color: rgba(255, 190, 190, 0.95);
}

.actionsCell {
  white-space: normal;
}

.rowActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.rowActions :global(.btn) {
  max-width: 100%;
  white-space: nowrap;
}

.rowHint {
  margin-top: 6px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.error {
  margin-bottom: var(--space-3);
  color: rgba(255, 170, 170, 0.95);
}

@media (max-width: 1024px) {
  .filters {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
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

  .rowActions {
    flex-direction: column;
    align-items: stretch;
  }

  .rowActions :global(.btn) {
    width: 100%;
    justify-content: center;
    white-space: nowrap;
  }

  .roleSelect {
    min-width: 0;
  }
}
</style>





