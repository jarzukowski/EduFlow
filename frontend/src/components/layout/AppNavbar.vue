<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import UserMenuDropdown from './UserMenuDropdown.vue';
import MobileNavDrawer, { type MobileNavItem } from './MobileNavDrawer.vue';

import MessagesButtonSmart from '@/components/navbar/MessagesButtonSmart.vue';
import NotificationsBellSmart from '@/components/navbar/NotificationsBellSmart.vue';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isAdmin = computed<boolean>(() => authStore.userRole === 'ADMIN');
const isTeacher = computed<boolean>(() => authStore.userRole === 'TEACHER');
const isStudent = computed<boolean>(() => authStore.userRole === 'STUDENT');
const isTeacherOrAdmin = computed<boolean>(() => isTeacher.value || isAdmin.value);

const isDrawerOpen = ref<boolean>(false);

const closeDrawer = (): void => {
  isDrawerOpen.value = false;
};

const toggleDrawer = (): void => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

const goHome = async (): Promise<void> => {
  await router.push({ name: 'home' });
};

const goCourses = async (): Promise<void> => {
  await router.push({ name: 'courses' });
};

const goAdminPanel = async (): Promise<void> => {
  if (!isAdmin.value) {
    return;
  }

  await router.push({ name: 'admin-dashboard' });
};

const goPrimaryPanel = async (): Promise<void> => {
  if (isTeacherOrAdmin.value) {
    await router.push({ name: 'teacher-panel' });
    return;
  }

  if (isStudent.value) {
    await router.push({ name: 'student-panel' });
  }
};

const logoutFromNavbar = async (): Promise<void> => {
  await authStore.logout();

  await router.replace({
    name: 'auth',
    query: { mode: 'signin' },
  });
};

const panelLabel = computed<string>(() => {
  if (isTeacherOrAdmin.value) {
    return 'Teacher dashboard';
  }

  if (isStudent.value) {
    return 'Student dashboard';
  }

  return 'Panel';
});

const isHomeActive = computed<boolean>(() => route.path === '/');

const isActivePrefix = (prefix: string): boolean =>
  route.path === prefix || route.path.startsWith(`${prefix}/`);

const drawerItems = computed<MobileNavItem[]>(() => {
  const items: MobileNavItem[] = [
    {
      key: 'home',
      label: 'Home',
      active: isHomeActive.value,
    },
    {
      key: 'courses',
      label: 'Courses',
      active: isActivePrefix('/courses'),
    },
  ];

  if (authStore.userRole) {
    items.push({
      key: 'panel',
      label: panelLabel.value,
      active: isTeacherOrAdmin.value
        ? isActivePrefix('/teacher')
        : isActivePrefix('/student'),
    });
  }

  if (isAdmin.value) {
    items.push({
      key: 'admin',
      label: 'Admin panel',
      active: isActivePrefix('/admin'),
    });
  }

  if (authStore.userRole) {
    items.push({
      key: 'sessions',
      label: 'Sessions',
      active: isActivePrefix('/sessions'),
    });

    items.push({
      key: 'messages',
      label: 'Messages',
      active: isActivePrefix('/messages'),
    });

    items.push({
      key: 'logout',
      label: 'Sign out',
      tone: 'danger',
    });
  }

  return items;
});

const handleDrawerNavigate = async (key: string): Promise<void> => {
  closeDrawer();

  switch (key) {
    case 'home':
      await goHome();
      return;
    case 'courses':
      await goCourses();
      return;
    case 'panel':
      await goPrimaryPanel();
      return;
    case 'admin':
      await goAdminPanel();
      return;
    case 'sessions':
      await router.push({ name: 'sessions' });
      return;
    case 'messages':
      await router.push({ name: 'messages' });
      return;
    case 'logout':
      await logoutFromNavbar();
      return;
    default:
      return;
  }
};

watch(
  () => route.fullPath,
  () => {
    closeDrawer();
  },
);
</script>

<template>
  <header :class="$style.navbar">
    <div :class="$style.left">
      <button
        type="button"
        :class="$style.hamburger"
        aria-label="Open menu"
        aria-haspopup="dialog"
        :aria-expanded="isDrawerOpen"
        @click="toggleDrawer"
      >
        <span aria-hidden="true">☰</span>
      </button>

      <button
        type="button"
        :class="$style.brand"
        aria-label="Go to home page"
        @click="goHome"
      >
        EduFlow
      </button>
    </div>

    <nav :class="$style.navCenter" aria-label="Main navigation">
      <button
        type="button"
        :class="$style.navLink"
        :data-active="isActivePrefix('/courses')"
        @click="goCourses"
      >
        Courses
      </button>

      <button
        v-if="isAdmin"
        type="button"
        :class="$style.navLink"
        :data-active="isActivePrefix('/admin')"
        aria-label="Admin panel"
        title="Admin panel"
        @click="goAdminPanel"
      >
        Admin panel
      </button>

      <button
        v-if="authStore.userRole"
        type="button"
        :class="$style.navLink"
        :data-active="isTeacherOrAdmin ? isActivePrefix('/teacher') : isActivePrefix('/student')"
        @click="goPrimaryPanel"
      >
        {{ panelLabel }}
      </button>
    </nav>

    <div :class="$style.navRight">
      <MessagesButtonSmart />
      <NotificationsBellSmart />
      <UserMenuDropdown />
    </div>

    <MobileNavDrawer
      :open="isDrawerOpen"
      title="Menu"
      :items="drawerItems"
      @close="closeDrawer"
      @navigate="handleDrawerNavigate"
    />
  </header>
</template>

<style module>
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);

  width: 100%;
  min-height: var(--app-navbar-height);

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;

  padding: 10px 24px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(13, 18, 36, 0.72);
  backdrop-filter: blur(10px);
}

.left {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.brand {
  justify-self: start;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
}

.navCenter {
  justify-self: center;
  display: flex;
  gap: var(--space-2);
}

.navLink {
  min-height: 44px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.06);
  padding: 10px 14px;
  color: rgba(245, 246, 255, 0.86);
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.navLink:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.navLink:active {
  transform: translateY(0);
}

.navLink[data-active='true'] {
  color: var(--color-text);
  border-color: rgba(245, 246, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.navRight {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.hamburger {
  display: none;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
}

.hamburger:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
  .navbar {
    grid-template-columns: 1fr auto;
    padding: 10px 14px;
  }

  .hamburger {
    display: inline-flex;
  }

  .navCenter {
    display: none;
  }

  .brand {
    font-size: 15px;
  }

  .navRight {
    gap: var(--space-1);
  }
}
</style>





