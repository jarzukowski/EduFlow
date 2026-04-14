<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MessagesConversation from '@/components/messages/MessagesConversation.vue';
import MessagesList from '@/components/messages/MessagesList.vue';
import { useMessagesStore } from '@/stores/messages.store';

const router = useRouter();
const route = useRoute();
const messagesStore = useMessagesStore();

const selectedConversationId = ref<string | null>(null);

const selectedConversation = computed(() => {
  const conversationId = selectedConversationId.value;

  if (!conversationId) {
    return null;
  }

  return messagesStore.conversationById[conversationId] ?? null;
});

const conversationIdFromQuery = computed<string | null>(() => {
  const rawConversationId = route.query.c;

  return typeof rawConversationId === 'string' && rawConversationId.trim().length > 0
    ? rawConversationId.trim()
    : null;
});

const syncUrlConversationId = async (
  conversationId: string | null,
): Promise<void> => {
  const nextQuery = { ...route.query };

  if (conversationId) {
    nextQuery.c = conversationId;
  } else {
    delete nextQuery.c;
  }

  await router.replace({
    name: 'messages',
    query: nextQuery,
  });
};

const selectConversation = async (
  conversationId: string,
): Promise<void> => {
  selectedConversationId.value = conversationId;
  await syncUrlConversationId(conversationId);
};

const bootstrapSelection = async (): Promise<void> => {
  await messagesStore.fetchInbox({ limit: 50 });

  const preferredConversationId = conversationIdFromQuery.value;

  if (preferredConversationId) {
    const existsInInbox = messagesStore.inboxItems.some(
      (item) => item.conversationId === preferredConversationId,
    );

    if (existsInInbox) {
      selectedConversationId.value = preferredConversationId;
      return;
    }
  }

  selectedConversationId.value =
    messagesStore.inboxItems[0]?.conversationId ?? null;

  await syncUrlConversationId(selectedConversationId.value);
};

const onBackFromConversation = async (): Promise<void> => {
  selectedConversationId.value = null;
  await syncUrlConversationId(null);
};

const onRefreshInbox = async (): Promise<void> => {
  await messagesStore.fetchInbox({ limit: 50 });

  const currentSelectedConversationId = selectedConversationId.value;

  if (!currentSelectedConversationId) {
    return;
  }

  const existsInInbox = messagesStore.inboxItems.some(
    (item) => item.conversationId === currentSelectedConversationId,
  );

  if (!existsInInbox) {
    selectedConversationId.value =
      messagesStore.inboxItems[0]?.conversationId ?? null;

    await syncUrlConversationId(selectedConversationId.value);
  }
};

onMounted(async () => {
  await bootstrapSelection();
});

onUnmounted(() => {
  messagesStore.stopConversationPolling();
});

watch(
  conversationIdFromQuery,
  async (nextConversationIdFromQuery) => {
    if (!nextConversationIdFromQuery) {
      return;
    }

    if (selectedConversationId.value === nextConversationIdFromQuery) {
      return;
    }

    const existsInInbox = messagesStore.inboxItems.some(
      (item) => item.conversationId === nextConversationIdFromQuery,
    );

    if (!existsInInbox) {
      selectedConversationId.value =
        messagesStore.inboxItems[0]?.conversationId ?? null;

      await syncUrlConversationId(selectedConversationId.value);
      return;
    }

    selectedConversationId.value = nextConversationIdFromQuery;
  },
);

watch(
  selectedConversationId,
  async (nextSelectedConversationId) => {
    if (!nextSelectedConversationId) {
      messagesStore.stopConversationPolling();
      return;
    }

    await messagesStore.fetchConversation(nextSelectedConversationId);
    await messagesStore.markConversationRead(nextSelectedConversationId);

    messagesStore.startConversationPolling(nextSelectedConversationId, {
      intervalMs: 6_000,
    });
  },
);
</script>

<template>
  <main class="container">
    <section
      :class="[
        $style.layout,
        selectedConversationId ? $style.hasConversation : null,
      ]"
    >
      <MessagesList
        :class="$style.inbox"
        :items="messagesStore.inboxItems"
        :selected-id="selectedConversationId"
        :busy="messagesStore.inboxBusy"
        :error="messagesStore.inboxError"
        @select="selectConversation"
        @refresh="onRefreshInbox"
      />

      <MessagesConversation
        v-if="selectedConversationId"
        :class="$style.conversation"
        :conversation-id="selectedConversationId"
        :conversation="selectedConversation"
        @back="onBackFromConversation"
      />

      <div v-else :class="[$style.empty, $style.conversation]">
        Select a conversation.
      </div>
    </section>
  </main>
</template>

<style module>
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  min-height: calc(100vh - 140px);
}

.inbox {
  min-width: 0;
}

.conversation {
  min-width: 0;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text-muted);
}

@media (min-width: 880px) {
  .layout {
    grid-template-columns: 360px 1fr;
    height: calc(100vh - 140px);
    min-height: unset;
  }
}

@media (max-width: 879px) {
  .layout.hasConversation .inbox {
    display: none;
  }

  .layout:not(.hasConversation) .conversation {
    display: none;
  }
}
</style>

