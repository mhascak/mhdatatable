<template>
  <table :class="['mh-table', { 'mh-table--compact': compact }, tableClass]" :style="{ 'table-layout': 'fixed', 'min-width': '0', 'width': '100%' }">
    <colgroup>
      <col v-if="shouldRenderSelection" style="width: 30px; min-width: 30px;" />
      <col v-for="col in tableColumns"
        :data-index="col.index"
        :class="col.colClass"
        :key="col.field"
        :style="{
          width: col.colStyle?.width || (typeof col.width === 'number' ? col.width + 'px' : col.width) || '120px',
          minWidth: col.colStyle?.minWidth || '80px'
        }"
      />
    </colgroup>
    <slot />
  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tblClass?: string | string[] | Record<string, boolean>,
  tblStyle?: any,
  colWidth?: string | number,
  tableColumns?: any[],
  shouldRenderSelection?: boolean,
  summary?: Record<string, any>,
  compact?: boolean
}>()

const tableClass = computed(() => {
  let base: (string | Record<string, boolean>)[] = [
    'table',
    'table-striped',
    'table-hover'
  ]
  if (typeof props.tblClass === 'string') {
    base.push(props.tblClass)
  } else if (Array.isArray(props.tblClass)) {
    base.push(...props.tblClass)
  } else if (typeof props.tblClass === 'object' && props.tblClass !== null) {
    base.push(props.tblClass)
  }
  return base
})
</script> 