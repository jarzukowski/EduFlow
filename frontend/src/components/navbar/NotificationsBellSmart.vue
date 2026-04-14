<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import NotificationsDropdown from './NotificationsDropdown.vue';

import { useNotificationsStore } from '@/stores/notifications.store';

const router = useRouter();
const route = useRoute();
const notificationsStore = useNotificationsStore();

const isOpen = ref<boolean>(false);
const rootElement = ref<HTMLElement | null>(null);
const prefersReducedMotion = ref<boolean>(false);

type PollingHandle = ReturnType<typeof window.setInterval>;

const pollTimer = ref<PollingHandle | null>(null);

const showShake = computed<boolean>(
  () => notificationsStore.shouldShake && !prefersReducedMotion.value,
);

const triggerAriaLabel = computed<string>(() => {
  if (notificationsStore.unreadCount > 0) {
    return `Notifications. Unread: ${notificationsStore.unreadCount}`;
  }

  return 'Notifications';
});

const close = (): void => {
  isOpen.value = false;
};

const open = async (): Promise<void> => {
  if (isOpen.value) {
    return;
  }

  isOpen.value = true;
  notificationsStore.markBellOpenedNow();

  await notificationsStore.fetchNotifications({
    unreadOnly: true,
    limit: 20,
  });
};

const toggle = async (): Promise<void> => {
  if (isOpen.value) {
    close();
    return;
  }

  await open();
};

const startPolling = (): void => {
  if (pollTimer.value) {
    return;
  }

  pollTimer.value = window.setInterval(async () => {
    if (document.hidden || isOpen.value) {
      return;
    }

    await notificationsStore.fetchNotifications({
      unreadOnly: true,
      limit: 10,
    });
  }, 15_000);
};

const stopPolling = (): void => {
  if (!pollTimer.value) {
    return;
  }

  window.clearInterval(pollTimer.value);
  pollTimer.value = null;
};

const onDocumentPointerDown = (event: PointerEvent): void => {
  if (!isOpen.value) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Node)) {
    return;
  }

  const root = rootElement.value;

  if (!root) {
    return;
  }

  if (!root.contains(target)) {
    close();
  }
};

const onDocumentKeyDown = (event: KeyboardEvent): void => {
  if (!isOpen.value) {
    return;
  }

  if (event.key === 'Escape') {
    close();
  }
};

const onOpenNotification = async (href: string | null): Promise<void> => {
  close();

  if (!href) {
    return;
  }

  await router.push(href);
};

let reducedMotionMediaQuery: MediaQueryList | null = null;

const syncReducedMotion = (): void => {
  if (!reducedMotionMediaQuery) {
    return;
  }

  prefersReducedMotion.value = reducedMotionMediaQuery.matches;
};

const initReducedMotion = (): void => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }

  reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncReducedMotion();
  reducedMotionMediaQuery.addEventListener('change', syncReducedMotion);
};

const cleanupReducedMotion = (): void => {
  if (!reducedMotionMediaQuery) {
    return;
  }

  reducedMotionMediaQuery.removeEventListener('change', syncReducedMotion);
  reducedMotionMediaQuery = null;
};

onMounted(async () => {
  initReducedMotion();

  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeyDown);

  await notificationsStore.fetchNotifications({
    unreadOnly: true,
    limit: 10,
  });

  startPolling();
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeyDown);

  stopPolling();
  cleanupReducedMotion();
});

watch(
  () => route.fullPath,
  () => {
    close();
  },
);
</script>

<template>
  <div ref="rootElement" :class="$style.root">
    <button
      type="button"
      :class="[$style.trigger, showShake ? $style.triggerShake : null]"
      :aria-label="triggerAriaLabel"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span :class="$style.icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.7V3.5a2 2 0 1 0-4 0v.8A7 7 0 0 0 5 11v5l-1.2 1.2A1 1 0 0 0 4.5 19h15a1 1 0 0 0 .7-1.8L19 16Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <span
        v-if="notificationsStore.unreadCount > 0"
        :class="$style.badge"
        aria-hidden="true"
      >
        {{ notificationsStore.unreadCount }}
      </span>
    </button>

    <NotificationsDropdown
      v-if="isOpen"
      :items="notificationsStore.items"
      :busy="notificationsStore.busy"
      :error="notificationsStore.error"
      :has-more="notificationsStore.hasMore"
      @close="close"
      @open="onOpenNotification"
      @mark-read="notificationsStore.markRead"
      @mark-all-read="notificationsStore.markAllRead"
      @refresh="() => notificationsStore.fetchNotifications({ unreadOnly: true, limit: 20 })"
      @load-more="notificationsStore.loadMore"
    />
  </div>
</template>

<style module>
.root {
  position: relative;
}

.trigger {
  position: relative;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.trigger:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.trigger:active {
  transform: translateY(0);
}

.icon {
  display: inline-flex;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary-ink);
  background: linear-gradient(135deg, var(--color-primary-2), var(--color-primary));
  box-shadow: 0 14px 40px rgba(109, 94, 252, 0.22);
}

@keyframes bell-shake-loop {
  0% {
    transform: rotate(0deg);
  }

  6% {
    transform: rotate(-10deg);
  }

  12% {
    transform: rotate(10deg);
  }

  18% {
    transform: rotate(-8deg);
  }

  24% {
    transform: rotate(8deg);
  }

  30% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.triggerShake .icon {
  transform-origin: 50% 20%;
  animation: bell-shake-loop 2200ms var(--ease-out) 0ms infinite;
}

@media (max-width: 768px) {
  .icon svg {
    width: 16px;
    height: 16px;
  }
}
</style>




