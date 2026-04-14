<script setup lang="ts">
import NotificationItem from './NotificationItem.vue';

import type { NotificationDTO } from '@/types/notifications.types';

type Props = {
  items: NotificationDTO[];
  busy: boolean;
  error: string | null;
  hasMore: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open', href: string | null): void;
  (e: 'mark-read', id: string): void;
  (e: 'mark-all-read'): void;
  (e: 'refresh'): void;
  (e: 'load-more'): void;
}>();

const onItemClick = (notification: NotificationDTO): void => {
  if (!notification.readAt) {
    emit('mark-read', notification.id);
  }

  emit('open', notification.href);
};

const onMarkAllRead = (): void => {
  if (props.busy) {
    return;
  }

  emit('mark-all-read');
};

const onRefresh = (): void => {
  if (props.busy) {
    return;
  }

  emit('refresh');
};

const onLoadMore = (): void => {
  if (props.busy) {
    return;
  }

  emit('load-more');
};

const onClose = (): void => {
  emit('close');
};
</script>

<template>
  <div :class="$style.panel" role="dialog" aria-label="Notifications">
    <div :class="$style.header">
      <div :class="$style.title">Notifications</div>

      <div :class="$style.actions">
        <button
          type="button"
          class="iconButton"
          aria-label="Refresh notifications"
          title="Refresh"
          :disabled="props.busy"
          @click="onRefresh"
        >
          <svg class="iconSvg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 12a9 9 0 1 1-3-6.7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
            <polyline
              points="21 3 21 9 15 9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </button>

        <button
          type="button"
          class="iconButton"
          aria-label="Mark all notifications as read"
          title="Mark all as read"
          :disabled="props.busy || props.items.length === 0"
          @click="onMarkAllRead"
        >
          <svg class="iconSvg" viewBox="0 0 24 24" aria-hidden="true">
            <polyline
              points="5 13 9 17 19 7"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </button>

        <button
          type="button"
          class="iconButton"
          aria-label="Close notifications"
          title="Close"
          @click="onClose"
        >
          <svg class="iconSvg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="props.error" :class="$style.error" role="status">
      {{ props.error }}
    </div>

    <div
      v-if="props.busy && props.items.length === 0"
      :class="$style.skeletonList"
      aria-busy="true"
      aria-live="polite"
    >
      <div v-for="index in 6" :key="index" :class="$style.skeletonRow" />
    </div>

    <div v-else-if="props.items.length === 0" :class="$style.empty">
      No notifications.
    </div>

    <ul v-else :class="[$style.list, 'scrollArea']" role="list">
      <li v-for="item in props.items" :key="item.id">
        <NotificationItem
          :item="item"
          @click="onItemClick(item)"
          @mark-read="emit('mark-read', item.id)"
        />
      </li>

      <li v-if="props.busy" :class="$style.inlineBusy" aria-live="polite">
        Loading...
      </li>
    </ul>

    <div v-if="props.hasMore" :class="$style.footer">
      <button
        type="button"
        class="btn btn--ghost"
        :class="$style.footerButton"
        :disabled="props.busy"
        @click="onLoadMore"
      >
        Load older
      </button>
    </div>
  </div>
</template>

<style module>
.panel {
  position: fixed;
  top: calc(var(--app-navbar-height) + 10px);
  right: 12px;
  left: 12px;
  z-index: var(--z-overlay);
  width: min(420px, calc(100vw - 24px));
  max-height: min(70vh, calc(100dvh - 140px));
  margin-left: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.header {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.03);
}

.title {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.error {
  flex-shrink: 0;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 107, 107, 0.1);
  color: rgba(255, 180, 180, 0.95);
}

.list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0;
  padding: var(--space-3);
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.inlineBusy {
  padding: 10px 6px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.footer {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
}

.footerButton {
  min-height: 38px;
  padding: 8px 12px;
  border-radius: var(--radius-pill);
}

.empty {
  padding: var(--space-5);
  color: var(--color-text-muted);
}

.skeletonList {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}

.skeletonRow {
  height: 64px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
}

@media (max-width: 360px) {
  .actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>




