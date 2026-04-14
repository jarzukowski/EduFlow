<script setup lang="ts">
import type { AdminDashboardSection } from '@/types/admin.types';

type Props = {
  activeSection: AdminDashboardSection;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', section: AdminDashboardSection): void;
}>();

const isActive = (section: AdminDashboardSection): boolean =>
  props.activeSection === section;
</script>

<template>
  <section class="card card--glass">
    <div class="card__body">
      <h2 :class="$style.title">Quick actions</h2>
      <p class="muted">Choose the section you want to manage.</p>

      <nav
        :class="$style.quickActions"
        aria-label="Admin panel navigation"
      >
        <button
          type="button"
          class="btn btn--ghost"
          :class="$style.quickButton"
          :data-active="isActive('users')"
          :aria-current="isActive('users') ? 'true' : undefined"
          @click="emit('select', 'users')"
        >
          Users
        </button>

        <button
          type="button"
          class="btn btn--ghost"
          :class="$style.quickButton"
          :data-active="isActive('courses')"
          :aria-current="isActive('courses') ? 'true' : undefined"
          @click="emit('select', 'courses')"
        >
          Courses
        </button>

        <button
          type="button"
          class="btn btn--ghost"
          :class="$style.quickButton"
          :data-active="isActive('notifications')"
          :aria-current="isActive('notifications') ? 'true' : undefined"
          @click="emit('select', 'notifications')"
        >
          Send notification
        </button>

        <button
          type="button"
          class="btn btn--ghost"
          :class="$style.quickButton"
          :data-active="isActive('messages')"
          :aria-current="isActive('messages') ? 'true' : undefined"
          @click="emit('select', 'messages')"
        >
          Send message
        </button>
      </nav>
    </div>
  </section>
</template>

<style module>
.title {
  margin-bottom: var(--space-2);
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.quickActions {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.quickButton {
  width: 100%;
  min-height: 44px;
  justify-content: center;
}

.quickButton[data-active='true'] {
  border-color: rgba(245, 246, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text);
}
</style>

