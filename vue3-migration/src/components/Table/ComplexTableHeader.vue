<template>
  <thead class="mh-table-header mh-table-header--complex">
    <!-- Render each header level -->
    <tr v-for="(level, levelIndex) in headerStructure.headers" :key="levelIndex" class="mh-table-row">
      <!-- Selection column header (only on first level) -->
      <th v-if="shouldRenderSelection && levelIndex === 0" 
          class="mh-table-cell -selectable-column" 
          :rowspan="headerStructure.levels"
          key="--th-multi">
        <MultiSelect 
          :status="{ indeterminate, allCheck }" 
          @onChange="checked => handleEvent(null, 'toggleCheckAll', null, { isChecked: checked })" 
        />
      </th>
      
      <!-- Regular header cells -->
      <th v-for="(header, headerIndex) in level" 
          :key="`${levelIndex}-${headerIndex}-${header.field}`"
          :class="['mh-table-cell', 'mh-table-header-cell', header.class]"
          :style="[header.style, { minWidth: '80px' }]"
          :colspan="header.colspan"
          :rowspan="header.rowspan"
          @click="handleHeaderClick(header, levelIndex, headerIndex)">
        
        <!-- Header content -->
        <div class="mh-table-header-content">
          <!-- Custom header slot -->
          <template v-if="$slots[`header-${header.field}`]">
            <slot :name="`header-${header.field}`" :header="header" :level="levelIndex" />
          </template>
          
          <!-- Dynamic header component -->
          <template v-else-if="getHeaderComponent(header)">
            <component :is="getHeaderComponent(header)" :column="getColumnForHeader(header)" :header="header" />
          </template>
          
          <!-- Default header content -->
          <template v-else>
            <!-- Column menu (only for leaf headers) -->
            <div v-if="isLeafHeader(header)" class="mh-table-header-controls">
              <div v-if="showColumnMenu" 
                   :class="['mh-column-menu-dropdown', { 'mh-column-menu-dropdown--open': columnMenuState.visible && columnMenuState.field === header.field }]">
                <ul class="mh-column-menu-list" role="menu">
                  <li role="menuitem" tabindex="0" @click="emitMenu('sort', getColumnForHeader(header))">⇅ Sort</li>
                  <li role="menuitem" tabindex="0" @click="emitMenu('pin', getColumnForHeader(header))">📌 Pin</li>
                  <li role="menuitem" tabindex="0" @click="emitMenu('autosize', getColumnForHeader(header))">↔ Auto Size</li>
                  <li role="menuitem" tabindex="0" @click="emitMenu('resetColumns', getColumnForHeader(header))">⟲ Reset Columns</li>
                  <li role="menuitem" tabindex="0" @click="emitMenu('filter', getColumnForHeader(header))">⏷ Filter</li>
                </ul>
              </div>
              
              <span class="mh-table-header-menu" 
                    :class="{ 'filter-applied': isFilterApplied(header) }" 
                    @click.prevent.stop="showColumnMenuFor(header)">
                <i class="fa fa-bars" aria-hidden="true"></i>
              </span>
            </div>
            
            <!-- Header title and content -->
            <div class="mh-table-header-title">
              <span class="mh-table-header-text" :title="header.title">{{ header.title }}</span>
              <span class="mh-table-header-info" v-if="getColumnForHeader(header)?.explain">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                  <rect x="7.25" y="4.5" width="1.5" height="1.5" rx="0.75" fill="currentColor"/>
                  <rect x="7.25" y="7" width="1.5" height="4.5" rx="0.75" fill="currentColor"/>
                </svg>
              </span>
              <HeadSort v-if="isSortable(header)" :field="header.field" :query="query" />
            </div>
          </template>
        </div>
        
        <!-- Resize handle (only for leaf headers) -->
        <div v-if="isLeafHeader(header)" 
             ref="resizeContainer" 
             :data-index="getColumnIndex(header)" 
             @mousedown="resizeStart($event, getColumnForHeader(header))" 
             @dragstart="preventDrag" 
             @drag="preventDrag" 
             class="mh-table-resize-handle">
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import { useComplexHeaders } from '@/composables/useComplexHeaders'
import HeadSort from './HeadSort.vue'
import MultiSelect from './MultiSelect.vue'
import type { TableColumn, ComplexHeader, TableQuery } from '@/types'

const props = defineProps({
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true
  },
  query: {
    type: Object as PropType<TableQuery>,
    required: true
  },
  shouldRenderSelection: {
    type: Boolean,
    default: false
  },
  leftFixed: {
    type: Boolean,
    default: false
  },
  rightFixed: {
    type: Boolean,
    default: false
  },
  bodyData: {
    type: Array,
    default: () => []
  },
  showColumnMenu: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'handle-event',
  'header-resize', 
  'sort',
  'menu-action'
])

// Use complex headers composable
const columnsRef = computed(() => props.columns)
const { headerStructure, leafColumns, getColumnByPath, hasComplexHeaders } = useComplexHeaders(columnsRef)

// Column menu state
const columnMenuState = ref({
  visible: false,
  field: '',
  x: 0,
  y: 0
})

// Selection state
const indeterminate = computed(() => {
  const checkedCount = props.bodyData?.filter((row: any) => row._isChecked).length || 0
  return checkedCount > 0 && checkedCount < (props.bodyData?.length || 0)
})

const allCheck = computed(() => {
  return props.bodyData?.length > 0 && props.bodyData?.every((row: any) => row._isChecked)
})

/**
 * Handle header click
 */
function handleHeaderClick(header: ComplexHeader, levelIndex: number, headerIndex: number): void {
  const column = getColumnForHeader(header)
  if (column?.sortable && isLeafHeader(header)) {
    emit('sort', column.field)
  }
  
  emit('handle-event', null, 'header-click', { header, column, levelIndex, headerIndex }, {})
}

/**
 * Check if header is a leaf (bottom-level) header
 */
function isLeafHeader(header: ComplexHeader): boolean {
  return (header.rowspan || 1) > 1 || header.level === headerStructure.value.levels - 1
}

/**
 * Get column for header
 */
function getColumnForHeader(header: ComplexHeader): TableColumn | undefined {
  return getColumnByPath(header.field)
}

/**
 * Get header component
 */
function getHeaderComponent(header: ComplexHeader): any {
  const column = getColumnForHeader(header)
  return column?.thComp
}

/**
 * Check if header is sortable
 */
function isSortable(header: ComplexHeader): boolean {
  const column = getColumnForHeader(header)
  return column?.sortable === true && isLeafHeader(header)
}

/**
 * Check if filter is applied to header
 */
function isFilterApplied(header: ComplexHeader): boolean {
  const column = getColumnForHeader(header)
  return column?.isFilterApplied === true
}

/**
 * Get column index
 */
function getColumnIndex(header: ComplexHeader): number {
  const column = getColumnForHeader(header)
  return column?.index || 0
}

/**
 * Show column menu for header
 */
function showColumnMenuFor(header: ComplexHeader): void {
  const column = getColumnForHeader(header)
  if (!column) return
  
  columnMenuState.value = {
    visible: true,
    field: header.field,
    x: 0,
    y: 0
  }
  
  emit('handle-event', null, 'showColumnMenu', { column, header }, {})
}

/**
 * Emit menu action
 */
function emitMenu(action: string, column: TableColumn | undefined): void {
  if (!column) return
  
  columnMenuState.value.visible = false
  emit('menu-action', action, column)
}

/**
 * Handle resize start
 */
function resizeStart(event: MouseEvent, column: TableColumn | undefined): void {
  if (!column) return
  emit('header-resize', event, column)
}

/**
 * Prevent drag events
 */
function preventDrag(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

/**
 * Handle event delegation
 */
function handleEvent(event: Event | null, type: string, data: any, options: any): void {
  emit('handle-event', event, type, data, options)
}
</script>

<style scoped>
.mh-table-header--complex {
  position: relative;
}

.mh-table-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 40px;
  position: relative;
}

.mh-table-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mh-table-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.mh-table-header-text {
  font-weight: 600;
  color: var(--mh-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mh-table-header-info {
  color: var(--mh-text-muted);
  cursor: help;
  flex-shrink: 0;
}

.mh-table-header-menu {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--mh-text-muted);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mh-table-header-menu:hover {
  background-color: var(--mh-bg-hover);
  color: var(--mh-text-primary);
}

.mh-table-header-menu.filter-applied {
  color: var(--mh-primary);
  background-color: var(--mh-primary-light);
}

/* Complex header specific styles */
.mh-table-header-cell[colspan] {
  text-align: center;
  font-weight: 700;
  background-color: var(--mh-bg-secondary);
  border-bottom: 2px solid var(--mh-border-primary);
}

.mh-table-header-cell[rowspan] {
  vertical-align: middle;
}

/* Column menu dropdown */
.mh-column-menu-dropdown {
  position: relative;
}

.mh-column-menu-list {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--mh-bg-primary);
  border: 1px solid var(--mh-border-primary);
  border-radius: 6px;
  box-shadow: var(--mh-shadow-dropdown);
  z-index: var(--mh-z-dropdown);
  min-width: 150px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
}

.mh-column-menu-dropdown--open .mh-column-menu-list {
  display: block;
}

.mh-column-menu-list li {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: var(--mh-text-primary);
  transition: background-color 0.15s ease;
}

.mh-column-menu-list li:hover {
  background-color: var(--mh-bg-hover);
}

.mh-column-menu-list li:active {
  background-color: var(--mh-bg-active);
}
</style> 