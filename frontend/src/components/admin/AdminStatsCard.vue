<script setup lang="ts">
import type { AdminStatsDTO } from '@/types/admin.types';

type Props = {
  stats: AdminStatsDTO | null;
  loading: boolean;
  error: string | null;
};

defineProps<Props>();
</script>

<template>
  <section class="card card--glass">
    <div class="card__body">
      <header :class="$style.header">
        <h2 :class="$style.title">Statystyki</h2>
        <p class="muted">Quick overview of the system status.</p>
      </header>

      <p v-if="error" :class="$style.error" role="status">
        {{ error }}
      </p>

      <div :class="$style.statsGrid" aria-live="polite">
        <article :class="$style.statTile">
          <div :class="$style.statLabel">Users</div>
          <div :class="$style.statValue">
            <span v-if="loading">—</span>
            <span v-else>{{ stats?.totalUsers ?? 0 }}</span>
          </div>
        </article>

        <article :class="$style.statTile">
          <div :class="$style.statLabel">Courses</div>
          <div :class="$style.statValue">
            <span v-if="loading">—</span>
            <span v-else>{{ stats?.totalCourses ?? 0 }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style module>
.header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.title {
  margin: 0;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-tight);
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.statTile {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.statLabel {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.statValue {
  margin-top: var(--space-2);
  font-size: var(--text-2xl);
  font-weight: 750;
  letter-spacing: var(--tracking-tight);
}

.error {
  margin-bottom: var(--space-3);
  color: rgba(255, 170, 170, 0.95);
}

@media (max-width: 640px) {
  .statsGrid {
    grid-template-columns: 1fr;
  }
}
</style>

