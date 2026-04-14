<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SessionCard from '@/components/sessions/SessionCard.vue';

import { useAuthStore } from '@/stores/auth.store';
import { useSessionsStore } from '@/stores/sessions.store';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const sessionsStore = useSessionsStore();

const isHistoryVisible = ref(false);

const onLogoutAll = async (): Promise<void> => {
  await authStore.logoutAll();

  await router.replace({
    name: 'auth',
    query: {
      mode: 'signin',
      redirect: route.fullPath,
    },
  });
};

const onRevokeOtherSessions = async (): Promise<void> => {
  await sessionsStore.revokeOtherSessions();
};

const onRevokeSingleSession = async (sessionId: string): Promise<void> => {
  await sessionsStore.revokeSession(sessionId);
};

const toggleHistoryVisibility = (): void => {
  isHistoryVisible.value = !isHistoryVisible.value;
};

onMounted(async () => {
  await sessionsStore.fetchSessions();
});
</script>

<template>
  <main class="container">
    <section class="card">
      <div class="card__body" :class="$style.page">
        <header :class="$style.header">
          <div :class="$style.headerContent">
            <h1 :class="$style.title">Sessions</h1>
            <p class="muted">
              Manage active devices and review login history.
            </p>
          </div>

          <div :class="$style.headerActions">
            <button
              type="button"
              class="btn btn-danger"
              :disabled="authStore.logoutAllLoading || sessionsStore.isBusy"
              @click="onLogoutAll"
            >
              Sign out everywhere
            </button>
          </div>
        </header>

        <div v-if="sessionsStore.isFetching" class="muted">
          Loading sessions...
        </div>

        <div
          v-else-if="sessionsStore.error"
          :class="$style.errorBox"
          role="alert"
        >
          {{ sessionsStore.error }}
        </div>

        <div v-else :class="$style.content">
          <section :class="$style.section" aria-labelledby="active-sessions-title">
            <div :class="$style.sectionHeader">
              <div>
                <h2 id="active-sessions-title" :class="$style.sectionTitle">
                  Active sessions
                </h2>
                <p class="muted">
                  Here you can see current and still valid sessions.
                </p>
              </div>

              <button
                type="button"
                class="btn"
                :disabled="
                  sessionsStore.isBusy ||
                  !sessionsStore.hasOtherActiveSessions
                "
                @click="onRevokeOtherSessions"
              >
                {{
                  sessionsStore.isRevokingOtherSessions
                    ? 'Signing out others...'
                    : 'Sign out all other sessions'
                }}
              </button>
            </div>

            <p
              v-if="sessionsStore.activeItems.length === 0"
              class="muted"
            >
              No active sessions.
            </p>

            <div v-else :class="$style.list">
              <SessionCard
                v-for="sessionItem in sessionsStore.activeItems"
                :key="sessionItem.id"
                :item="sessionItem"
                mode="active"
                :revoke-busy="sessionsStore.revokingSessionId === sessionItem.id"
                :actions-disabled="sessionsStore.isBusy"
                @revoke="onRevokeSingleSession"
              />
            </div>
          </section>

          <section :class="$style.section" aria-labelledby="history-sessions-title">
            <div :class="$style.sectionHeader">
              <div>
                <h2 id="history-sessions-title" :class="$style.sectionTitle">
                  Session history
                </h2>
                <p class="muted">
                  Expired or previously signed-out sessions.
                </p>
              </div>

              <button
                type="button"
                class="btn btn-ghost"
                :aria-expanded="isHistoryVisible"
                aria-controls="sessions-history-panel"
                @click="toggleHistoryVisibility"
              >
                {{ isHistoryVisible ? 'Hide history' : 'Show history' }}
              </button>
            </div>

            <div
              v-if="isHistoryVisible"
              id="sessions-history-panel"
              :class="$style.historyPanel"
            >
              <p
                v-if="sessionsStore.historyItems.length === 0"
                class="muted"
              >
                No session history.
              </p>

              <div v-else :class="$style.list">
                <SessionCard
                  v-for="sessionItem in sessionsStore.historyItems"
                  :key="sessionItem.id"
                  :item="sessionItem"
                  mode="history"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<style module>
.page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.headerContent {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.headerActions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.title {
  margin: 0;
  font-size: var(--text-2xl);
  line-height: 1.15;
  letter-spacing: var(--tracking-tight);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sectionHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.sectionTitle {
  margin: 0 0 var(--space-1);
  font-size: var(--text-xl);
  line-height: 1.2;
}

.list {
  display: grid;
  gap: var(--space-4);
}

.historyPanel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.errorBox {
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, var(--color-border));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .header,
  .sectionHeader {
    flex-direction: column;
    align-items: stretch;
  }

  .headerActions {
    width: 100%;
  }
}
</style>


