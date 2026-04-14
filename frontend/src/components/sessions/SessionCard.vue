<script setup lang="ts">
import { computed } from 'vue';

import {
  formatSessionDateTime,
  formatSessionUserAgent,
} from '@/utils/sessions.utils';

import type { SessionDTO } from '@/types/sessions.types';

type SessionCardMode = 'active' | 'history';

const props = withDefaults(
  defineProps<{
    item: SessionDTO;
    mode: SessionCardMode;
    revokeBusy?: boolean;
    actionsDisabled?: boolean;
  }>(),
  {
    revokeBusy: false,
    actionsDisabled: false,
  },
);

const emit = defineEmits<{
  (event: 'revoke', sessionId: string): void;
}>();

const isActiveMode = computed<boolean>(() => props.mode === 'active');

const historyStatusLabel = computed<string>(() => {
  return props.item.revokedAt ? 'signed out' : 'expired';
});

const onRevokeClick = (): void => {
  if (props.actionsDisabled || props.revokeBusy || props.item.isCurrent) {
    return;
  }

  emit('revoke', props.item.id);
};
</script>

<template>
  <article :class="$style.card">
    <header :class="$style.header">
      <div :class="$style.headerMain">
        <strong :class="$style.title">
          {{
            isActiveMode
              ? item.isCurrent
                ? 'Current session'
                : 'Active session'
              : 'Historical session'
          }}
        </strong>

        <span
          v-if="isActiveMode && item.isCurrent"
          :class="[$style.badge, 'badge']"
        >
          current
        </span>

        <span
          v-else-if="!isActiveMode"
          :class="[$style.badge, 'badge']"
        >
          {{ historyStatusLabel }}
        </span>
      </div>
    </header>

    <p
      v-if="isActiveMode && item.isCurrent"
      :class="$style.hint"
    >
      You can sign out the current session from the user menu or by using the "Sign out of all" button.
    </p>

    <dl :class="$style.details">
      <div :class="$style.row">
        <dt :class="$style.label">User-Agent</dt>
        <dd :class="$style.value">{{ formatSessionUserAgent(item.userAgent) }}</dd>
      </div>

      <div class="row" :class="$style.row">
        <dt :class="$style.label">Created</dt>
        <dd :class="$style.value">{{ formatSessionDateTime(item.createdAt) }}</dd>
      </div>

      <div :class="$style.row">
        <dt :class="$style.label">Last used</dt>
        <dd :class="$style.value">{{ formatSessionDateTime(item.lastUsedAt) }}</dd>
      </div>

      <div :class="$style.row">
        <dt :class="$style.label">Expires</dt>
        <dd :class="$style.value">{{ formatSessionDateTime(item.expiresAt) }}</dd>
      </div>

      <div v-if="!isActiveMode" :class="$style.row">
        <dt :class="$style.label">Signed out</dt>
        <dd :class="$style.value">{{ formatSessionDateTime(item.revokedAt) }}</dd>
      </div>
    </dl>

    <div
      v-if="isActiveMode && !item.isCurrent"
      :class="$style.actions"
    >
      <button
        type="button"
        class="btn btn-danger"
        :disabled="actionsDisabled || revokeBusy"
        @click="onRevokeClick"
      >
        {{ revokeBusy ? 'Signing out...' : 'Sign out this session' }}
      </button>
    </div>
  </article>
</template>

<style module>
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.headerMain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.title {
  font-size: var(--text-md);
  line-height: 1.4;
}

.badge {
  text-transform: none;
}

.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.details {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: minmax(110px, 140px) minmax(0, 1fr);
  gap: var(--space-3);
}

.label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.value {
  margin: 0;
  min-width: 0;
  word-break: break-word;
  color: var(--color-text);
  font-size: var(--text-sm);
}

.actions {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}
</style>





