<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { useAuthStore } from '@/stores/auth.store';
import { useMessagesStore } from '@/stores/messages.store';

import type { ConversationDTO } from '@/types/messages.types';

type Props = {
  conversationId: string;
  conversation: ConversationDTO | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const messagesStore = useMessagesStore();
const authStore = useAuthStore();

const messageInput = ref<string>('');
const messagesScrollContainerElement = ref<HTMLElement | null>(null);
const bottomAnchorElement = ref<HTMLElement | null>(null);
const wasNearBottomBeforeUpdate = ref<boolean>(true);

const myUserId = computed<string | null>(() => authStore.user?.id ?? null);
const canSend = computed<boolean>(() => messageInput.value.trim().length > 0);

const getIsNearBottom = (containerElement: HTMLElement): boolean => {
  const thresholdInPixels = 48;
  const distanceToBottom =
    containerElement.scrollHeight -
    containerElement.scrollTop -
    containerElement.clientHeight;

  return distanceToBottom <= thresholdInPixels;
};

const scrollToBottom = async (
  options?: { behavior?: ScrollBehavior },
): Promise<void> => {
  await nextTick();

  bottomAnchorElement.value?.scrollIntoView({
    block: 'end',
    behavior: options?.behavior ?? 'auto',
  });
};

const onScroll = (): void => {
  const containerElement = messagesScrollContainerElement.value;

  if (!containerElement) {
    return;
  }

  wasNearBottomBeforeUpdate.value = getIsNearBottom(containerElement);
};

const send = async (): Promise<void> => {
  if (!props.conversationId) {
    return;
  }

  const body = messageInput.value.trim();

  if (body.length === 0) {
    return;
  }

  await messagesStore.sendMessage(props.conversationId, { body });

  messageInput.value = '';
  await scrollToBottom({ behavior: 'smooth' });
};

onMounted(() => {
  messagesScrollContainerElement.value?.addEventListener('scroll', onScroll, {
    passive: true,
  });
});

onUnmounted(() => {
  messagesScrollContainerElement.value?.removeEventListener('scroll', onScroll);
});

watch(
  () => props.conversationId,
  async () => {
    wasNearBottomBeforeUpdate.value = true;
    await scrollToBottom({ behavior: 'auto' });
  },
  { immediate: true },
);

watch(
  () => props.conversation?.messages.length ?? 0,
  async (nextLength, prevLength) => {
    if (!props.conversation) {
      return;
    }

    if (prevLength === 0 && nextLength > 0) {
      await scrollToBottom({ behavior: 'auto' });
      return;
    }

    if (nextLength > prevLength && wasNearBottomBeforeUpdate.value) {
      await scrollToBottom({ behavior: 'smooth' });
    }
  },
);
</script>

<template>
  <div :class="$style.panel">
    <div :class="$style.header">
      <button
        type="button"
        class="btn btn--ghost"
        :class="$style.backButton"
        @click="emit('back')"
      >
        Back
      </button>

      <div :class="$style.headerTitle">
        Conversation
      </div>
    </div>

    <div v-if="!conversation" :class="$style.state">
      Loading...
    </div>

    <div
      v-else
      ref="messagesScrollContainerElement"
      :class="[$style.body, 'scrollArea']"
    >
      <ul :class="$style.messages">
        <li
          v-for="message in conversation.messages"
          :key="message.id"
          :class="[
            $style.messageRow,
            message.senderId === myUserId ? $style.mine : $style.theirs,
          ]"
        >
          <div :class="$style.bubble">
            {{ message.body }}
          </div>
        </li>
      </ul>

      <div
        ref="bottomAnchorElement"
        :class="$style.bottomAnchor"
        aria-hidden="true"
      />
    </div>

    <div :class="$style.footer">
      <label :class="$style.inputWrap">
        <span class="sr-only">Message body</span>

        <input
          v-model="messageInput"
          type="text"
          class="input"
          placeholder="Write message…"
          @keyup.enter="send"
        />
      </label>

      <button
        type="button"
        class="btn btn--primary"
        :class="$style.sendButton"
        :disabled="!canSend"
        aria-label="Send message"
        @click="send"
      >
        <span :class="$style.sendIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M21.8 2.2 2.9 10.3c-.9.4-.9 1.7.1 2l6.6 2.2 2.2 6.6c.3 1 1.6 1 2 .1L21.8 2.2Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="M21.8 2.2 9.5 14.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>

        <span :class="$style.sendLabel">
          Send
        </span>
      </button>
    </div>
  </div>
</template>

<style module>
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.headerTitle {
  min-width: 0;
  font-weight: 800;
}

.backButton {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

@media (min-width: 880px) {
  .backButton {
    display: none;
  }
}

.state {
  padding: var(--space-4);
  color: var(--color-text-muted);
}

.body {
  flex: 1;
  overflow: auto;
  padding: var(--space-4);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.messageRow {
  display: flex;
}

.mine {
  justify-content: flex-end;
}

.theirs {
  justify-content: flex-start;
}

.bubble {
  max-width: min(70ch, 78%);
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.06);
  white-space: pre-wrap;
  word-break: break-word;
}

.mine .bubble {
  background: rgba(109, 94, 252, 0.18);
}

.bottomAnchor {
  height: 1px;
}

.footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.inputWrap {
  flex: 1;
  min-width: 0;
}

.sendButton {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 112px;
  white-space: nowrap;
}

.sendIcon {
  display: inline-flex;
}

@media (max-width: 520px) {
  .sendButton {
    width: 44px;
    height: 44px;
    min-width: 44px;
    padding: 0;
    border-radius: 999px;
  }

  .sendLabel {
    display: none;
  }
}
</style>



