<script setup lang="ts">
import { computed } from 'vue';

import type { NotificationDTO } from '@/types/notifications.types';
import { formatTimeAgo } from '@/utils/timeAgo';

type Props = {
  item: NotificationDTO;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'mark-read'): void;
}>();

const isUnread = computed<boolean>(() => props.item.readAt === null);
</script>

<template>
  <div :class="[$style.row, isUnread ? $style.unread : null]">
    <button type="button" :class="$style.content" @click="emit('click')">
      <div :class="$style.top">
        <div :class="$style.title">{{ item.title }}</div>
        <div :class="$style.time">{{ formatTimeAgo(item.createdAt) }}</div>
      </div>

      <div :class="$style.body">
        {{ item.body }}
      </div>
    </button>

    <button
      v-if="isUnread"
      type="button"
      :class="$style.readButton"
      aria-label="Mark as read"
      @click.stop="emit('mark-read')"
    >
      ✓
    </button>
  </div>
</template>

<style module>
.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.unread {
  background: rgba(47, 139, 255, 0.08);
  border-color: rgba(47, 139, 255, 0.22);
}

.content {
  width: 100%;
  padding: var(--space-3);
  border: 0;
  background: transparent;
  text-align: left;
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.title {
  font-size: var(--text-sm);
  font-weight: 750;
  letter-spacing: var(--tracking-tight);
}

.time {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.body {
  margin-top: 6px;
  color: rgba(245, 246, 255, 0.78);
  font-size: var(--text-sm);
  line-height: 1.35;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.readButton {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-left: 1px solid var(--color-border);
  background: transparent;
  color: rgba(245, 246, 255, 0.88);
}

.readButton:hover {
  background: rgba(255, 255, 255, 0.06);
}
</style>

