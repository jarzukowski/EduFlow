<script setup lang="ts">
import type { TeacherOverview } from '@/types/teacherDashboard.types';

defineProps<{
  overview: TeacherOverview;
}>();

const formatTotalDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes} min`;
  }

  return `${hours} h ${remainingMinutes} min`;
};
</script>

<template>
  <section class="card card--glass">
    <div class="card__body">
      <h2 :class="$style.heading">Overview</h2>

      <div :class="$style.statsGrid">
        <div :class="$style.statTile">
          <div :class="$style.statLabel">Courses</div>
          <div :class="$style.statValue">{{ overview.coursesCount }}</div>
        </div>

        <div :class="$style.statTile">
          <div :class="$style.statLabel">Lessons</div>
          <div :class="$style.statValue">{{ overview.lessonsCount }}</div>
        </div>

        <div :class="$style.statTile">
          <div :class="$style.statLabel">Students</div>
          <div :class="$style.statValue">{{ overview.studentsCount }}</div>
        </div>

        <div :class="$style.statTile">
          <div :class="$style.statLabel">Total time</div>
          <div :class="$style.statValue">
            {{ formatTotalDuration(overview.totalDurationMinutes) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style module>
.heading {
  margin: 0;
  font-size: var(--text-lg);
}

.statsGrid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.statTile {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
}

.statLabel {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.statValue {
  margin-top: 6px;
  font-size: var(--text-xl);
  font-weight: 850;
  letter-spacing: var(--tracking-tight);
}
</style>



