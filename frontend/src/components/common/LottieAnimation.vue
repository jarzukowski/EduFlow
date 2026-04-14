<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import lottie, { type AnimationItem } from 'lottie-web';

type Props = {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  loop: true,
  autoplay: true,
});

const hostElement = ref<HTMLDivElement | null>(null);

let animationInstance: AnimationItem | null = null;
let reducedMotionQuery: MediaQueryList | null = null;

const destroyAnimation = (): void => {
  if (!animationInstance) {
    return;
  }

  animationInstance.destroy();
  animationInstance = null;
};

const shouldAutoplay = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  return prefersReducedMotion ? false : props.autoplay;
};

const loadAnimation = (): void => {
  destroyAnimation();

  if (!hostElement.value) {
    return;
  }

  animationInstance = lottie.loadAnimation({
    container: hostElement.value,
    renderer: 'svg',
    loop: props.loop,
    autoplay: shouldAutoplay(),
    path: props.src,
  });
};

const handleReducedMotionChange = (): void => {
  loadAnimation();
};

onMounted(() => {
  loadAnimation();

  if (typeof window === 'undefined' || !window.matchMedia) {
    return;
  }

  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
});

watch(
  () => [props.src, props.loop, props.autoplay],
  () => {
    loadAnimation();
  },
);

onUnmounted(() => {
  if (reducedMotionQuery) {
    reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    reducedMotionQuery = null;
  }

  destroyAnimation();
});
</script>

<template>
  <div :class="$style.wrap" aria-hidden="true">
    <div ref="hostElement" :class="$style.host" />
  </div>
</template>

<style module>
.wrap {
  width: min(520px, 100%);
  margin-inline: auto;
}

.host {
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>


