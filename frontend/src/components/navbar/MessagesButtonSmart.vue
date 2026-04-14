<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MessagesDropdown from './MessagesDropdown.vue';
import MessagesQuickViewModal from './MessagesQuickViewModal.vue';

import { useMessagesStore } from '@/stores/messages.store';

const router = useRouter();
const route = useRoute();
const messagesStore = useMessagesStore();

const isOpen = ref<boolean>(false);
const rootElement = ref<HTMLElement | null>(null);
const quickViewConversationId = ref<string | null>(null);

const hasUnread = computed<boolean>(() => messagesStore.inboxUnreadCount > 0);

const closeQuickView = (): void => {
  quickViewConversationId.value = null;
};

const closeDropdown = (): void => {
  isOpen.value = false;
};

const closeAllOverlays = (): void => {
  closeDropdown();
  closeQuickView();
};

const openQuickView = async (conversationId: string): Promise<void> => {
  closeDropdown();
  quickViewConversationId.value = conversationId;
  await messagesStore.fetchConversation(conversationId);
};

const toggle = async (): Promise<void> => {
  if (isOpen.value) {
    closeDropdown();
    return;
  }

  isOpen.value = true;

  await messagesStore.fetchInbox({
    limit: 20,
  });
};

const onDocumentPointerDown = (event: PointerEvent): void => {
  if (!isOpen.value) {
    return;
  }

  const targetNode = event.target;

  if (!(targetNode instanceof Node)) {
    return;
  }

  const rootNode = rootElement.value;

  if (!rootNode) {
    return;
  }

  if (!rootNode.contains(targetNode)) {
    closeAllOverlays();
  }
};

const onDocumentKeyDown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') {
    return;
  }

  if (quickViewConversationId.value) {
    closeQuickView();
    return;
  }

  closeDropdown();
};

const goToMessages = async (): Promise<void> => {
  closeAllOverlays();
  await router.push({ name: 'messages' });
};

const goToMessagesWithConversation = async (
  conversationId: string,
): Promise<void> => {
  closeAllOverlays();

  await router.push({
    name: 'messages',
    query: {
      ...route.query,
      c: conversationId,
    },
  });
};

const handleOpenInboxFromQuickView = async (): Promise<void> => {
  const conversationId = quickViewConversationId.value;

  if (conversationId) {
    await goToMessagesWithConversation(conversationId);
    return;
  }

  await goToMessages();
};

onMounted(async () => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeyDown);

  await messagesStore.fetchInbox({ limit: 10 });
  messagesStore.startPolling({ intervalMs: 20_000 });
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeyDown);

  messagesStore.stopPolling();
});

watch(
  () => route.fullPath,
  () => {
    closeAllOverlays();
  },
);
</script>

<template>
  <div ref="rootElement" :class="$style.root">
    <button
      type="button"
      :class="$style.trigger"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span :class="$style.icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path
            d="M5.5 7.5 12 12l6.5-4.5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <span
        v-if="hasUnread"
        :class="$style.badge"
        aria-label="Unread messages"
      >
        {{ messagesStore.inboxUnreadCount }}
      </span>
    </button>

    <MessagesDropdown
      v-if="isOpen"
      :items="messagesStore.inboxItems"
      :busy="messagesStore.inboxBusy"
      :error="messagesStore.inboxError"
      :has-more="messagesStore.inboxHasMore"
      @close="closeAllOverlays"
      @open-conversation="openQuickView"
      @open-inbox="goToMessages"
      @refresh="() => messagesStore.fetchInbox({ limit: 20 })"
      @load-more="() => messagesStore.fetchInbox({
        limit: 20,
        cursor: messagesStore.inboxNextCursor,
        append: true,
      })"
    />

    <MessagesQuickViewModal
      v-if="quickViewConversationId"
      :conversation-id="quickViewConversationId"
      @close="closeQuickView"
      @open-inbox="handleOpenInboxFromQuickView"
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
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
  background: linear-gradient(135deg, var(--color-primary-2), var(--color-primary));
  color: var(--color-primary-ink);
  box-shadow: 0 14px 40px rgba(109, 94, 252, 0.22);
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .icon svg {
    width: 16px;
    height: 16px;
  }
}
</style>





