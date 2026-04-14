<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AuthCard from '../../components/auth/AuthCard.vue';
import { useAuthStore } from '@/stores/auth.store.ts';

type AuthMode = 'signin' | 'signup';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const mode = computed<AuthMode>(() => {
  const rawMode = route.query.mode;
  return rawMode === 'signup' ? 'signup' : 'signin';
});

const busy = computed<boolean>(() => {
  return mode.value === 'signin'
    ? auth.loginLoading
    : auth.registerLoading;
});

const onSwitchMode = (): void => {
  const nextMode: AuthMode = mode.value === 'signin' ? 'signup' : 'signin';

  router.replace({
    name: 'auth',
    query: { mode: nextMode },
  });
};

const onSignIn = async (payload: { email: string; password: string }): Promise<void> => {
  await auth.login(payload.email, payload.password);
  await router.replace({ name: 'home' });
};

const onSignUp = async (payload: {
  username: string;
  email: string;
  password: string;
}): Promise<void> => {
  await auth.register(payload.email, payload.username, payload.password);

  await router.replace({
    name: 'auth',
    query: { mode: 'signin' },
  });
};
</script>

<template>
  <section :class="$style.authPage">
    <AuthCard
      :mode="mode"
      :busy="busy"
      :error="auth.error"
      @switchMode="onSwitchMode"
      @signIn="onSignIn"
      @signUp="onSignUp"
    />
  </section>
</template>

<style module>
.authPage {
  min-height: 90vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
}
</style>
