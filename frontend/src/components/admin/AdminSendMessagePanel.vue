<script setup lang="ts">
import type {
  AdminMessageRole,
  AdminMessageRoleMode,
  AdminMessageTarget,
} from '@/types/admin.types';

type Props = {
  target: AdminMessageTarget;
  role: AdminMessageRole;
  mode: AdminMessageRoleMode;
  userId: string;
  body: string;
  busy: boolean;
  error: string | null;
  ok: string | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:target', value: AdminMessageTarget): void;
  (e: 'update:role', value: AdminMessageRole): void;
  (e: 'update:mode', value: AdminMessageRoleMode): void;
  (e: 'update:userId', value: string): void;
  (e: 'update:body', value: string): void;
  (e: 'submit'): void;
}>();

const BODY_MAX_LENGTH = 2000;
const USER_ID_MIN_LENGTH = 5;
const USER_ID_MAX_LENGTH = 64;

const parseTarget = (value: string): AdminMessageTarget | null => {
  if (value === 'ALL') return 'ALL';
  if (value === 'ROLE') return 'ROLE';
  if (value === 'USER') return 'USER';
  return null;
};

const parseRole = (value: string): AdminMessageRole | null => {
  if (value === 'STUDENT') return 'STUDENT';
  if (value === 'TEACHER') return 'TEACHER';
  return null;
};

const parseMode = (value: string): AdminMessageRoleMode | null => {
  if (value === 'ALL') return 'ALL';
  if (value === 'USER') return 'USER';
  return null;
};

const readSelectValue = (event: Event): string => {
  const eventTarget = event.target;

  if (!(eventTarget instanceof HTMLSelectElement)) {
    return '';
  }

  return eventTarget.value;
};

const readInputValue = (event: Event): string => {
  const eventTarget = event.target;

  if (!(eventTarget instanceof HTMLInputElement)) {
    return '';
  }

  return eventTarget.value;
};

const readTextareaValue = (event: Event): string => {
  const eventTarget = event.target;

  if (!(eventTarget instanceof HTMLTextAreaElement)) {
    return '';
  }

  return eventTarget.value;
};

const onTargetChange = (event: Event): void => {
  const parsedTarget = parseTarget(readSelectValue(event));

  if (!parsedTarget) {
    return;
  }

  emit('update:target', parsedTarget);
};

const onRoleChange = (event: Event): void => {
  const parsedRole = parseRole(readSelectValue(event));

  if (!parsedRole) {
    return;
  }

  emit('update:role', parsedRole);
};

const onModeChange = (event: Event): void => {
  const parsedMode = parseMode(readSelectValue(event));

  if (!parsedMode) {
    return;
  }

  emit('update:mode', parsedMode);
};

const onUserIdInput = (event: Event): void => {
  emit('update:userId', readInputValue(event));
};

const onBodyInput = (event: Event): void => {
  emit('update:body', readTextareaValue(event));
};

const canSubmit = (): boolean => {
  if (props.busy) {
    return false;
  }

  const trimmedBody = props.body.trim();

  if (trimmedBody.length < 1 || trimmedBody.length > BODY_MAX_LENGTH) {
    return false;
  }

  if (props.target === 'USER') {
    const trimmedUserId = props.userId.trim();

    return (
      trimmedUserId.length >= USER_ID_MIN_LENGTH &&
      trimmedUserId.length <= USER_ID_MAX_LENGTH
    );
  }

  if (props.target === 'ROLE' && props.mode === 'USER') {
    const trimmedUserId = props.userId.trim();

    return (
      trimmedUserId.length >= USER_ID_MIN_LENGTH &&
      trimmedUserId.length <= USER_ID_MAX_LENGTH
    );
  }

  return true;
};

const helperText = (): string => {
  if (props.target === 'ALL') {
    return 'The message will be sent to all users except administrators.';
  }

  if (props.target === 'USER') {
    return 'The system will create or open a conversation with one user.';
  }

  if (props.mode === 'ALL') {
    return 'The message will be sent to all users with the selected role.';
  }

  return 'The message will be sent to one user with the selected role.';
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <header :class="$style.header">
        <div>
          <h2 :class="$style.title">Send message</h2>
          <p class="muted">
            The system will create or open a conversation and send the message.
          </p>
        </div>
      </header>

      <div :class="$style.grid">
        <label :class="$style.field">
          <span :class="$style.label">Target</span>
          <select
            class="input"
            :value="target"
            @change="onTargetChange"
          >
            <option value="ALL">ALL</option>
            <option value="ROLE">ROLE</option>
            <option value="USER">USER</option>
          </select>
        </label>

        <label v-if="target === 'ROLE'" :class="$style.field">
          <span :class="$style.label">Role</span>
          <select
            class="input"
            :value="role"
            @change="onRoleChange"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="TEACHER">TEACHER</option>
          </select>
        </label>

        <label v-if="target === 'ROLE'" :class="$style.field">
          <span :class="$style.label">Mode</span>
          <select
            class="input"
            :value="mode"
            @change="onModeChange"
          >
            <option value="ALL">ALL</option>
            <option value="USER">USER</option>
          </select>
        </label>

        <label
          v-if="target === 'USER' || (target === 'ROLE' && mode === 'USER')"
          :class="$style.field"
        >
          <span :class="$style.label">User ID</span>
          <input
            class="input"
            type="text"
            :value="userId"
            autocomplete="off"
            placeholder="e.g. cuid or uuid"
            @input="onUserIdInput"
          />
        </label>

        <label :class="[$style.field, $style.full]">
          <span :class="$style.label">Message body</span>
          <textarea
            class="input"
            rows="6"
            maxlength="2000"
            :value="body"
            placeholder="Type a message..."
            @input="onBodyInput"
          />
          <div :class="$style.metaRow">
            <span class="muted">{{ helperText() }}</span>
            <span class="muted" :class="$style.counter">
              {{ body.trim().length }}/2000
            </span>
          </div>
        </label>
      </div>

      <p v-if="error" :class="$style.error" role="status">{{ error }}</p>
      <p v-else-if="ok" :class="$style.ok" role="status">{{ ok }}</p>

      <div :class="$style.actions">
        <button
          type="button"
          class="btn"
          :disabled="!canSubmit()"
          @click="emit('submit')"
        >
          Send
        </button>

        <span v-if="busy" class="muted">Sending...</span>
      </div>
    </div>
  </section>
</template>

<style module>
.header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.title {
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.full {
  grid-column: 1 / -1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.metaRow {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: baseline;
}

.counter {
  white-space: nowrap;
  font-size: var(--text-xs);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.error {
  margin-top: var(--space-3);
  color: rgba(255, 170, 170, 0.95);
}

.ok {
  margin-top: var(--space-3);
  color: rgba(170, 255, 200, 0.95);
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>





