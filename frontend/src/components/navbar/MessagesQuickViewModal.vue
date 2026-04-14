<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { useAuthStore } from '@/stores/auth.store';
import { useMessagesStore } from '@/stores/messages.store';

type Props = {
  conversationId: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-inbox'): void;
}>();

const messagesStore = useMessagesStore();
const authStore = useAuthStore();

const scrollContainerElement = ref<HTMLElement | null>(null);
const bottomAnchorElement = ref<HTMLElement | null>(null);
const wasNearBottomBeforeUpdate = ref<boolean>(true);

const conversation = computed(() => {
  return messagesStore.conversationById[props.conversationId] ?? null;
});

const busy = computed<boolean>(() =>
  messagesStore.isConversationBusy(props.conversationId),
);

const error = computed<string | null>(() =>
  messagesStore.getConversationError(props.conversationId),
);

const myUserId = computed<string | null>(() => authStore.user?.id ?? null);

const otherParticipantLabel = computed<string>(() => {
  if (!conversation.value) {
    return '';
  }

  const otherParticipants = myUserId.value
    ? conversation.value.participants.filter(
      (participant) => participant.id !== myUserId.value,
    )
    : conversation.value.participants;

  if (otherParticipants.length === 0) {
    return '';
  }

  const emails = otherParticipants
    .map((participant) => participant.email.trim())
    .filter((email) => email.length > 0);

  if (emails.length === 0) {
    return '';
  }

  const visibleEmails = emails.slice(0, 2);
  const remainingCount = emails.length - visibleEmails.length;

  return remainingCount > 0
    ? `${visibleEmails.join(' ↔ ')} +${remainingCount}`
    : visibleEmails.join(' ↔ ');
});

const isNearBottom = (container: HTMLElement): boolean => {
  const thresholdInPixels = 48;
  const distanceToBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;

  return distanceToBottom <= thresholdInPixels;
};

const updateNearBottomFlagFromScroll = (): void => {
  const container = scrollContainerElement.value;

  if (!container) {
    return;
  }

  wasNearBottomBeforeUpdate.value = isNearBottom(container);
};

const scrollToBottom = async (
  behavior: ScrollBehavior = 'auto',
): Promise<void> => {
  await nextTick();

  bottomAnchorElement.value?.scrollIntoView({
    block: 'end',
    behavior,
  });
};

onMounted(async () => {
  await messagesStore.fetchConversation(props.conversationId);

  scrollContainerElement.value?.addEventListener(
    'scroll',
    updateNearBottomFlagFromScroll,
    { passive: true },
  );

  await scrollToBottom('auto');
});

onUnmounted(() => {
  scrollContainerElement.value?.removeEventListener(
    'scroll',
    updateNearBottomFlagFromScroll,
  );
});

watch(
  () => conversation.value?.messages.length ?? 0,
  async (nextLength, prevLength) => {
    if (nextLength > prevLength && wasNearBottomBeforeUpdate.value) {
      await scrollToBottom('smooth');
    }
  },
);

const onBackdropClick = (): void => {
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <div
      :class="$style.backdrop"
      role="dialog"
      aria-label="Message preview"
      @click="onBackdropClick"
    >
      <div :class="$style.modal" @click.stop>
        <div :class="$style.header">
          <div>
            <div :class="$style.title">Conversation</div>
            <div :class="$style.subtitle">
              {{ otherParticipantLabel }}
            </div>
          </div>

          <div :class="$style.actions">
            <button
              type="button"
              class="btn btn--ghost"
              :class="$style.headerButton"
              @click="emit('open-inbox')"
            >
              Open inbox
            </button>

            <button
              type="button"
              class="btn"
              :class="$style.headerButton"
              @click="emit('close')"
            >
              Close
            </button>
          </div>
        </div>

        <div v-if="busy" :class="$style.state">
          Loading...
        </div>

        <div v-else-if="error" :class="$style.stateError">
          {{ error }}
        </div>

        <div
          v-else-if="conversation"
          ref="scrollContainerElement"
          :class="[$style.body, 'scrollArea']"
        >
          <div
            v-if="conversation.messages.length === 0"
            :class="$style.stateMuted"
          >
            No messages.
          </div>

          <ul v-else :class="$style.list">
            <li
              v-for="message in conversation.messages.slice(-12)"
              :key="message.id"
              :class="[
                $style.messageRow,
                message.senderId === myUserId ? $style.mine : $style.theirs,
              ]"
            >
              <div :class="$style.messageBubble">
                {{ message.body }}
              </div>
            </li>
          </ul>

          <div :class="$style.footerNote">
            Full inbox:
            <button
              type="button"
              :class="$style.linkLike"
              @click="emit('open-inbox')"
            >
              /messages
            </button>
          </div>

          <div
            ref="bottomAnchorElement"
            :class="$style.bottomAnchor"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  overflow: auto;
  padding: clamp(16px, 4vw, 32px);
  background: rgba(0, 0, 0, 0.55);
}

.modal {
  width: min(760px, calc(100vw - 32px));
  max-height: min(720px, calc(100dvh - 48px));
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-weight: 900;
  letter-spacing: var(--tracking-tight);
}

.subtitle {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.actions {
  display: inline-flex;
  flex-shrink: 0;
  gap: var(--space-2);
}

.headerButton {
  min-height: 38px;
  padding: 8px 12px;
}

.state,
.stateError,
.stateMuted {
  padding: var(--space-5);
}

.stateError {
  color: rgba(255, 170, 170, 0.95);
}

.stateMuted {
  color: var(--color-text-muted);
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.list {
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

.messageBubble {
  max-width: 75%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.05);
  white-space: pre-wrap;
  word-break: break-word;
}

.mine .messageBubble {
  border-color: rgba(109, 94, 252, 0.22);
  background: rgba(109, 94, 252, 0.14);
}

.footerNote {
  margin-top: var(--space-4);
  color: var(--color-text-muted);
  font-size: 13px;
}

.linkLike {
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(245, 246, 255, 0.92);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.bottomAnchor {
  height: 1px;
}
</style>





