<script setup lang="ts">
import { computed } from 'vue';

import type { InboxItemDTO } from '@/types/messages.types';

type Props = {
  items: InboxItemDTO[];
  busy: boolean;
  error: string | null;
  hasMore?: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'refresh'): void;
  (e: 'open-conversation', conversationId: string): void;
  (e: 'open-inbox'): void;
  (e: 'load-more'): void;
}>();

const hasItems = computed<boolean>(() => props.items.length > 0);
const showLoadMore = computed<boolean>(() => props.hasMore === true);

const onOpenConversation = (conversationId: string): void => {
  emit('open-conversation', conversationId);
};

const formatTitle = (value: string): string => {
  const normalizedValue = value.trim();

  if (normalizedValue.length > 0) {
    return normalizedValue;
  }

  return 'Message';
};

const formatPreview = (value: string | null): string => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return 'No messages';
  }

  return normalizedValue.length > 90
    ? `${normalizedValue.slice(0, 90)}…`
    : normalizedValue;
};

const formatParticipantsLine = (participants: InboxItemDTO['participants']): string => {
  if (participants.length === 0) {
    return 'Private message';
  }

  const emails = participants
    .map((participant) => participant.email.trim())
    .filter((email) => email.length > 0);

  if (emails.length === 0) {
    return 'Private message';
  }

  const visibleEmails = emails.slice(0, 2);
  const remainingCount = emails.length - visibleEmails.length;

  return remainingCount > 0
    ? `${visibleEmails.join(' ↔ ')} +${remainingCount}`
    : visibleEmails.join(' ↔ ');
};

const formatContextLine = (item: InboxItemDTO): string => {
  const courseTitle = item.course?.title.trim();

  if (courseTitle && courseTitle.length > 0) {
    return courseTitle;
  }

  return 'Private message';
};

const onRefresh = (): void => {
  if (!props.busy) {
    emit('refresh');
  }
};

const onOpenInbox = (): void => {
  emit('open-inbox');
};

const onClose = (): void => {
  emit('close');
};

const onLoadMore = (): void => {
  if (!props.busy) {
    emit('load-more');
  }
};
</script>

<template>
  <div :class="$style.panel" role="dialog" aria-label="Messages">
    <div :class="$style.header">
      <div :class="$style.title">Messages</div>

      <div :class="$style.actions">
        <button
          type="button"
          class="iconButton"
          aria-label="Refresh messages"
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
          class="iconButtonPrimary"
          aria-label="Open message inbox"
          title="Inbox"
          @click="onOpenInbox"
        >
          <svg class="iconSvg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4.5 7.5A3 3 0 0 1 7.5 4.5h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
              fill="none"
            />
            <path
              d="M6.5 8.5 12 12.5l5.5-4"
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
          aria-label="Close messages"
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

    <div
      v-if="props.busy && props.items.length === 0"
      :class="$style.state"
      aria-busy="true"
    >
      Loading...
    </div>

    <div v-else-if="props.error" :class="$style.stateError" role="status">
      {{ props.error }}
    </div>

    <div v-else-if="!hasItems" :class="$style.stateMuted">
      No conversations.
    </div>

    <ul v-else :class="[$style.list, 'scrollArea']" role="list">
      <li
        v-for="item in props.items"
        :key="item.conversationId"
        :class="[$style.row, item.unreadCount > 0 ? $style.rowUnread : null]"
      >
        <button
          type="button"
          :class="$style.rowButton"
          @click="onOpenConversation(item.conversationId)"
        >
          <span :class="$style.rowTop">
            <span :class="$style.conversationTitle">
              {{ formatTitle(item.title) }}
            </span>

            <span v-if="item.unreadCount > 0" :class="$style.unreadPill">
              {{ item.unreadCount }}
            </span>
          </span>

          <span :class="$style.rowMiddle">
            <span :class="$style.meta">
              {{ formatParticipantsLine(item.participants) }}
            </span>

            <span :class="$style.metaSecondary">
              {{ formatContextLine(item) }}
            </span>
          </span>

          <span :class="$style.preview">
            {{ formatPreview(item.lastMessagePreview) }}
          </span>
        </button>
      </li>

      <li
        v-if="props.busy && props.items.length > 0"
        :class="$style.inlineBusy"
        aria-live="polite"
      >
        Loading...
      </li>
    </ul>

    <div v-if="showLoadMore" :class="$style.footer">
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
  top: calc(var(--app-navbar-height, 64px) + 10px);
  right: 12px;
  left: 12px;
  z-index: var(--z-overlay);
  width: min(420px, calc(100vw - 24px));
  max-height: min(520px, calc(100dvh - 120px));
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
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.state,
.stateError,
.stateMuted {
  padding: var(--space-4);
}

.stateError {
  color: rgba(255, 170, 170, 0.95);
}

.stateMuted {
  color: var(--color-text-muted);
}

.list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  border-bottom: 1px solid var(--color-border);
}

.rowUnread {
  background: rgba(109, 94, 252, 0.08);
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

.rowTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.conversationTitle {
  display: block;
  line-height: 1.25;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.unreadPill {
  min-width: 24px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-primary-2), var(--color-primary));
  color: var(--color-primary-ink);
  box-shadow: 0 14px 40px rgba(109, 94, 252, 0.18);
  font-size: 12px;
  font-weight: 800;
}

.rowMiddle {
  display: block;
  margin-top: 6px;
}

.meta {
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
}

.metaSecondary {
  display: block;
  margin-top: 2px;
  color: rgba(245, 246, 255, 0.72);
  font-size: 12px;
}

.preview {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 10px;
  color: rgba(245, 246, 255, 0.86);
  font-size: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.inlineBusy {
  padding: 10px 12px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.footer {
  display: flex;
  justify-content: center;
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.footerButton {
  min-height: 38px;
  padding: 8px 12px;
  border-radius: var(--radius-pill);
}

@media (max-width: 360px) {
  .actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>




