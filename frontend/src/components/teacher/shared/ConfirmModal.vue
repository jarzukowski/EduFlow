<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  open: boolean;
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const confirmLabel = computed<string>(() => props.confirmText ?? 'Confirm');
const cancelLabel = computed<string>(() => props.cancelText ?? 'Cancel');
const canClose = computed<boolean>(() => !props.busy);

const onClose = (): void => {
  if (!canClose.value) {
    return;
  }

  emit('close');
};

const onConfirm = (): void => {
  if (props.busy) {
    return;
  }

  emit('confirm');
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (!props.open || event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  onClose();
};

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      :class="$style.overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        :class="$style.overlayClickCatcher"
        :disabled="!canClose"
        aria-label="Close modal"
        @click="onClose"
      />

      <div :class="[$style.modal, 'card']" role="document">
        <div class="card__body">
          <div class="row row--between">
            <h2 id="confirm-modal-title" :class="$style.modalTitle">
              {{ title }}
            </h2>

            <button
              type="button"
              class="btn btn--ghost"
              :disabled="!canClose"
              aria-label="Close"
              @click="onClose"
            >
              ✕
            </button>
          </div>

          <p class="muted" :class="$style.modalText">
            {{ text }}
          </p>

          <div :class="$style.modalActions">
            <button
              type="button"
              class="btn btn--ghost"
              :disabled="!canClose"
              @click="onClose"
            >
              {{ cancelLabel }}
            </button>

            <button
              type="button"
              class="btn btn--danger"
              :disabled="Boolean(busy)"
              @click="onConfirm"
            >
              {{ busy ? 'Processing...' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: var(--space-5);
}

.overlayClickCatcher {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  cursor: default;
}

.modal {
  position: relative;
  z-index: calc(var(--z-modal) + 1);
  width: 100%;
  max-width: 520px;
  max-height: calc(100dvh - (2 * var(--space-5)));
  overflow: auto;
}

.modalTitle {
  margin: 0;
  font-size: var(--text-lg);
}

.modalText {
  margin-top: 10px;
}

.modalActions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@media (max-width: 640px) {
  .modalActions {
    flex-direction: column-reverse;
  }

  .modalActions :global(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>


