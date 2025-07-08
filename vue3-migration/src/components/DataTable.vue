<!--
 * @fileoverview Main DataTable component - A highly configurable and performant Vue 3 data table
 * 
 * This component provides:
 * - Virtual scrolling for large datasets
 * - Column management with drag & drop
 * - Sorting, filtering, and pagination
 * - Fixed columns support
 * - Accessibility features
 * - TypeScript support
 * 
 * @example
 * <DataTable 
 *   :columns="columns"
 *   :data="data" 
 *   :total="total"
 *   :virtualized="true"
 *   @update:query="handleQueryUpdate"
 * />
-->

<template>
  <div 
    class="mh-datatable" 
    :class="containerClasses"
    role="application"
    :aria-label="ariaLabel || 'Data table'"
    :aria-busy="loading"
  >
    <!-- Header Actions -->
    <header 
      v-if="$slots.default || showHeaderSettings" 
      class="mh-datatable__header"
    >
      <HeaderSettings 
        v-if="showHeaderSettings" 
        class="mh-datatable__settings"
        :columns="columns" 
        :support-backup="supportBackup"
        @update:columns="handleColumnsUpdate"
      />
      <div class="mh-datatable__actions">
        <slot name="actions" />
      </div>
      <slot />
    </header>

    <!-- Main Table -->
    <main class="mh-datatable__content">
      <Table
        ref="tableRef"
        :columns="finalColumns"
        :header-columns="columns"
        :complex-headers="complexHeadersEnabled"
        :data="finalData"
        :total="total"
        :query="query"
        :loading="loading"
        :selectable="selectable"
        :virtualized="virtualized"
        :virtual-item-height="virtualItemHeight"
        :virtual-container-height="virtualContainerHeight"
        :virtual-buffer="virtualBuffer"
        :context-menu-options="contextMenuOptions"
        :support-nested="supportNested"
        :nested-grid="nestedConfig"
        :group-config="groupConfig"
        :tbl-class="tblClass"
        :tbl-style="tblStyle"
        :height="height"
        :comp-reg="compReg"
        :xprops="xprops"
        @force-grid-store="handleGridStore" 
        @reset-columns="handleResetColumns" 
        @reset-filters="handleResetFilters"
        @sort="handleSort"
        @filter="handleFilter"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
        @nested-toggle="(row: any, expanded: boolean) => emit('nested-toggle', row, expanded)"
        @group-toggle="(groupKey: string) => toggleGroup(groupKey)"
      >
        <!-- Pass through all slots -->
        <template v-for="(_, slot) in $slots" #[slot]="scope" :key="slot">
          <slot :name="slot" v-bind="scope" />
        </template>
      </Table>
    </main>
    
    <!-- Footer with Pagination -->
    <footer 
      v-if="showPagination" 
      class="mh-datatable__footer"
    >
      <Pagination
        :total="total"
        :query="query"
        @page-change="handlePageChange"
      />
      
      <div class="mh-datatable__actions">
        <button 
          v-if="showSaveGridViewButton" 
          type="button"
          class="mh-button mh-button--secondary"
          :disabled="loading"
          @click="exportGridSettingsToJson"
          aria-label="Save grid view"
        >
          💾
          <span class="sr-only">Save grid view</span>
        </button>   
        
        <button 
          type="button"
          class="mh-button mh-button--secondary"
          :disabled="loading"
          @click="handleRefreshEvent"
          aria-label="Refresh data"
        >
          🔄
          <span class="sr-only">Refresh data</span>
        </button>  
      </div>
    </footer>

    <!-- Loading Overlay -->
    <div 
      v-if="loading" 
      class="mh-datatable__loading"
      role="status"
      aria-label="Loading data"
    >
      <div class="mh-spinner" />
      <span class="sr-only">Loading data</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTableState } from '@/composables/useTableState'
import { useTableActions } from '@/composables/useTableActions'
import { useGrouping } from '@/composables/useGrouping'
import { useNestedGrid } from '@/composables/useNestedGrid'
import { useComplexHeaders } from '@/composables/useComplexHeaders'
import type { TableProps, TableEmits, TableColumn, TableQuery } from '@/types'

// Import existing components
import HeaderSettings from './HeaderSettings/HeaderSettings.vue'
import Table from './Table/Table.vue'
import Pagination from './Pagination/Pagination.vue'

/**
 * Component Props with comprehensive defaults
 */
const props = withDefaults(defineProps<TableProps>(), {
  loading: false,
  selectable: false,
  virtualized: false,
  virtualItemHeight: 48,
  virtualContainerHeight: 400,
  virtualBuffer: 5,
  supportNested: false,
  supportBackup: false,
  showSaveGridViewButton: false,
  pageSizeOptions: () => [10, 20, 40, 50, 80, 100],
  contextMenuOptions: () => [],
  showHeaderSettings: true,
  showPagination: true,
  ariaLabel: 'Data table'
})

/**
 * Component Emits
 */
const emit = defineEmits<TableEmits>()

/**
 * Composables for state management
 */
const { 
  columns, 
  data, 
  query, 
  loading: internalLoading, 
  total,
  visibleColumns,
  currentPage,
  totalPages 
} = useTableState(props)

const { 
  handleSort, 
  handleFilter, 
  handlePageChange: handlePageChangeAction,
  handlePageSizeChange: handlePageSizeChangeAction,
  handleRowClick: baseHandleRowClick,
  handleSelectionChange,
  handleRefresh,
  loadData
} = useTableActions(props, emit)

// Advanced features composables
const groupConfig = computed(() => props.grouping)
const nestedConfig = computed(() => props.nestedGrid)

// Create a computed data source for grouping that considers nested processing
const groupingDataSource = computed(() => {
  if (nestedConfig.value?.enabled) {
    return nestedFlattenedData.value
  }
  return data.value
})

const { 
  groupedData, 
  flattenedData: groupedFlattenedData, 
  toggleGroup, 
  expandAllGroups, 
  collapseAllGroups 
} = useGrouping(groupingDataSource, groupConfig, query)

const { 
  processedData: nestedProcessedData, 
  flattenedData: nestedFlattenedData, 
  toggleNestedRow 
} = useNestedGrid(data, nestedConfig)

const {
  headerStructure,
  leafColumns,
  hasComplexHeaders
} = useComplexHeaders(columns)

const complexHeadersEnabled = computed(() => hasComplexHeaders.value)

// Determine final data to display based on enabled features
const finalData = computed(() => {
  // If grouping is enabled, use grouped data (which already includes nested processing if enabled)
  if (groupConfig.value?.field) {
    return groupedFlattenedData.value
  }
  
  // If only nested is enabled, use nested data
  if (nestedConfig.value?.enabled) {
    return nestedFlattenedData.value
  }
  
  // Otherwise use raw data
  return data.value
})

// Determine final columns based on complex headers
const finalColumns = computed(() => {
  if (complexHeadersEnabled.value) {
    return leafColumns.value
  }
  return columns.value
})

// Custom row click handler that includes nested grid logic
const handleRowClick = (row: any, index: number, event?: MouseEvent) => {
  console.log('DataTable handleRowClick:', row.name, 'hasNested:', row._hasNested)
  
  // Handle nested grid toggle if enabled and row has nested content
  if (nestedConfig.value?.enabled && row._hasNested && row.__nested__?.$toggle) {
    console.log('Toggling nested row via $toggle function')
    row.__nested__.$toggle()
  }
  
  // Emit the row-click event to parent (demo component)
  baseHandleRowClick(row, index, event)
}

// Simple settings management without external composable
const saveGridSettings = () => {
  if (props.supportBackup && props.gridName) {
    const settings = {
      columns: columns.value,
      query: query.value
    }
    localStorage.setItem(`datatable-${props.gridName}`, JSON.stringify(settings))
  }
}

const loadGridSettings = () => {
  if (props.supportBackup && props.gridName) {
    const saved = localStorage.getItem(`datatable-${props.gridName}`)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        if (settings.columns) {
          columns.value = settings.columns
        }
        if (settings.query) {
          query.value = { ...query.value, ...settings.query }
        }
      } catch (e) {
        console.warn('Failed to load grid settings:', e)
      }
    }
  }
}

const exportGridSettingsToJson = () => {
  const settings = {
    columns: columns.value,
    query: query.value,
    timestamp: new Date().toISOString()
  }
  const dataStr = JSON.stringify(settings, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.gridName || 'datatable'}-settings.json`
  link.click()
  URL.revokeObjectURL(url)
  emit('table-settings-exported', dataStr)
}

// Refs
const tableRef = ref()

/**
 * Computed Properties
 */
const loading = computed(() => props.loading || internalLoading.value)

const containerClasses = computed(() => [
  'mh-datatable',
  {
    'mh-datatable--loading': loading.value,
    'mh-datatable--virtualized': props.virtualized,
    'mh-datatable--selectable': props.selectable,
    'mh-datatable--compact': props.compact
  }
])

const tableProps = computed(() => ({
  data: data.value,
  selectable: props.selectable,
  contextMenuOptions: props.contextMenuOptions,
  supportNested: props.supportNested,
  tblClass: props.tblClass,
  tblStyle: props.tblStyle,
  height: props.height,
  compReg: props.compReg,
  xprops: props.xprops
}))

/**
 * Event Handlers
 */
const handleColumnsUpdate = (newColumns: TableColumn[]) => {
  columns.value = newColumns
  emit('update:columns', newColumns)
  
  // Auto-save if backup is enabled
  if (props.supportBackup) {
    nextTick(() => saveGridSettings())
  }
}

const handleGridStore = () => {
  if (props.supportBackup) {
    saveGridSettings()
  }
  // Using datasource-refresh as a placeholder since force-grid-store isn't in TableEmits
  emit('datasource-refresh')
}

const handleResetColumns = () => {
  const filteredColumnsFields = columns.value
    .filter(x => x.isFilterApplied === true)
    .map(x => x.field) || []
  
  columns.value = props.columns.map((x, i) => ({
    ...x,
    index: i,
    isFilterApplied: filteredColumnsFields.includes(x.field),
    colStyle: {
      width: 'auto',
      ...x.colStyle
    }
  }))
  
  emit('update:columns', columns.value)
  emit('reset-filters') // This event exists in TableEmits
}

const handleResetFilters = () => {
  emit('reset-filters')
}

const handlePageChange = (page: number) => {
  handlePageChangeAction(page)
  emit('page-change', page)
}

const handlePageSizeChange = (size: number) => {
  handlePageSizeChangeAction(size)
  emit('page-size-change', size)
}

const handleRefreshEvent = () => {
  if (props.dataSource?.read) {
    query.value.offset = 0
    loadData()
  } else {
    handleRefresh()
  }
  emit('datasource-refresh')
}

/**
 * Lifecycle
 */
// Initialize grid settings on mount
if (props.supportBackup) {
  loadGridSettings()
}

/**
 * Performance optimizations
 */
// Watch for prop changes and optimize re-renders
watch(() => props.data, (newData) => {
  if (newData && newData !== data.value) {
    data.value = newData
  }
}, { deep: false }) // Shallow watch for performance

watch(() => props.columns, (newColumns) => {
  if (newColumns && newColumns !== columns.value) {
    handleColumnsUpdate(newColumns)
  }
}, { deep: false })

// Expose public methods
defineExpose({
  refresh: handleRefreshEvent,
  exportSettings: exportGridSettingsToJson,
  resetColumns: handleResetColumns,
  resetFilters: handleResetFilters,
  getTableRef: () => tableRef.value
})
</script>

<style scoped>
/**
 * Component-specific styles
 * Core table styles are in global CSS files
 */
.mh-datatable {
  --mh-datatable-border-radius: var(--mh-border-radius-lg);
  --mh-datatable-shadow: var(--mh-shadow-md);
  
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: var(--mh-datatable-border-radius);
  box-shadow: var(--mh-datatable-shadow);
  background: var(--mh-bg-primary);
  overflow: hidden;
}

.mh-datatable__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--mh-spacing-4);
  border-bottom: 1px solid var(--mh-border-color);
  background: var(--mh-bg-secondary);
}

.mh-datatable__content {
  flex: 1;
  min-height: 0; /* Important for flexbox child */
  position: relative;
}

.mh-datatable__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--mh-spacing-3) var(--mh-spacing-4);
  border-top: 1px solid var(--mh-border-color);
  background: var(--mh-bg-secondary);
}

.mh-datatable__actions {
  display: flex;
  align-items: center;
  gap: var(--mh-spacing-2);
}

.mh-datatable__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--mh-bg-primary-rgb), 0.8);
  backdrop-filter: blur(2px);
  z-index: var(--mh-z-modal);
}

/* Compact mode */
.mh-datatable--compact .mh-datatable__header,
.mh-datatable--compact .mh-datatable__footer {
  padding: var(--mh-spacing-2) var(--mh-spacing-3);
}

/* Loading state */
.mh-datatable--loading {
  pointer-events: none;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus management */
.mh-datatable:focus-within {
  outline: 2px solid var(--mh-color-primary);
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .mh-datatable__header,
  .mh-datatable__footer {
    display: none;
  }
  
  .mh-datatable {
    box-shadow: none;
    border: 1px solid var(--mh-border-color);
  }
}
</style> 