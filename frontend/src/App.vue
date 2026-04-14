<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';

import AppNavbar from '@/components/layout/AppNavbar.vue';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

const showNavbar = computed<boolean>(() => authStore.isAuthenticated);
</script>

<template>
  <div :class="$style.appShell">
    <AppNavbar v-if="showNavbar" />

    <main :class="$style.appMain">
      <RouterView />
    </main>
  </div>
</template>

<style module>
.appShell {
  min-height: 100vh;
}

.appMain {
  padding: var(--space-5);
}

@media (max-width: 640px) {
  .appMain {
    padding: var(--space-4);
  }
}
</style>
