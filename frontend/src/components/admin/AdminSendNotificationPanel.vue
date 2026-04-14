<script setup lang="ts">
import type {
  AdminNotificationTarget,
  UserRole,
} from '@/types/admin.types';

type Props = {
  target: AdminNotificationTarget;
  role: UserRole;
  userId: string;
  title: string;
  message: string;
  href: string;
  busy: boolean;
  error: string | null;
  ok: string | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:target', value: AdminNotificationTarget): void;
  (e: 'update:role', value: UserRole): void;
  (e: 'update:userId', value: string): void;
  (e: 'update:title', value: string): void;
  (e: 'update:message', value: string): void;
  (e: 'update:href', value: string): void;
  (e: 'submit'): void;
}>();

const TITLE_MAX_LENGTH = 120;
const MESSAGE_MAX_LENGTH = 600;

const parseTarget = (value: string): AdminNotificationTarget | null => {
  if (value === 'ALL') return 'ALL';
  if (value === 'ROLE') return 'ROLE';
  if (value === 'USER') return 'USER';
  return null;
};

const parseRole = (value: string): UserRole | null => {
  if (value === 'STUDENT') return 'STUDENT';
  if (value === 'TEACHER') return 'TEACHER';
  if (value === 'ADMIN') return 'ADMIN';
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

const onUserIdInput = (event: Event): void => {
  emit('update:userId', readInputValue(event));
};

const onTitleInput = (event: Event): void => {
  emit('update:title', readInputValue(event));
};

const onMessageInput = (event: Event): void => {
  emit('update:message', readTextareaValue(event));
};

const onHrefInput = (event: Event): void => {
  emit('update:href', readInputValue(event));
};

const canSubmit = (): boolean => {
  if (props.busy) {
    return false;
  }

  const trimmedTitle = props.title.trim();
  const trimmedMessage = props.message.trim();

  if (trimmedTitle.length < 3 || trimmedTitle.length > TITLE_MAX_LENGTH) {
    return false;
  }

  if (trimmedMessage.length < 3 || trimmedMessage.length > MESSAGE_MAX_LENGTH) {
    return false;
  }

  if (props.target === 'USER') {
    return props.userId.trim().length >= 5;
  }

  return true;
};

const helperText = (): string => {
  if (props.target === 'ALL') {
    return 'The notification will be sent to all active users.';
  }

  if (props.target === 'ROLE') {
    return 'The notification will be sent to all active users with the selected role.';
  }

  return 'The notification will be sent to one user.';
};
</script>

<template>
  <section class="card">
    <div class="card__body">
      <header :class="$style.header">
        <div>
          <h2 :class="$style.title">Send notification</h2>
          <p class="muted">
            You can send a notification to everyone, to a role, or to a single user.
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
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        <label v-if="target === 'USER'" :class="$style.field">
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
          <span :class="$style.label">Title</span>
          <input
            class="input"
            type="text"
            maxlength="120"
            :value="title"
            placeholder="e.g. Maintenance break"
            @input="onTitleInput"
          />
          <span class="muted" :class="$style.counter">
            {{ title.trim().length }}
          </span>
        </label>

        <label :class="[$style.field, $style.full]">
          <span :class="$style.label">Message</span>
          <textarea
            class="input"
            rows="4"
            maxlength="600"
            :value="message"
            placeholder="Type notification content..."
            @input="onMessageInput"
          />
          <div :class="$style.metaRow">
            <span class="muted">{{ helperText() }}</span>
            <span class="muted" :class="$style.counter">
              {{ message.trim().length }}/600
            </span>
          </div>
        </label>

        <label :class="[$style.field, $style.full]">
          <span :class="$style.label">Href (optional)</span>
          <input
            class="input"
            type="text"
            :value="href"
            placeholder="e.g. /messages?c=..."
            @input="onHrefInput"
          />
          <span class="muted">
            Use only internal paths starting with "/".
          </span>
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
  align-self: flex-end;
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





