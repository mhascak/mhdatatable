<template>
  <tbody class="mh-table-body">
    <template v-if="data.length">
      <!-- Render all provided rows (virtualization handled by parent) -->
      <template v-for="(row, rowIndex) in displayRows" :key="getRowKey(row, rowIndex)">
        <tr v-show="!row._isHide" :class="'mh-table-row'" :style="{ height: `${rowHeight}px` }" :data-index="getOriginalIndex(rowIndex)" @click="handleRowClick(row, getOriginalIndex(rowIndex))">
          <td class="mh-table-cell -selectable-column" v-if="shouldRenderSelection">
            <MultiSelect :status="getCheckboxStatus(row, getOriginalIndex(rowIndex))" :value="row._isChecked" @onChange="checked => handleEvent(null, 'checkbox', { row, rowIndex: getOriginalIndex(rowIndex) }, { isChecked: checked })" />
          </td>
          <td v-for="(col, colIndex) in tableColumns" :key="colIndex" class="mh-table-cell" :class="col.tdClass">
            <template v-if="$slots[`cell-${col.field}`]">
              <slot :name="`cell-${col.field}`" :row="row" :value="resolvePath(row, col.field, null)" :field="col.field" :column="col" />
            </template>
            <template v-else-if="col.tdComp">
              <component :is="col.tdComp" :row="row" :value="resolvePath(row, col.field, null)" :field="col.field" :column="col" />
            </template>
            <template v-else>
              {{ resolvePath(row, col.field, null) }}
            </template>
          </td>
        </tr>
        <template v-if="row.__nested__ && row.__nested__.visible && !leftFixed && !rightFixed">
          <tr :key="getRowKey(row, rowIndex) + '-nested'">
            <td :colspan="totalColumns">
              <component 
                :is="forDynCompIs(row.__nested__.comp)" 
                :row="row" 
                :nested="row.__nested__" 
                @rowDetailMounted="handleRowDetailMounted($event, { row, rowIndex: getOriginalIndex(rowIndex) })" 
                @vue:mounted="() => console.log('Nested component mounted for row:', row.name, 'rowKey:', getRowKey(row, rowIndex), 'visible:', row.__nested__?.visible, 'nested:', row.__nested__)"
              />
            </td>
          </tr>
        </template>

        <template v-else-if="row.__nested__ && row.__nested__.visible">
          <tr :key="getRowKey(row, rowIndex) + '-empty'" :style="{ height: (row._rowDetailHeight ?? 0) + 1 + 'px' }">
            <td :colspan="totalColumns"></td>
          </tr>
        </template>
      </template>
    </template>
    <tr v-else-if="!leftFixed && !rightFixed">
      <td :colspan="totalColumns" class="mh-table-cell text-center text-muted">No Data</td>
    </tr>
  </tbody>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import MultiSelect from './MultiSelect.vue'
import type { TableColumn, TableRow } from '@/types'

const props = defineProps<{
  tableColumns: TableColumn[],
  data: TableRow[],
  shouldRenderSelection?: boolean,
  leftFixed?: boolean,
  rightFixed?: boolean,
  showSelection?: boolean,
  virtualized?: boolean,
  rowHeight?: number,
  containerHeight?: number,
  scrollTop?: number,
  compReg?: Record<string, any>
}>()

const emit = defineEmits(['handle-event'])

// Virtual scrolling is now handled in parent Table component
const rowHeight = computed(() => props.rowHeight || 60)

// Display all provided data (virtualization handled by parent)
const displayRows = computed(() => props.data)

// Total columns for colspan
const totalColumns = computed(() => {
  return props.tableColumns.length + (props.shouldRenderSelection ? 1 : 0)
})

// Get original data index (virtualization handled by parent)
const getOriginalIndex = (displayIndex: number) => displayIndex

// Generate row key
const getRowKey = (row: any, index: number) => {
  const originalIndex = getOriginalIndex(index)
  return row.id || row._id || `row_${originalIndex}`
}

function resolvePath(object: any, path: string, defaultValue: any) {
  if (!object || typeof path !== 'string') {
    return defaultValue;
  }
  return (object as any)[path] ?? defaultValue;
}

function handleRowDetailMounted(e: any, data: any) {
  handleEvent(e, 'rowDetailMounted', data, { height: e.height })
}

function handleEvent($event: any, type: string, data?: any, others?: any) {
  emit('handle-event', $event, type, data, others)
}

function getCheckboxStatus(row: any, rowIndex: number) {
  const hasChildren = row._childrenLen > 0
  let allCheck = hasChildren ? true : row._isChecked
  let indeterminate = false
  return { allCheck, indeterminate }
}

function forDynCompIs(comp: any) {
  // If comp is a string, resolve it from the component registry
  if (typeof comp === 'string' && props.compReg) {
    return props.compReg[comp] || comp
  }
  return comp
}

function handleRowClick(row: any, rowIndex: number) {
  // Debug: Log the row state before emitting
  console.log('TableBody handleRowClick:', row.name, 'rowKey:', getRowKey(row, rowIndex), 'nested visible:', row.__nested__?.visible)
  
  // Emit row-click event for nested grid functionality
  handleEvent(null, 'rowClick', { row, rowIndex }, {})
}

onMounted(() => {
  console.log('TableBody mounted with virtualization:', props.virtualized)
})
</script>

<style scoped>
.mh-table-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.virtual-spacer {
  pointer-events: none;
}

.virtual-spacer td {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}
</style> 