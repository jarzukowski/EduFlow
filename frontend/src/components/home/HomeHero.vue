<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import gsap from 'gsap';
import lottie, { type AnimationItem } from 'lottie-web';

import welcomeAnimation from '@/assets/lottie/welcome.json';

const scrambleElement = ref<HTMLElement | null>(null);
const lottieContainer = ref<HTMLElement | null>(null);

let lottieInstance: AnimationItem | null = null;
let animationTimeline: gsap.core.Timeline | null = null;
let reducedMotionStopTimer: number | null = null;

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const normalizeText = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

const scrambleTo = (
  el: HTMLElement,
  rawText: unknown,
  durationMs: number,
): gsap.core.Tween => {
  const toText = normalizeText(rawText);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#!?*@';
  const maxLen = toText.length;
  const state = { p: 0 };

  const indices = Array.from({ length: maxLen }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const currentIndex = indices[i];
    const rantomIndex = indices[j];

    if (currentIndex === undefined || rantomIndex === undefined) {
      continue;
    }

    indices[i] = rantomIndex;
    indices[j] = currentIndex;
  }

  const locked = new Set<number>();

  return gsap.to(state, {
    p: 1,
    duration: durationMs / 1000,
    ease: 'power2.inOut',
    onUpdate: () => {
      const shouldLock = Math.floor(state.p * maxLen);

      while (locked.size < shouldLock && locked.size < indices.length) {
        const nextIndex = indices[locked.size];
        if (nextIndex === undefined) {
          break;
        }

        locked.add(nextIndex);
      }

      const out: string[] = [];
      for (let i = 0; i < maxLen; i++) {
        if (locked.has(i)) {
          out.push(toText.charAt(i));
        } else {
          out.push(chars.charAt(Math.floor(Math.random() * chars.length)));
        }
      }

      el.textContent = out.join('');
    },
    onComplete: () => {
      el.textContent = toText;
    },
  });
};

onMounted((): void => {
  const reducedMotion = prefersReducedMotion();

  if (lottieContainer.value) {
    lottieInstance = lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: 'svg',
      loop: !reducedMotion,
      autoplay: true,
      animationData: welcomeAnimation,
    });

    if (reducedMotion) {
      lottieInstance.setSpeed(1.4);
      lottieInstance.play();

      reducedMotionStopTimer = window.setTimeout(() => {
        lottieInstance?.stop();
      }, 900);
    }
  }

  if (!scrambleElement.value) {
    return;
  }

  const element = scrambleElement.value;
  const phrases = [
    'No time limits.',
    'With a clear plan.',
    'Fast and focused.',
    'Step by step.',
  ];

  if (reducedMotion) {
    element.textContent = phrases[0] ?? '';
    return;
  }

  let phraseIndex = 0;

  animationTimeline = gsap.timeline({
    repeat: -1,
    repeatDelay: 0.1,
  });

  animationTimeline.call(() => {
    const nextPhrase = phrases[phraseIndex % phrases.length] ?? '';
    phraseIndex += 1;
    scrambleTo(element, nextPhrase, 1600);
  });

  animationTimeline.to({}, { duration: 2.0 });
});

onUnmounted((): void => {
  animationTimeline?.kill();
  animationTimeline = null;

  lottieInstance?.destroy();
  lottieInstance = null;

  if (reducedMotionStopTimer !== null) {
    window.clearTimeout(reducedMotionStopTimer);
    reducedMotionStopTimer = null;
  }
});
</script>

<template>
  <section :class="$style.hero" aria-labelledby="home-hero-title">
    <div :class="$style.grid">
      <div :class="$style.left">
        <h1 id="home-hero-title" :class="$style.title">
          <span :class="$style.line">Learn faster.</span>
          <span :class="$style.line">
            <span :class="$style.scrambleWrap">
              <span :class="$style.scramble" ref="scrambleElement">No limits.</span>
            </span>
          </span>
          <span :class="$style.line">With EduFlow.</span>
        </h1>

        <p :class="$style.subtitle">
          Courses, lessons, and progress step by step in one place.
        </p>

        <div :class="$style.actions">
          <router-link to="/courses" class="btn btn--primary">
            Browse courses
          </router-link>
        </div>
      </div>

      <div :class="$style.right" aria-hidden="true">
        <div :class="$style.lottie" ref="lottieContainer"></div>
      </div>
    </div>
  </section>
</template>

<style module>
.hero {
  display: flex;
  align-items: center;
  min-height: 60vh;
  padding: clamp(18px, 3vw, 36px);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(18px, 3vw, 42px);
  width: 100%;
}

.left {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.title {
  display: flex;
  flex-direction: column;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.08;
  letter-spacing: var(--tracking-tight);
}

.line {
  display: block;
}

.scrambleWrap {
  display: inline-block;
  min-width: 21ch;
  overflow: hidden;
}

.scramble {
  display: inline-block;
  white-space: nowrap;
  will-change: contents;
  background: linear-gradient(
    135deg,
    var(--color-primary-2),
    var(--color-primary)
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.subtitle {
  max-width: 56ch;
  font-size: var(--text-lg);
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: clamp(24px, 4vw, 60px);
}

.lottie {
  width: min(480px, 100%);
  aspect-ratio: 1 / 1;
  filter: drop-shadow(0 18px 60px rgba(0, 0, 0, 0.35));
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .right {
    order: -1;
    padding-left: 0;
  }

  .lottie {
    width: min(360px, 100%);
  }
}

@media (max-width: 640px) {
  .hero {
    padding: var(--space-5);
  }

  .title {
    font-size: clamp(28px, 8vw, 40px);
  }

  .scrambleWrap {
    width: 18ch;
  }
}
</style>




