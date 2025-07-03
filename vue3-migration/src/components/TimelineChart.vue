<template>
  <div class="timeline-chart">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <rect
        v-for="(value, index) in values"
        :key="index"
        :x="index * (barWidth + barMargin)"
        :y="height - (value / maxValue) * height"
        :width="barWidth"
        :height="(value / maxValue) * height"
        fill="rgba(0, 123, 255, 0.5)"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  values: number[];
}>();

const width = 100;
const height = 20;
const barMargin = 1;

const barWidth = computed(() => {
  if (props.values.length === 0) return 0;
  return (width - (props.values.length - 1) * barMargin) / props.values.length;
});

const maxValue = computed(() => {
  if (props.values.length === 0) return 1;
  return Math.max(...props.values);
});
</script>

<style scoped>
.timeline-chart {
  width: 100%;
  height: 20px;
}
svg {
  width: 100%;
  height: 100%;
}
</style> 