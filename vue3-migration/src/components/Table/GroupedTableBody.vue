<template>
  <tbody class="mh-table-body mh-table-body--grouped">
    <template v-if="displayData.length">
      <template v-for="(row, rowIndex) in displayData" :key="getRowKey(row, rowIndex)">
        <!-- Group Header Row -->
        <tr v-if="row._isGroup" 
            :class="['mh-table-row', 'mh-table-row--group', { 'mh-table-row--expanded': row._childrenVisible }]"
            @click="toggleGroup(row._groupKey)">
          
          <!-- Selection column for group -->
          <td v-if="shouldRenderSelection" class="mh-table-cell -selectable-column">
            <MultiSelect 
              :status="getGroupCheckboxStatus(row)" 
              @onChange="checked => handleGroupSelection(row, checked)" 
            />
          </td>
          
          <!-- Group content spanning all columns -->
          <td :colspan="groupColspan" class="mh-table-cell mh-table-cell--group">
            <div class="mh-group-header">
              <!-- Group expand/collapse icon -->
              <span class="mh-group-toggle" :class="{ 'mh-group-toggle--expanded': row._childrenVisible }">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              
              <!-- Group title and info -->
              <div class="mh-group-info">
                <span class="mh-group-title">{{ row.groupTitle }}</span>
                <span class="mh-group-count">({{ row.children?.length || 0 }} items)</span>
              </div>
              
              <!-- Group aggregations -->
              <div v-if="row.aggregations && Object.keys(row.aggregations).length > 0" class="mh-group-aggregations">
                <span v-for="(value, key) in row.aggregations" :key="key" class="mh-group-aggregation">
                  {{ formatAggregation(key, value) }}
                </span>
              </div>
              
              <!-- Custom group header template -->
              <div v-if="groupConfig?.headerTemplate" class="mh-group-custom">
                <component 
                  :is="groupConfig.headerTemplate" 
                  :group="row" 
                  :expanded="row._childrenVisible"
                  :toggle="() => toggleGroup(row._groupKey)"
                />
              </div>
            </div>
          </td>
        </tr>
        
        <!-- Regular Data Row -->
        <tr v-else-if="!row._isHide" 
            :class="['mh-table-row', 'mh-table-row--data', { 'mh-table-row--group-child': row._groupLevel > 0 }]"
            :style="{ paddingLeft: `${(row._groupLevel || 0) * 20}px` }"
            :data-index="getOriginalIndex(rowIndex)"
            @click="handleRowClick(row, rowIndex)"
            @dblclick="handleRowDoubleClick(row, rowIndex)"
            @contextmenu="handleContextMenu($event, row, rowIndex)">
          
          <!-- Selection column -->
          <td v-if="shouldRenderSelection" class="mh-table-cell -selectable-column">
            <MultiSelect 
              :status="getCheckboxStatus(row, getOriginalIndex(rowIndex))" 
              :value="row._isChecked" 
              @onChange="checked => handleRowSelection(row, rowIndex, checked)" 
            />
          </td>
          
          <!-- Data columns -->
          <td v-for="(col, colIndex) in tableColumns" 
              :key="colIndex" 
              :class="['mh-table-cell', col.tdClass]"
              :style="[col.tdStyle, { paddingLeft: colIndex === 0 ? `${(row._groupLevel || 0) * 20}px` : undefined }]">
            
            <!-- Custom cell slot -->
            <template v-if="$slots[`cell-${col.field}`]">
              <slot :name="`cell-${col.field}`" :row="row" :value="resolvePath(row, col.field, null)" :field="col.field" :column="col" />
            </template>
            
            <!-- Dynamic cell component -->
            <template v-else-if="col.tdComp">
              <component 
                :is="col.tdComp" 
                :row="row" 
                :value="resolvePath(row, col.field, null)" 
                :field="col.field" 
                :column="col" 
                :nested="row.__nested__"
              />
            </template>
            
            <!-- Default cell content -->
            <template v-else>
              {{ resolvePath(row, col.field, null) }}
            </template>
          </td>
        </tr>
        
        <!-- Nested Row (if expanded) -->
        <tr v-if="row.__nested__?.visible && !leftFixed && !rightFixed" 
            :key="getRowKey(row, rowIndex) + '-nested'"
            class="mh-table-row mh-table-row--nested">
          <td :colspan="totalColumns" class="mh-table-cell mh-table-cell--nested">
            <component 
              :is="getNestedComponent(row)" 
              :row="row" 
              :nested="row.__nested__" 
              @rowDetailMounted="handleRowDetailMounted($event, { row, rowIndex: getOriginalIndex(rowIndex) })" 
              v-bind="nestedProps"
            />
          </td>
        </tr>
        
        <!-- Group Footer Row -->
        <tr v-if="row._isGroup && row._childrenVisible && groupConfig?.footerTemplate" 
            :key="getRowKey(row, rowIndex) + '-footer'"
            class="mh-table-row mh-table-row--group-footer">
          <td :colspan="totalColumns" class="mh-table-cell mh-table-cell--group-footer">
            <component 
              :is="groupConfig.footerTemplate" 
              :group="row" 
              :aggregations="row.aggregations"
            />
          </td>
        </tr>
      </template>
    </template>
    
    <!-- Empty state -->
    <tr v-else class="mh-table-row mh-table-row--empty">
      <td :colspan="totalColumns" class="mh-table-cell mh-table-cell--empty">
        <div class="mh-empty-state">
          <span class="mh-empty-message">No data available</span>
        </div>
      </td>
    </tr>
  </tbody>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import MultiSelect from './MultiSelect.vue'
import type { TableColumn, GroupConfig, GroupedRow } from '@/types'

const props = defineProps({
  displayData: {
    type: Array,
    required: true
  },
  tableColumns: {
    type: Array as PropType<TableColumn[]>,
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
  groupConfig: {
    type: Object as PropType<GroupConfig>,
    default: undefined
  },
  nestedProps: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'handle-event',
  'row-click',
  'row-dblclick',
  'context-menu',
  'selection-change',
  'group-toggle',
  'nested-toggle'
])

// Computed properties
const totalColumns = computed(() => {
  let count = props.tableColumns.length
  if (props.shouldRenderSelection) count++
  return count
})

const groupColspan = computed(() => {
  return props.tableColumns.length
})

/**
 * Get unique row key
 */
function getRowKey(row: any, index: number): string {
  if (row._isGroup) {
    return `group-${row._groupKey || index}`
  }
  return row.id || row._id || `row-${index}`
}

/**
 * Get original data index
 */
function getOriginalIndex(displayIndex: number): number {
  const row = props.displayData[displayIndex]
  return row._normalIndex || displayIndex
}

/**
 * Toggle group expansion
 */
function toggleGroup(groupKey: string): void {
  emit('group-toggle', groupKey)
}

/**
 * Handle row click
 */
function handleRowClick(row: any, index: number): void {
  emit('row-click', row, getOriginalIndex(index))
}

/**
 * Handle row double click
 */
function handleRowDoubleClick(row: any, index: number): void {
  emit('row-dblclick', row, getOriginalIndex(index))
}

/**
 * Handle context menu
 */
function handleContextMenu(event: MouseEvent, row: any, index: number): void {
  emit('context-menu', event, row, getOriginalIndex(index))
}

/**
 * Handle row selection
 */
function handleRowSelection(row: any, index: number, checked: boolean): void {
  emit('handle-event', null, 'checkbox', { row, rowIndex: getOriginalIndex(index) }, { isChecked: checked })
}

/**
 * Handle group selection
 */
function handleGroupSelection(groupRow: any, checked: boolean): void {
  // Select/deselect all children in the group
  if (groupRow.children) {
    groupRow.children.forEach((child: any, childIndex: number) => {
      emit('handle-event', null, 'checkbox', { row: child, rowIndex: childIndex }, { isChecked: checked })
    })
  }
}

/**
 * Get checkbox status for regular row
 */
function getCheckboxStatus(row: any, index: number): { checked: boolean, indeterminate: boolean } {
  return {
    checked: row._isChecked || false,
    indeterminate: false
  }
}

/**
 * Get checkbox status for group row
 */
function getGroupCheckboxStatus(groupRow: any): { checked: boolean, indeterminate: boolean } {
  if (!groupRow.children || groupRow.children.length === 0) {
    return { checked: false, indeterminate: false }
  }
  
  const checkedCount = groupRow.children.filter((child: any) => child._isChecked).length
  const totalCount = groupRow.children.length
  
  return {
    checked: checkedCount === totalCount,
    indeterminate: checkedCount > 0 && checkedCount < totalCount
  }
}

/**
 * Resolve nested object path
 */
function resolvePath(obj: any, path: string, defaultValue: any = ''): any {
  if (!obj || !path) return defaultValue
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue
}

/**
 * Get nested component
 */
function getNestedComponent(row: any): any {
  return row.__nested__?.comp || 'div'
}

/**
 * Format aggregation display
 */
function formatAggregation(key: string, value: any): string {
  const [field, func] = key.split('_')
  const funcNames: Record<string, string> = {
    sum: 'Sum',
    avg: 'Avg',
    count: 'Count',
    min: 'Min',
    max: 'Max'
  }
  
  const funcName = funcNames[func] || func
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value
  
  return `${funcName}: ${formattedValue}`
}

/**
 * Handle row detail mounted
 */
function handleRowDetailMounted(event: any, data: any): void {
  emit('handle-event', event, 'rowDetailMounted', data, {})
}
</script>

<style scoped>
.mh-table-body--grouped {
  position: relative;
}

/* Group rows */
.mh-table-row--group {
  background-color: var(--mh-bg-secondary);
  border-top: 2px solid var(--mh-border-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mh-table-row--group:hover {
  background-color: var(--mh-bg-hover);
}

.mh-table-row--group.mh-table-row--expanded {
  background-color: var(--mh-primary-light);
}

.mh-table-cell--group {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--mh-text-primary);
}

/* Group header content */
.mh-group-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mh-group-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--mh-text-muted);
  transition: transform 0.2s ease, color 0.2s ease;
}

.mh-group-toggle--expanded {
  transform: rotate(90deg);
  color: var(--mh-primary);
}

.mh-group-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.mh-group-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--mh-text-primary);
}

.mh-group-count {
  font-size: 14px;
  color: var(--mh-text-muted);
  font-weight: normal;
}

.mh-group-aggregations {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.mh-group-aggregation {
  padding: 4px 8px;
  background-color: var(--mh-bg-tertiary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--mh-text-secondary);
  font-weight: 500;
}

.mh-group-custom {
  margin-left: auto;
}

/* Group child rows */
.mh-table-row--group-child {
  background-color: var(--mh-bg-primary);
}

.mh-table-row--group-child:nth-child(even) {
  background-color: var(--mh-bg-stripe);
}

.mh-table-row--group-child:hover {
  background-color: var(--mh-bg-hover);
}

/* Group footer */
.mh-table-row--group-footer {
  background-color: var(--mh-bg-secondary);
  border-bottom: 1px solid var(--mh-border-primary);
}

.mh-table-cell--group-footer {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--mh-text-secondary);
}

/* Nested rows */
.mh-table-row--nested {
  background-color: var(--mh-bg-tertiary);
}

.mh-table-cell--nested {
  padding: 0;
  border: none;
}

/* Empty state */
.mh-table-row--empty {
  height: 200px;
}

.mh-table-cell--empty {
  text-align: center;
  vertical-align: middle;
  color: var(--mh-text-muted);
  font-style: italic;
}

.mh-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
}

.mh-empty-message {
  font-size: 16px;
  color: var(--mh-text-muted);
}

/* Indentation for grouped rows */
.mh-table-row--group-child .mh-table-cell:first-child {
  position: relative;
}

.mh-table-row--group-child .mh-table-cell:first-child::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--mh-border-secondary);
}
</style> 