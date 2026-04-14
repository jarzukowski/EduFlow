<script setup lang="ts">
import { computed } from 'vue';

import type { StudentProgressMetrics } from '@/types/studentDashboard.types';

type DonutChartModel = {
  percent: number;
  completedLessons: number;
  totalLessons: number;
  circumference: number;
  dashOffset: number;
  ariaLabel: string;
};

const props = defineProps<{
  courseProgress: StudentProgressMetrics;
  overallProgress: StudentProgressMetrics;
}>();

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

const buildDonutChartModel = (progress: StudentProgressMetrics): DonutChartModel => {
  const percent = clampPercent(progress.percent);
  const completedLessons = Math.max(0, progress.completedLessons);
  const totalLessons = Math.max(0, progress.totalLessons);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

  return {
    percent,
    completedLessons,
    totalLessons,
    circumference,
    dashOffset,
    ariaLabel: `Progress: ${percent}%. Completed ${completedLessons} of ${totalLessons} lessons.`,
  };
};

const courseDonutChart = computed<DonutChartModel>(() => {
  return buildDonutChartModel(props.courseProgress);
});

const overallDonutChart = computed<DonutChartModel>(() => {
  return buildDonutChartModel(props.overallProgress);
});
</script>

<template>
  <section class="card card--glass">
    <div class="card__body">
      <h2 :class="$style.heading">Progress</h2>

      <div :class="$style.chartGrid">
        <div :class="$style.chartCard">
          <div class="muted" :class="$style.chartLabel">
            <span :class="$style.chartLabelStrong">Current course</span>
          </div>

          <div
            :class="$style.chartWrapper"
            role="img"
            :aria-label="courseDonutChart.ariaLabel"
          >
            <svg viewBox="0 0 120 120" :class="$style.chartSvg" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r="44"
                :class="$style.chartTrack"
              />
              <circle
                cx="60"
                cy="60"
                r="44"
                :class="$style.chartProgress"
                :stroke-dasharray="`${courseDonutChart.circumference} ${courseDonutChart.circumference}`"
                :stroke-dashoffset="courseDonutChart.dashOffset"
              />
            </svg>

            <div :class="$style.chartCenter">
              <div :class="$style.chartPercent">{{ courseDonutChart.percent }}%</div>
              <div class="muted">
                {{ courseDonutChart.completedLessons }} / {{ courseDonutChart.totalLessons }}
              </div>
            </div>
          </div>
        </div>

        <div :class="$style.chartCard">
          <div class="muted" :class="$style.chartLabel">
            <span :class="$style.chartLabelStrong">Overall</span>
          </div>

          <div
            :class="$style.chartWrapper"
            role="img"
            :aria-label="overallDonutChart.ariaLabel"
          >
            <svg viewBox="0 0 120 120" :class="$style.chartSvg" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r="44"
                :class="$style.chartTrack"
              />
              <circle
                cx="60"
                cy="60"
                r="44"
                :class="$style.chartProgress"
                :stroke-dasharray="`${overallDonutChart.circumference} ${overallDonutChart.circumference}`"
                :stroke-dashoffset="overallDonutChart.dashOffset"
              />
            </svg>

            <div :class="$style.chartCenter">
              <div :class="$style.chartPercent">{{ overallDonutChart.percent }}%</div>
              <div class="muted">
                {{ overallDonutChart.completedLessons }} / {{ overallDonutChart.totalLessons }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="muted" :class="$style.note">
        Mark lesson completion using the checkbox in lesson details.
      </p>
    </div>
  </section>
</template>

<style module>
.heading {
  margin: 0;
  font-size: var(--text-lg);
}

.chartGrid {
  margin-top: var(--space-4);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.chartCard {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.04);
}

.chartLabel {
  margin-bottom: 10px;
  font-size: var(--text-xs);
  display: flex;
  align-items: baseline;
}

.chartLabelStrong {
  font-weight: 800;
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
}

.chartWrapper {
  position: relative;
  width: 100%;
  height: 180px;
  display: grid;
  place-items: center;
}

.chartSvg {
  width: 100%;
  height: 100%;
  max-width: 180px;
  max-height: 180px;
}

.chartTrack {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 12;
}

.chartProgress {
  fill: none;
  stroke: rgba(124, 92, 255, 0.85);
  stroke-width: 12;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 60px 60px;
  transition: stroke-dashoffset var(--dur-fast) var(--ease-out);
}

.chartCenter {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  pointer-events: none;
  transform: translateY(-10px);
}

.chartPercent {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: var(--tracking-tight);
  line-height: 1.05;
  margin-bottom: 2px;
}

.note {
  margin-top: var(--space-4);
}

@media (max-width: 1024px) {
  .chartGrid {
    grid-template-columns: 1fr;
  }
}
</style>


