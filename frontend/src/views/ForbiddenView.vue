<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LottieAnimation from '@/components/common/LottieAnimation.vue';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isAuthenticated = computed<boolean>(() => authStore.isAuthenticated);

const navigateBack = async (): Promise<void> => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  await router.push({ name: 'home' });
};

const navigateHome = async (): Promise<void> => {
  await router.push({ name: 'home' });
};

const navigateToAuth = async (): Promise<void> => {
  await router.push({
    name: 'auth',
    query: {
      mode: 'signin',
      redirect: String(route.query.from ?? '/'),
    },
  });
};
</script>

<template>
  <main class="container" :class="$style.page">
    <section class="card" :class="$style.card" aria-labelledby="forbidden-title">
      <div class="card__body" :class="$style.body">
        <LottieAnimation src="/lottie/forbidden.json" />

        <div :class="$style.text">
          <h1 id="forbidden-title" :class="$style.title">Access denied</h1>

          <p class="muted" :class="$style.subtitle">
            You to not have permission to access this section. If this is a mistake, sign in to
            the correct account or contact an administrator.
          </p>

          <div :class="$style.actions">
            <button type="button" class="btn btn--ghost" @click="navigateBack">
              ← Back
            </button>

            <button type="button" class="btn" @click="navigateHome">
              Home
            </button>

            <button
              v-if="!isAuthenticated"
              type="button"
              class="btn"
              @click="navigateToAuth"
            >
              Sign in
            </button>
          </div>

          <p v-if="!isAuthenticated" class="muted" :class="$style.hint">
            Sign in to continue. After signing in, we will return you to
            the place you tried to open.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style module>
.page {
  display: grid;
  min-height: calc(100vh - 140px);
  padding-block: var(--space-7);
  place-items: center;
}

.card {
  width: min(920px, 100%);
}

.body {
  display: grid;
  align-items: center;
  gap: var(--space-6);
}

.text {
  display: grid;
  gap: var(--space-3);
  text-align: center;
}

.title {
  margin: 0;
  font-size: var(--text-3xl);
  letter-spacing: var(--tracking-tight);
}

.subtitle {
  max-width: 60ch;
  margin: 0 auto;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.hint {
  margin-top: var(--space-2);
}

@media (min-width: 900px) {
  .body {
    grid-template-columns: 1fr 1fr;
  }

  .text {
    text-align: left;
  }

  .subtitle {
    margin: 0;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>




