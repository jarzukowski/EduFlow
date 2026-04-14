<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

export type MobileNavItemTone = 'default' | 'danger';

export type MobileNavItem = {
  key: string;
  label: string;
  active?: boolean;
  tone?: MobileNavItemTone;
};

type Props = {
  open: boolean;
  title: string;
  items: MobileNavItem[];
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'navigate', key: string): void;
}>();

const panelElement = ref<HTMLElement | null>(null);
const titleId = 'mobile-nav-drawer-title';

const close = (): void => {
  emit('close');
};

const onBackdropClick = (): void => {
  close();
};

const getFocusableElements = (): HTMLElement[] => {
  const panel = panelElement.value;

  if (!panel) {
    return [];
  }

  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled'));
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (!props.open) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusableElements = getFocusableElements();

  if (focusableElements.length === 0) {
    return;
  }

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  if (!firstFocusableElement || !lastFocusableElement) {
    return;
  }

  const activeElement = document.activeElement;

  if (event.shiftKey) {
    if (activeElement === firstFocusableElement || !panelElement.value?.contains(activeElement)) {
      event.preventDefault();
      lastFocusableElement.focus();
    }

    return;
  }

  if (activeElement === lastFocusableElement) {
    event.preventDefault();
    firstFocusableElement.focus();
  }
};

const lockScroll = (): void => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
};

const unlockScroll = (): void => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

const focusFirstElement = async (): Promise<void> => {
  await nextTick();

  const firstFocusableElement = getFocusableElements()[0];
  firstFocusableElement?.focus();
};

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      lockScroll();
      await focusFirstElement();
      return;
    }

    unlockScroll();
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
  unlockScroll();
});

const onNavigate = (key: string): void => {
  emit('navigate', key);
};
</script>

<template>
  <Teleport to="body">
    <div v-if="open" :class="$style.backdrop" @click="onBackdropClick">
      <div
        ref="panelElement"
        :class="$style.panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.stop
      >
        <div :class="$style.header">
          <div :id="titleId" :class="$style.title">
            {{ title }}
          </div>

          <button
            type="button"
            :class="$style.closeButton"
            aria-label="Close menu"
            @click="close"
          >
            ✕
          </button>
        </div>

        <nav :class="$style.nav" aria-label="Mobile navigation">
          <button
            v-for="item in items"
            :key="item.key"
            type="button"
            :class="[
              $style.item,
              item.active ? $style.itemActive : null,
              item.tone === 'danger' ? $style.itemDanger : null,
            ]"
            :aria-current="item.active ? 'page' : undefined"
            @click="onNavigate(item.key)"
          >
            <span :class="$style.itemLabel">{{ item.label }}</span>
          </button>
        </nav>

        <div :class="$style.footerHint">
          <span :class="$style.hintText">ESC closes • Tab works in the menu</span>
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
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  background: rgba(0, 0, 0, 0.56);
}

.panel {
  width: min(340px, 88vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: rgba(13, 18, 36, 0.92);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-lg);
  transform: translateX(0);
  animation: drawer-in var(--dur-med) var(--ease-out);
}

@keyframes drawer-in {
  from {
    transform: translateX(-10px);
    opacity: 0.92;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    animation: none;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.title {
  color: var(--color-text);
  font-weight: 900;
  letter-spacing: var(--tracking-tight);
}

.closeButton {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
}

.closeButton:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.nav {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.item {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  text-align: left;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(245, 246, 255, 0.9);
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.item:hover {
  transform: translateY(-1px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.item:active {
  transform: translateY(0);
}

.itemActive {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(245, 246, 255, 0.2);
  color: var(--color-text);
}

.itemDanger {
  border-color: rgba(255, 120, 120, 0.35);
  color: rgba(255, 190, 190, 0.95);
  background: rgba(255, 120, 120, 0.1);
}

.itemLabel {
  font-weight: 750;
  letter-spacing: var(--tracking-tight);
}

.footerHint {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.02);
}

.hintText {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>



