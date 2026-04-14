<script setup lang="ts">
import { computed } from 'vue';

import type { InboxItemDTO } from '@/types/messages.types';

type Props = {
  items: InboxItemDTO[];
  selectedId: string | null;
  busy: boolean;
  error: string | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'select', conversationId: string): void;
  (event: 'refresh'): void;
}>();

const hasItems = computed<boolean>(() => props.items.length > 0);

const getTitle = (item: InboxItemDTO): string => {
  const title = item.title.trim();

  if (title.length > 0) {
    return title;
  }

  return 'Conversation';
};

const getPreview = (item: InboxItemDTO): string => {
  const preview = item.lastMessagePreview?.trim();

  if (preview && preview.length > 0) {
    return preview;
  }

  return 'No messages';
};

const onSelect = (conversationId: string): void => {
  emit('select', conversationId);
};

const onRefreshClick = (): void => {
  emit('refresh');
};
</script>

<template>
  <div :class="$style.panel">
    <div :class="$style.header">
      <div :class="$style.title">Inbox</div>

      <button
        type="button"
        class="btn btn--ghost"
        @click="onRefreshClick"
      >
        Refresh
      </button>
    </div>

    <div v-if="busy" :class="$style.state">
      Loading...
    </div>

    <div v-else-if="error" :class="$style.error">
      {{ error }}
    </div>

    <p v-else-if="!hasItems" :class="$style.empty">
      No conversations.
    </p>

    <ul v-else :class="[$style.list, 'scrollArea']">
      <li
        v-for="item in items"
        :key="item.conversationId"
        :class="[
          $style.row,
          item.conversationId === selectedId ? $style.rowActive : null,
          item.unreadCount > 0 ? $style.rowUnread : null,
        ]"
      >
        <button
          type="button"
          :class="$style.rowButton"
          @click="onSelect(item.conversationId)"
        >
          <div :class="$style.titleRow">
            <span :class="$style.courseTitle">
              {{ getTitle(item) }}
            </span>

            <span v-if="item.unreadCount > 0" :class="$style.unread">
              {{ item.unreadCount }}
            </span>
          </div>

          <div :class="$style.preview">
            {{ getPreview(item) }}
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<style module>
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
}

.state {
  padding: var(--space-4);
  color: var(--color-text-muted);
}

.error {
  padding: var(--space-4);
  color: var(--color-danger);
}

.empty {
  margin: 0;
  padding: var(--space-4);
  color: var(--color-text-muted);
}

.list {
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.row {
  border-bottom: 1px solid var(--color-border);
}

.rowButton {
  width: 100%;
  padding: var(--space-4);
  border: 0;
  background: transparent;
  text-align: left;
}

.rowButton:hover {
  background: rgba(255, 255, 255, 0.04);
}

.rowActive {
  background: rgba(109, 94, 252, 0.12);
}

.rowUnread {
  background: rgba(109, 94, 252, 0.08);
}

.titleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.courseTitle {
  font-weight: 800;
  overflow-wrap: anywhere;
}

.unread {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-size: 12px;
  font-weight: 800;
}

.preview {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>



