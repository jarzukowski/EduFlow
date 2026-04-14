<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AdminCoursesPanel from '@/components/admin/AdminCoursesPanel.vue';
import AdminQuickActionsCard from '@/components/admin/AdminQuickActionsCard.vue';
import AdminSendMessagePanel from '@/components/admin/AdminSendMessagePanel.vue';
import AdminSendNotificationPanel from '@/components/admin/AdminSendNotificationPanel.vue';
import AdminStatsCard from '@/components/admin/AdminStatsCard.vue';
import AdminUsersPanel from '@/components/admin/AdminUsersPanel.vue';

import { useAdminStore } from '@/stores/admin.store';
import { useMessagesStore } from '@/stores/messages.store';

import type {
  AdminDashboardSection,
  AdminUserDTO,
} from '@/types/admin.types';

const adminStore = useAdminStore();
const messagesStore = useMessagesStore();

const route = useRoute();
const router = useRouter();

const parseAdminDashboardSection = (
  value: unknown,
): AdminDashboardSection | null => {
  if (value === 'users') return 'users';
  if (value === 'courses') return 'courses';
  if (value === 'notifications') return 'notifications';
  if (value === 'messages') return 'messages';
  return null;
};

const activeSection = computed<AdminDashboardSection>(
  () => parseAdminDashboardSection(route.query.tab) ?? 'users',
);

const isUsersActive = computed<boolean>(() => activeSection.value === 'users');
const isCoursesActive = computed<boolean>(() => activeSection.value === 'courses');
const isNotificationsActive = computed<boolean>(
  () => activeSection.value === 'notifications',
);
const isMessagesActive = computed<boolean>(
  () => activeSection.value === 'messages',
);

const setActiveSection = async (
  nextSection: AdminDashboardSection,
): Promise<void> => {
  if (activeSection.value === nextSection) {
    return;
  }

  await router.replace({
    path: '/admin',
    query: {
      ...route.query,
      tab: nextSection,
    },
  });
};

const createDebouncer = (delayMs: number) => {
  let timeoutId: number | null = null;

  return (callback: () => void): void => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(callback, delayMs);
  };
};

const ensureUsersLoaded = async (): Promise<void> => {
  await adminStore.fetchUsers();
};

const ensureCoursesLoaded = async (): Promise<void> => {
  if (adminStore.coursesLoading) {
    return;
  }

  if (adminStore.courses.length > 0 || adminStore.coursesTotal > 0) {
    return;
  }

  await adminStore.fetchCourses();
};

const onAdminSendMessage = async (): Promise<void> => {
  await adminStore.sendMessage();

  if (adminStore.messageOk) {
    await messagesStore.fetchInbox({ limit: 20 });
  }
};

const onRequestForceLogout = async (user: AdminUserDTO): Promise<void> => {
  const isConfirmed = window.confirm(
    `Force logout for: ${user.email}?\nThis will sign them out of all sessions.`,
  );

  if (!isConfirmed) {
    return;
  }

  await adminStore.forceLogoutUser(user.id);
};

const usersSearchDraft = ref<string>(adminStore.usersFilters.search);
const coursesSearchDraft = ref<string>(adminStore.coursesFilters.search);

const debounceUsersSearch = createDebouncer(350);
const debounceCoursesSearch = createDebouncer(350);

watch(
  () => adminStore.usersFilters.search,
  (nextSearch) => {
    if (nextSearch !== usersSearchDraft.value) {
      usersSearchDraft.value = nextSearch;
    }
  },
);

watch(
  () => adminStore.coursesFilters.search,
  (nextSearch) => {
    if (nextSearch !== coursesSearchDraft.value) {
      coursesSearchDraft.value = nextSearch;
    }
  },
);

watch(usersSearchDraft, (nextSearch) => {
  if (!isUsersActive.value) {
    return;
  }

  debounceUsersSearch(() => {
    adminStore.setUsersSearch(nextSearch);
    void adminStore.fetchUsers();
  });
});

watch(coursesSearchDraft, (nextSearch) => {
  if (!isCoursesActive.value) {
    return;
  }

  debounceCoursesSearch(() => {
    adminStore.setCoursesSearch(nextSearch);
    void adminStore.fetchCourses();
  });
});

watch(
  () => [
    adminStore.usersFilters.role,
    adminStore.usersFilters.status,
    adminStore.usersFilters.lastLoginFrom,
    adminStore.usersFilters.lastLoginTo,
    adminStore.usersFilters.page,
    adminStore.usersFilters.limit,
  ],
  () => {
    if (!isUsersActive.value) {
      return;
    }

    void adminStore.fetchUsers();
  },
);

watch(
  () => [adminStore.coursesFilters.page, adminStore.coursesFilters.limit],
  () => {
    if (!isCoursesActive.value) {
      return;
    }

    void adminStore.fetchCourses();
  },
);

watch(
  () => activeSection.value,
  (section) => {
    if (section === 'users') {
      void ensureUsersLoaded();
    }

    if (section === 'courses') {
      void ensureCoursesLoaded();
    }
  },
);

const onUsersSearchInput = (value: string): void => {
  usersSearchDraft.value = value;
};

const onCoursesSearchInput = (value: string): void => {
  coursesSearchDraft.value = value;
};

onMounted(async () => {
  const normalizedSection = parseAdminDashboardSection(route.query.tab);

  if (!normalizedSection) {
    await router.replace({
      path: '/admin',
      query: {
        ...route.query,
        tab: 'users',
      },
    });
  }

  await adminStore.fetchStats();

  if (activeSection.value === 'courses') {
    await ensureCoursesLoaded();
    return;
  }

  await ensureUsersLoaded();
});
</script>

<template>
  <div class="container">
    <div :class="$style.layout">
      <main :class="$style.main">
        <header class="card">
          <div class="card__body">
          <h1 :class="$style.title">Admin panel</h1>
            <p class="muted">
              Manage the system: users, courses, notifications, and messages.
            </p>
          </div>
        </header>

        <div class="stack">
          <AdminUsersPanel
            v-if="isUsersActive"
            :items="adminStore.users"
            :total="adminStore.usersTotal"
            :loading="adminStore.usersLoading"
            :error="adminStore.usersError"
            :search="usersSearchDraft"
            :role="adminStore.usersFilters.role"
            :status="adminStore.usersFilters.status"
            :last-login-from="adminStore.usersFilters.lastLoginFrom"
            :last-login-to="adminStore.usersFilters.lastLoginTo"
            :page="adminStore.usersFilters.page"
            :limit="adminStore.usersFilters.limit"
            :role-busy-by-user-id="adminStore.roleChangeBusyByUserId"
            :force-logout-busy-by-user-id="adminStore.forceLogoutBusyByUserId"
            :last-action-ok="adminStore.lastActionOk"
            @update:search="onUsersSearchInput"
            @update:role="adminStore.setUsersRole"
            @update:status="adminStore.setUsersStatus"
            @update:lastLoginFrom="adminStore.setUsersLastLoginFrom"
            @update:lastLoginTo="adminStore.setUsersLastLoginTo"
            @update:page="adminStore.setUsersPage"
            @update:limit="adminStore.setUsersLimit"
            @refresh="adminStore.fetchUsers"
            @changeRole="adminStore.changeUserRole"
            @requestForceLogout="onRequestForceLogout"
            @dismissOk="adminStore.clearLastActionOk"
          />

          <AdminCoursesPanel
            v-else-if="isCoursesActive"
            :items="adminStore.courses"
            :total="adminStore.coursesTotal"
            :loading="adminStore.coursesLoading"
            :error="adminStore.coursesError"
            :search="coursesSearchDraft"
            :page="adminStore.coursesFilters.page"
            :limit="adminStore.coursesFilters.limit"
            @update:search="onCoursesSearchInput"
            @update:page="adminStore.setCoursesPage"
            @update:limit="adminStore.setCoursesLimit"
            @refresh="adminStore.fetchCourses"
          />

          <AdminSendNotificationPanel
            v-else-if="isNotificationsActive"
            :target="adminStore.notificationForm.target"
            :role="adminStore.notificationForm.role"
            :user-id="adminStore.notificationForm.userId"
            :title="adminStore.notificationForm.title"
            :message="adminStore.notificationForm.message"
            :href="adminStore.notificationForm.href"
            :busy="adminStore.notificationBusy"
            :error="adminStore.notificationError"
            :ok="adminStore.notificationOk"
            @update:target="adminStore.setNotificationTarget"
            @update:role="adminStore.setNotificationRole"
            @update:userId="adminStore.setNotificationUserId"
            @update:title="adminStore.setNotificationTitle"
            @update:message="adminStore.setNotificationMessage"
            @update:href="adminStore.setNotificationHref"
            @submit="adminStore.sendNotification"
          />

          <AdminSendMessagePanel
            v-else-if="isMessagesActive"
            :target="adminStore.messageForm.target"
            :role="adminStore.messageForm.role"
            :mode="adminStore.messageForm.mode"
            :user-id="adminStore.messageForm.userId"
            :body="adminStore.messageForm.body"
            :busy="adminStore.messageBusy"
            :error="adminStore.messageError"
            :ok="adminStore.messageOk"
            @update:target="adminStore.setMessageTarget"
            @update:role="adminStore.setMessageRole"
            @update:mode="adminStore.setMessageMode"
            @update:userId="adminStore.setMessageUserId"
            @update:body="adminStore.setMessageBody"
            @submit="onAdminSendMessage"
          />

          <div v-else class="card">
            <div class="card__body">
              <p class="muted">Unknown admin dashboard section.</p>
            </div>
          </div>
        </div>
      </main>

      <aside :class="$style.sidebar">
        <AdminQuickActionsCard
          :active-section="activeSection"
          @select="setActiveSection"
        />

        <AdminStatsCard
          :stats="adminStore.stats"
          :loading="adminStore.statsLoading"
          :error="adminStore.statsError"
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
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.title {
  font-size: var(--text-2xl);
  line-height: 1.15;
  letter-spacing: var(--tracking-tight);
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>




