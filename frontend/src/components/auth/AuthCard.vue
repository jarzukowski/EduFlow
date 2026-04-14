<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import AuthSignInForm from './AuthSignInForm.vue';
import AuthSignUpForm from './AuthSignUpForm.vue';

type AuthMode = 'signin' | 'signup';

defineProps<{
  mode: AuthMode;
  busy: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: 'switchMode'): void;
  (e: 'signIn', payload: { email: string; password: string }): void;
  (e: 'signUp', payload: { username: string; email: string; password: string }): void;
}>();

const isMobile = ref(false);

const MOBILE_MQ = '(max-width: 1024px), (max-height: 500px) and (orientation: landscape)';
let mediaQueryList: MediaQueryList | null = null;

const onSwitchMode = (): void => {
  emit('switchMode');
};

const onSignIn = (payload: { email: string; password: string }): void => {
  emit('signIn', payload);
};

const onSignUp = (payload: { username: string; email: string; password: string }): void => {
  emit('signUp', payload);
};

const syncIsMobile = (): void => {
  if (!mediaQueryList) return;
  isMobile.value = mediaQueryList.matches;
};

onMounted(() => {
  mediaQueryList = window.matchMedia(MOBILE_MQ);
  syncIsMobile();
  mediaQueryList.addEventListener('change', syncIsMobile);
});

onUnmounted(() => {
  mediaQueryList?.removeEventListener('change', syncIsMobile);
  mediaQueryList = null;
});
</script>

<template>
  <div :class="$style.card" role="region" aria-label="Authentication">
    <div :class="$style.stage">
      <div :class="[$style.bg, mode === 'signin' ? $style.bgSignin : $style.bgSignup]" />

      <div
        v-if="mode === 'signin' || !isMobile"
        :class="[$style.panel, $style.left, mode === 'signin' ? $style.active : $style.inactive]"
      >
        <header :class="$style.header">
          <h1 :class="$style.title">Sign in</h1>
          <p :class="$style.sub">Use your email address and password to continue.</p>
        </header>

        <AuthSignInForm :busy="busy" @submit="onSignIn" />

        <p v-if="error" :class="$style.error" role="status">{{ error }}</p>

        <button
          type="button"
          :class="[$style.link, mode !== 'signin' && $style.linkHidden]"
          @click="onSwitchMode"
        >
          Do you not have an account yet? <span :class="$style.linkStrong">Create account</span>
        </button>
      </div>

      <div
        v-if="mode === 'signup' || !isMobile"
        :class="[$style.panel, $style.right, mode === 'signup' ? $style.active : $style.inactive]"
      >
        <header :class="$style.header">
          <h1 :class="$style.title">Create account</h1>
          <p :class="$style.sub">Create an account first, then sign in.</p>
        </header>

        <AuthSignUpForm :busy="busy" @submit="onSignUp" />

        <p v-if="error" :class="$style.error" role="status">{{ error }}</p>

        <button
          type="button"
          :class="[$style.link, mode !== 'signup' && $style.linkHidden]"
          @click="onSwitchMode"
        >
          Already have an account? <span :class="$style.linkStrong">Sign in</span>
        </button>
      </div>

      <aside
        :class="[$style.hero, mode === 'signin' ? $style.heroRight : $style.heroLeft]"
        aria-hidden="true"
      >
        <div :class="$style.heroInner">
          <h2 :class="$style.heroTitle">
            {{ mode === 'signin' ? 'Hey there!' : 'Welcome back!' }}
          </h2>

          <p :class="$style.heroText">
            {{
              mode === 'signin'
                ? 'Start your journey here and begin learning right away.'
                : 'Sign in to continue where you left off.'
            }}
          </p>

          <div :class="$style.heroCta">
            <button type="button" :class="$style.heroPill" @click="onSwitchMode">
              {{ mode === 'signin' ? 'Sign up' : 'Sign in' }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style module>
.card {
  width: min(900px, 100%);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(20, 20, 20, 0.55);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}

.stage {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 560px;
}

.bg {
  position: absolute;
  inset: 0;
  width: 50%;
  z-index: 3;
  pointer-events: auto;
  transition: transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1);
  background: linear-gradient(135deg, rgba(47, 139, 255, 0.99), rgba(200, 94, 252, 1));
}

.bgSignin {
  transform: translateX(100%);
}

.bgSignup {
  transform: translateX(0%);
}

.panel {
  position: relative;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  z-index: 2;
}

.left {
  grid-column: 1;
}

.right {
  grid-column: 2;
}

.active {
  z-index: 4;
  opacity: 1;
  pointer-events: auto;
  transition: transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease;
}

.inactive {
  opacity: 0.72;
  pointer-events: none;
  user-select: none;
}

.header {
  display: grid;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0;
  opacity: 0.75;
}

.error {
  margin: 0;
  color: rgba(255, 120, 120, 0.95);
}

.link {
  margin-top: 8px;
  align-self: flex-start;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.75);
}

.linkStrong {
  color: rgba(255, 255, 255, 0.95);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hero {
  position: absolute;
  inset: 0;
  width: 50%;
  z-index: 3;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.94);
  transition: transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: none;
}

.heroLeft {
  transform: translateX(0%);
}

.heroRight {
  transform: translateX(100%);
}

.heroInner {
  width: min(320px, 80%);
  text-align: center;
  display: grid;
  gap: 12px;
  pointer-events: none;
}

.heroTitle {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.heroText {
  margin: 0;
  opacity: 0.9;
}

.heroCta {
  margin-top: 6px;
  display: grid;
  place-items: center;
}

.heroPill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: rgba(40, 40, 40, 0.95);
  font-weight: 650;
  border: none;
  cursor: pointer;
  pointer-events: auto;
}

.linkHidden {
  opacity: 0;
  pointer-events: none;
  user-select: none;
}

@media (max-width: 1024px), (max-height: 500px) and (orientation: landscape) {
  .card {
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: none;
    background: transparent;
    border: none;
  }

  .stage {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
    min-height: auto;
  }

  .bg,
  .hero {
    display: none;
  }

  .panel {
    padding: 24px 20px;
    background: rgba(25, 25, 25, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    width: 100%;
    animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    grid-column: auto;
    position: relative;
  }

  .left,
  .right {
    grid-column: auto;
    position: static;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .active {
    opacity: 1;
    z-index: 1;
    pointer-events: auto;
  }

  .link {
    align-self: center;
    padding: 14px;
    margin-top: 8px;
    width: 100%;
    text-align: center;
    display: block;
  }

  .linkHidden {
    display: none;
  }

  .right {
    border-top: none;
  }
}
</style>



