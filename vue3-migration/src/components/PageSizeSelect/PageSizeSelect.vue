<template>
  <div>
    <label class="-page-size-select-label" name="PageSizeSelect">
      <select
        class="form-control input-sm -page-size-select"
        :value="query.limit"
        @change="onChange($event)"
      >
        <option v-for="(i, index) in pageSizeOptions" :value="i" :key="index">{{ i }}</option>
      </select>
    </label>
    <span class="grid-item-per-page">items / page</span>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'

const props = defineProps<{
  query: { limit: number, offset: number },
  pageSizeOptions: number[]
}>()
const emit = defineEmits<{ (e: 'page-size-change', size: number): void }>()

const { query, pageSizeOptions } = toRefs(props)

function onChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  emit('page-size-change', value)
}
</script>

<style scoped>
.-page-size-select {
  margin: 0;
  width: 65px;
  border-radius: 0 !important;
}
.-page-size-select-label {
  margin: 0;
}
</style> 