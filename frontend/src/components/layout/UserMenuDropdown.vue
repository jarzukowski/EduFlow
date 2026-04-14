<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isMenuOpen = ref<boolean>(false);
const menuRootElement = ref<HTMLElement | null>(null);

const userEmail = computed<string>(() => authStore.user?.email ?? '');

const userRoleLabel = computed<string>(() => {
  const role = authStore.userRole;

  if (!role) {
    return '';
  }

  if (role === 'ADMIN') {
    return 'ADMIN';
  }

  if (role === 'TEACHER') {
    return 'TEACHER';
  }

  return 'STUDENT';
});

const closeMenu = (): void => {
  isMenuOpen.value = false;
};

const toggleMenu = (): void => {
  isMenuOpen.value = !isMenuOpen.value;
};

const navigateToSessions = async (): Promise<void> => {
  closeMenu();
  await router.push({ name: 'sessions' });
};

const navigateToMessages = async (): Promise<void> => {
  closeMenu();
  await router.push({ name: 'messages' });
};

const logoutUser = async (): Promise<void> => {
  closeMenu();

  await authStore.logout();

  await router.replace({
    name: 'auth',
    query: { mode: 'signin' },
  });
};

const onDocumentPointerDown = (event: PointerEvent): void => {
  if (!isMenuOpen.value) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Node)) {
    return;
  }

  const rootElement = menuRootElement.value;

  if (!rootElement) {
    return;
  }

  if (!rootElement.contains(target)) {
    closeMenu();
  }
};

const onDocumentKeyDown = (event: KeyboardEvent): void => {
  if (!isMenuOpen.value) {
    return;
  }

  if (event.key === 'Escape') {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeyDown);
});

watch(
  () => route.fullPath,
  () => {
    closeMenu();
  },
);
</script>

<template>
  <div ref="menuRootElement" :class="$style.menuRoot">
    <button
      type="button"
      :class="$style.menuTrigger"
      aria-haspopup="menu"
      :aria-expanded="isMenuOpen"
      aria-controls="user-menu-panel"
      @click="toggleMenu"
    >
      <span class="sr-only">User menu</span>

      <span aria-hidden="true" :class="$style.menuIcon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M4.5 20a7.5 7.5 0 0 1 15 0"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </span>
    </button>

    <div
      v-if="isMenuOpen"
      id="user-menu-panel"
      :class="$style.menuPanel"
      role="menu"
      aria-label="User menu"
    >
      <div :class="$style.menuUser">
        <div :class="$style.menuEmail">{{ userEmail }}</div>
        <div :class="$style.menuRole">{{ userRoleLabel }}</div>
      </div>

      <button
        type="button"
        role="menuitem"
        :class="$style.menuItem"
        @click="navigateToSessions"
      >
        Sessions
      </button>

      <button
        type="button"
        role="menuitem"
        :class="$style.menuItem"
        @click="navigateToMessages"
      >
        Messages
      </button>

      <button
        type="button"
        role="menuitem"
        :class="[$style.menuItem, $style.menuItemDanger]"
        @click="logoutUser"
      >
        Sign out
      </button>
    </div>
  </div>
</template>

<style module>
.menuRoot {
  position: relative;
}

.menuTrigger {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.menuTrigger:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.menuTrigger:active {
  transform: translateY(0);
}

.menuIcon {
  display: inline-flex;
}

.menuPanel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: var(--z-overlay);
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(12px);
}

.menuUser {
  margin-bottom: 2px;
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.menuEmail {
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 650;
  word-break: break-word;
}

.menuRole {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.menuItem {
  min-height: 44px;
  padding: 10px 12px;
  text-align: left;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.menuItem:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.menuItem:active {
  transform: translateY(0);
}

.menuItemDanger {
  border-color: rgba(255, 107, 107, 0.3);
  background: var(--color-danger-soft);
  color: rgba(255, 170, 170, 0.95);
}
</style>




