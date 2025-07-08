<template>
  <div 
    class="mh-table-container" 
    :class="containerClasses"
    :style="containerStyles"
    ref="tableContainer"
  >
    <div v-if="showGhostLine" :style="ghostLineStyle" class="mh-table-ghost-line">
      <div class="mh-table-ghost-ticks mh-table-ghost-ticks--top">
        <svg width="18" height="6" viewBox="0 0 18 6"><g fill="currentColor"><rect x="2" y="0" width="2" height="6"/><rect x="8" y="0" width="2" height="6"/><rect x="14" y="0" width="2" height="6"/></g></svg>
      </div>
      <div class="mh-table-ghost-ticks mh-table-ghost-ticks--bottom">
        <svg width="18" height="6" viewBox="0 0 18 6"><g fill="currentColor"><rect x="2" y="0" width="2" height="6"/><rect x="8" y="0" width="2" height="6"/><rect x="14" y="0" width="2" height="6"/></g></svg>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="mh-table-loading">
      <div class="mh-table-spinner">
        <div class="rect"></div>
        <div class="rect"></div>
        <div class="rect"></div>
        <div class="rect"></div>
        <div class="rect"></div>
      </div>
      <div class="mh-table-loading-text">Loading...</div>
    </div>

    <!-- Complex mode with fixed columns -->
    <div
      v-if="useComplexMode"
      class="mh-table-complex"
      :class="{ '-selectable': selectable }"
    >
      <div class="mh-table-section mh-table-section--header">
        <!-- Left fixed header -->
        <div class="mh-table-fixed-left" v-if="leftFixedColumns.length > 0" :style="{ width: `${fixedLeftTableWidth}px` }">
          <TableFrame left-fixed :tableColumns="leftFixedColumns" :shouldRenderSelection="props.selectable">
            <component
              :is="complexHeadersEnabled ? ComplexTableHeader : TableHeader"
              :columns="headerColumns"
              :table-columns="leftFixedColumns"
              :query="query"
              leftFixed
              :shouldRenderSelection="props.selectable"
              :bodyData="data"
              @handle-event="handleTableHeaderEvent"
              @header-resize="handleHeaderResize"
              @sort="handleSort"
              @menu-action="handleMenuAction"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </component>
          </TableFrame>
        </div>
        <!-- Main header -->
        <div ref="mainTableHeader" class="mh-table-main" :style="{ 'margin-left': `${fixedLeftTableWidth}px`, 'margin-right': `${fixedRightTableWidth}px` }">
          <TableFrame :tableColumns="normalColumns" :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false">
            <component
              :is="complexHeadersEnabled ? ComplexTableHeader : TableHeader"
              :columns="headerColumns"
              :table-columns="normalColumns"
              :query="query"
              :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false"
              @header-resize="handleHeaderResize"
              @sort="handleSort"
              @menu-action="handleMenuAction"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </component>
          </TableFrame>
        </div>
        <!-- Right fixed header -->
        <div class="mh-table-fixed-right" v-if="rightFixedColumns.length > 0" :style="{ width: `${fixedRightTableWidth}px` }">
          <TableFrame right-fixed :tableColumns="rightFixedColumns" :shouldRenderSelection="false">
            <component
              :is="complexHeadersEnabled ? ComplexTableHeader : TableHeader"
              :columns="headerColumns"
              :table-columns="rightFixedColumns"
              :query="query"
              rightFixed
              :shouldRenderSelection="false"
              @header-resize="handleHeaderResize"
              @sort="handleSort"
              @menu-action="handleMenuAction"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </component>
          </TableFrame>
        </div>
      </div>
      <div class="mh-table-section mh-table-section--body">
        <!-- Left fixed body -->
        <div ref="leftTableBody" class="mh-table-fixed-left" v-if="leftFixedColumns.length > 0" :style="{ width: `${fixedLeftTableWidth}px`, height: `${virtualContainerHeight}px`, 'overflow-y': 'auto' }">
          <div v-if="isVirtualized" :style="{ height: `${totalVirtualHeight}px`, position: 'relative', width: '100%' }">
            <div :style="{ position: 'absolute', top: `${virtualOffset.before}px`, width: '100%' }">
              <TableFrame left-fixed :tableColumns="leftFixedColumns" :shouldRenderSelection="props.selectable">
                <GroupedTableBody 
                  v-if="useGroupedRendering"
                  :displayData="virtualDisplayRows" 
                  :tableColumns="leftFixedColumns" 
                  :shouldRenderSelection="props.selectable" 
                  :leftFixed="true"
                  :groupConfig="props.groupConfig"
                  @handle-event="handleTableBodyEvent"
                  @group-toggle="(groupKey) => emit('group-toggle', groupKey)"
                >
                  <template v-for="(_, slot) in $slots" #[slot]="scope">
                    <slot :name="slot" v-bind="scope" />
                  </template>
                </GroupedTableBody>
                <TableBody 
                  v-else
                  :tableColumns="leftFixedColumns" 
                  :data="virtualDisplayRows" 
                  leftFixed 
                  :shouldRenderSelection="props.selectable" 
                  :virtualized="false"
                  :rowHeight="virtualRowHeight"
                  :containerHeight="virtualContainerHeight"
                  :scrollTop="scrollTop"
                  :compReg="props.compReg"
                  @handle-event="handleTableBodyEvent"
                >
                  <template v-for="(_, slot) in $slots" #[slot]="scope">
                    <slot :name="slot" v-bind="scope" />
                  </template>
                </TableBody>
              </TableFrame>
            </div>
          </div>
          <TableFrame v-else left-fixed :tableColumns="leftFixedColumns" :shouldRenderSelection="props.selectable">
            <GroupedTableBody 
              v-if="useGroupedRendering"
              :displayData="finalData" 
              :tableColumns="leftFixedColumns" 
              :shouldRenderSelection="props.selectable" 
              :leftFixed="true"
              :groupConfig="props.groupConfig"
              @handle-event="handleTableBodyEvent"
              @group-toggle="(groupKey) => emit('group-toggle', groupKey)"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </GroupedTableBody>
            <TableBody 
              v-else
              :tableColumns="leftFixedColumns" 
              :data="finalData" 
              leftFixed 
              :shouldRenderSelection="props.selectable" 
              :virtualized="false"
              :rowHeight="virtualRowHeight"
              :containerHeight="virtualContainerHeight"
              :scrollTop="scrollTop"
              :compReg="props.compReg"
              @handle-event="handleTableBodyEvent"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </TableBody>
          </TableFrame>
        </div>
        <!-- Main body -->
        <div ref="mainTableBody" class="mh-table-main" :style="{ 'margin-left': leftFixedColumns.length > 0 ? `${fixedLeftTableWidth}px` : '0px', 'margin-right': rightFixedColumns.length > 0 ? `${fixedRightTableWidth}px` : '0px', height: `${virtualContainerHeight}px`, 'overflow-y': 'auto' }">
          <div v-if="isVirtualized" :style="{ height: `${totalVirtualHeight}px`, position: 'relative', width: '100%' }">
            <div :style="{ position: 'absolute', top: `${virtualOffset.before}px`, width: '100%' }">
              <TableFrame :tableColumns="normalColumns" :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false">
                              <GroupedTableBody 
                v-if="useGroupedRendering"
                :displayData="virtualDisplayRows" 
                :tableColumns="normalColumns" 
                :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false"
                :groupConfig="props.groupConfig"
                @handle-event="handleTableBodyEvent"
                @group-toggle="(groupKey) => emit('group-toggle', groupKey)"
              >
                  <template v-for="(_, slot) in $slots" #[slot]="scope">
                    <slot :name="slot" v-bind="scope" />
                  </template>
                </GroupedTableBody>
                              <TableBody 
                v-else
                :tableColumns="normalColumns" 
                :data="virtualDisplayRows" 
                :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false"
                :virtualized="false"
                :rowHeight="virtualRowHeight"
                :containerHeight="virtualContainerHeight"
                :scrollTop="scrollTop"
                :compReg="props.compReg"
                @handle-event="handleTableBodyEvent"
              >
                  <template v-for="(_, slot) in $slots" #[slot]="scope">
                    <slot :name="slot" v-bind="scope" />
                  </template>
                </TableBody>
              </TableFrame>
            </div>
          </div>
          <TableFrame v-else :tableColumns="normalColumns" :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false">
            <TableBody 
              :tableColumns="normalColumns" 
              :data="finalData" 
              :shouldRenderSelection="leftFixedColumns.length === 0 ? props.selectable : false"
              :virtualized="false"
              :rowHeight="virtualRowHeight"
              :containerHeight="virtualContainerHeight"
              :scrollTop="scrollTop"
              :compReg="props.compReg"
              @handle-event="handleTableBodyEvent"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </TableBody>
          </TableFrame>
        </div>
        <!-- Right fixed body -->
        <div ref="rightTableBody" class="mh-table-fixed-right" v-if="rightFixedColumns.length > 0" :style="{ width: `${fixedRightTableWidth}px`, height: `${virtualContainerHeight}px`, 'overflow-y': 'auto' }">
          <div v-if="isVirtualized" :style="{ height: `${totalVirtualHeight}px`, position: 'relative', width: '100%' }">
            <div :style="{ position: 'absolute', top: `${virtualOffset.before}px`, width: '100%' }">
              <TableFrame right-fixed :tableColumns="rightFixedColumns" :shouldRenderSelection="false">
                <TableBody 
                  :tableColumns="rightFixedColumns" 
                  :data="virtualDisplayRows" 
                  rightFixed 
                  :shouldRenderSelection="false"
                  :virtualized="false"
                  :rowHeight="virtualRowHeight"
                  :containerHeight="virtualContainerHeight"
                  :scrollTop="scrollTop"
                  :compReg="props.compReg"
                >
                  <template v-for="(_, slot) in $slots" #[slot]="scope">
                    <slot :name="slot" v-bind="scope" />
                  </template>
                </TableBody>
              </TableFrame>
            </div>
          </div>
          <TableFrame v-else right-fixed :tableColumns="rightFixedColumns" :shouldRenderSelection="false">
            <TableBody 
              :tableColumns="rightFixedColumns" 
              :data="finalData" 
              rightFixed 
              :shouldRenderSelection="false"
              :virtualized="false"
              :rowHeight="virtualRowHeight"
              :containerHeight="virtualContainerHeight"
              :scrollTop="scrollTop"
              :compReg="props.compReg"
            >
              <template v-for="(_, slot) in $slots" #[slot]="scope">
                <slot :name="slot" v-bind="scope" />
              </template>
            </TableBody>
          </TableFrame>
        </div>
      </div>

      <!-- Column menu -->
      <ColumnMenu 
        :show="columnMenuState.show ?? false"
        :top="columnMenuState.top ?? -9999"
        :left="columnMenuState.left ?? -9999"
        :is-overflow="columnMenuState.isOverflow ?? false"
        :columns="columns"
        :selected-column="columnMenuState.selectedColumn ?? null"
        :xprops="tableProps.xprops || { eventbus: defaultEventbus }"
        :query="query"
        @force-grid-resize="fireResizeEvent"
        @set-auto-column-width="handleEvent($event, 'columnMenu-setAutoColumnWidth')"
        @set-auto-all-columns-width="handleEvent($event, 'columnMenu-setAutoAllColumnWidth')"
        @reset-columns="handleEvent($event, 'resetColumns')"
        @reset-filters="handleEvent($event, 'resetFilters')"
        @column-pinned-left="handleEvent($event, 'columnPinnedLeft')"
        @column-unpinned-left="handleEvent($event, 'columnUnpinnedLeft')"
        @column-pinned-right="handleEvent($event, 'columnPinnedRight')"
        @column-unpinned-right="handleEvent($event, 'columnUnpinnedRight')"
        @update:show="val => { columnMenuState.show = val }"
      />

      <!-- Context menu -->
      <ContextMenu 
        :show="contextMenuState.show"
        :top="contextMenuState.top"
        :left="contextMenuState.left"
        :selected-row="contextMenuState.selectedRow"
        :context-menu-options="props.contextMenuOptions || []"
      />

      <!-- Drag and drop elements -->
      <div class="mh-table-reorder-clue" ref="reorderCue"></div>
      <div class="mh-table-drag-clue" ref="dragClue"></div>
    </div>



    <!-- Empty State -->
    <div v-if="!loading && (!data || data.length === 0)" class="mh-table-empty">
      <div class="mh-table-empty-icon">📊</div>
      <div class="mh-table-empty-text">No data available</div>
      <div class="mh-table-empty-subtext">Try adjusting your filters or refreshing the data</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, provide } from 'vue'
import { useTableState } from '@/composables/useTableState'
import { useColumnActions } from '@/composables/useColumnActions'
import { useColumnReordering } from '@/composables/useColumnReordering'
import { useVirtualScrolling } from '@/composables/useVirtualScrolling'
import type { TableProps, TableColumn, TableHeightConfig, TableQuery, NestedGridConfig } from '@/types'
import TableFrame from './TableFrame.vue'
import TableHeader from './TableHeader.vue'
import ComplexTableHeader from './ComplexTableHeader.vue'
import TableBody from './TableBody.vue'
import GroupedTableBody from './GroupedTableBody.vue'
import TableFooter from './TableFooter.vue'
import ColumnMenu from '../ColumnMenu/ColumnMenu.vue'
import ContextMenu from '../ContextMenu/ContextMenu.vue'

// Props
const props = defineProps<TableProps & { loading?: boolean; summary?: Record<string, any>; selectable?: boolean; nestedGrid?: NestedGridConfig; groupConfig?: any; headerColumns?: TableColumn[]; complexHeaders?: boolean }>()

// Emits
const emit = defineEmits<{
  'force-grid-store': []
  'reset-columns': []
  'reset-filters': []
  'columns-reordered': [columns: TableColumn[]]
  'column-drag-start': [event: any]
  'column-drag-end': [event: any]
  'group-toggle': [groupKey: string]
  'nested-toggle': [row: any, isExpanded: boolean]
  'row-click': [row: any, rowIndex: number]
}>()

// Composables
const {
  columns,
  data,
  query,
  visibleColumns,
  leftFixedColumns,
  rightFixedColumns,
  normalColumns
} = useTableState(props)

const headerColumns = computed(() => props.headerColumns || props.columns)
const complexHeadersEnabled = computed(() => props.complexHeaders === true)

// Integrate modular column actions
const {
  pinColumnLeft,
  pinColumnRight,
  unpinColumn,
  autosizeColumn,
  autosizeAllColumns,
  resetColumns
} = useColumnActions(columns)

// Column reordering
const {
  initSortable,
  reinitializeSortables
} = useColumnReordering(columns, emit, {
  onReorder: (newOrder: TableColumn[]) => {
    console.log('Columns reordered:', newOrder)
    emit('columns-reordered', newOrder)
  }
})

// Use the data as provided by parent (DataTable handles nested processing)
const finalData = computed(() => props.data)

// Check if we should use grouped rendering
const useGroupedRendering = computed(() => {
  return props.groupConfig && props.groupConfig.field
})

// Initialize column reordering after mount
const initColumnReordering = () => {
  nextTick(() => {
    // Initialize sortable for main table header
    const mainHeader = document.querySelector('.mh-table-main thead tr')
    if (mainHeader) {
      initSortable(mainHeader as HTMLElement, 'main')
    }

    // Initialize sortable for left fixed table header
    const leftHeader = document.querySelector('.mh-table-fixed-left thead tr')
    if (leftHeader) {
      initSortable(leftHeader as HTMLElement, 'left')
    }

    // Initialize sortable for right fixed table header
    const rightHeader = document.querySelector('.mh-table-fixed-right thead tr')
    if (rightHeader) {
      initSortable(rightHeader as HTMLElement, 'right')
    }
  })
}

// Refs
const tableContainer = ref<HTMLElement>()
const columnMenuState = ref({
  show: false,
  top: -9999,
  left: -9999,
  isOverflow: false,
  selectedColumn: null as TableColumn | null
})
const reorderCue = ref<HTMLElement>()
const dragClue = ref<HTMLElement>()
const mainTableHeader = ref<HTMLElement | null>(null)
const mainTableBody = ref<HTMLElement | null>(null)
const leftTableBody = ref<HTMLElement | null>(null)
const rightTableBody = ref<HTMLElement | null>(null)

// Virtual scrolling state
const scrollTop = ref(0)
const isVirtualized = computed(() => props.virtualized && finalData.value.length > 20) // Enable for datasets > 20 rows
const virtualRowHeight = 60 // Fixed row height for virtualization
const virtualContainerHeight = computed(() => {
  if (typeof props.height === 'number') return props.height - 60 // Account for header
  return 400
})
const totalVirtualHeight = computed(() => {
  if (!isVirtualized.value) return 0
  return finalData.value.length * virtualRowHeight
})

// Virtual scrolling calculations
const virtualRange = computed(() => {
  if (!isVirtualized.value || !finalData.value.length) {
    return { start: 0, end: finalData.value.length }
  }

  const itemHeight = virtualRowHeight
  const visibleCount = Math.ceil(virtualContainerHeight.value / itemHeight)
  const buffer = 10 // Buffer for smoother scrolling
  
  const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - buffer)
  const endIndex = Math.min(finalData.value.length, startIndex + visibleCount + buffer * 2)
  
  console.log(`Virtual range: rows ${startIndex}-${endIndex} (scroll: ${scrollTop.value}, total: ${finalData.value.length}, itemHeight: ${itemHeight}, visibleCount: ${visibleCount}, leftFixed: ${leftFixedColumns.value.length}, rightFixed: ${rightFixedColumns.value.length})`)
  
  return { start: startIndex, end: endIndex }
})

const virtualDisplayRows = computed(() => {
  if (!isVirtualized.value) return finalData.value
  const { start, end } = virtualRange.value
  const slicedData = finalData.value.slice(start, end)
  console.log(`Virtual display rows: ${slicedData.length} rows (${start}-${end}) from total ${finalData.value.length}`)
  return slicedData
})

const virtualOffset = computed(() => {
  if (!isVirtualized.value) {
    return { before: 0, after: 0 }
  }
  
  const { start, end } = virtualRange.value
  const itemHeight = virtualRowHeight
  
  return {
    before: start * itemHeight,
    after: (finalData.value.length - end) * itemHeight
  }
})

// Provide scroll position to child components
provide('scrollTop', scrollTop)

const contextMenuState = ref({
  show: false,
  top: 0,
  left: 0,
  selectedRow: null as any
})

const showGhostLine = ref(false)
const ghostLineStyle = ref<any>({ left: '0px', top: '0px', height: '0px' })
let resizingColIndex: number | null = null
let resizingStartX = 0
let resizingStartWidth = 0

const MIN_COL_WIDTH = 80

// Always use complex mode for consistent behavior
const useComplexMode = computed(() => {
  return true // Always use complex mode for virtualization and consistency
})

const defaultEventbus = {
  emit: () => {},
  on: () => {},
  off: () => {}
}

const tableProps = computed(() => {
  let xprops: { eventbus: any; [key: string]: any } = { eventbus: defaultEventbus }
  if (props.xprops && typeof props.xprops === 'object') {
    Object.assign(xprops, props.xprops)
    if (!xprops.eventbus) xprops.eventbus = defaultEventbus
  }
  return {
    columns: columns.value,
    data: data.value,
    query: query.value,
    loading: props.loading,
    selectable: props.selectable,
    supportNested: props.supportNested,
    contextMenuOptions: props.contextMenuOptions,
    tblClass: props.tblClass,
    tblStyle: props.tblStyle,
    xprops,
    compReg: props.compReg
  }
})

// Height configuration
const heightConfig = computed((): TableHeightConfig => {
  if (!props.height) {
    return { mode: 'fixed', value: 400 }
  }
  
  if (typeof props.height === 'number') {
    return { mode: 'fixed', value: props.height }
  }
  
  if (typeof props.height === 'string') {
    return { mode: 'fixed', value: props.height }
  }
  
  return props.height
})

const containerClasses = computed(() => {
  const classes = ['mh-table-container']
  
  switch (heightConfig.value.mode) {
    case 'auto':
      classes.push('mh-table-container--auto-height')
      break
    case 'full':
      classes.push('mh-table-container--full-height')
      break
    case 'min-max':
      classes.push('mh-table-container--min-max')
      break
    default:
      // fixed mode - no additional class
      break
  }
  
  return classes
})

const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  switch (heightConfig.value.mode) {
    case 'fixed':
      if (heightConfig.value.value) {
        styles.height = typeof heightConfig.value.value === 'number' 
          ? `${heightConfig.value.value}px` 
          : heightConfig.value.value
      }
      break
    case 'min-max':
      if (heightConfig.value.minHeight) {
        styles.minHeight = typeof heightConfig.value.minHeight === 'number' 
          ? `${heightConfig.value.minHeight}px` 
          : heightConfig.value.minHeight
      }
      if (heightConfig.value.maxHeight) {
        styles.maxHeight = typeof heightConfig.value.maxHeight === 'number' 
          ? `${heightConfig.value.maxHeight}px` 
          : heightConfig.value.maxHeight
      }
      break
    case 'full':
      if (heightConfig.value.fullHeightOffset) {
        const offsetValue = typeof heightConfig.value.fullHeightOffset === 'number' 
          ? `${heightConfig.value.fullHeightOffset}px` 
          : heightConfig.value.fullHeightOffset
        styles['--mh-table-full-height-offset'] = offsetValue
      }
      break
  }
  
  return styles
})

// Methods
function getColWidth(col: TableColumn): number {
  if (col.colStyle && col.colStyle.width && col.colStyle.width !== 'auto') {
    if (typeof col.colStyle.width === 'number') return col.colStyle.width
    if (typeof col.colStyle.width === 'string' && col.colStyle.width.endsWith('px')) return parseInt(col.colStyle.width)
    if (typeof col.colStyle.width === 'string') return parseInt(col.colStyle.width)
  }
  if (col.width) return typeof col.width === 'number' ? col.width : parseInt(col.width)
  return 120
}

const fixedLeftTableWidth = computed(() => {
  if (leftFixedColumns.value.length === 0) return 0;
  const selectionWidth = props.selectable ? 30 : 0;  // Match the colgroup width
  return leftFixedColumns.value.reduce((total, col) => total + getColWidth(col), selectionWidth);
});

const fixedRightTableWidth = computed(() => rightFixedColumns.value.reduce((sum, col) => sum + getColWidth(col), 0))
const mainTableWidth = computed(() => normalColumns.value.reduce((sum, col) => sum + getColWidth(col), 0))
const fixedTableHeight = ref(400)
const verticalScrollWidthCorrection = ref(17)

const getMainTableStyle = (section: string) => {
  const baseStyle: Record<string, any> = {
    width: `${mainTableWidth.value}px`,
    marginLeft: leftFixedColumns.value.length > 0 ? `${fixedLeftTableWidth.value}px` : '0px',
    marginRight: rightFixedColumns.value.length > 0 ? `${fixedRightTableWidth.value}px` : '0px',
    overflow: 'hidden'
  }
  if (section === 'Body') {
    baseStyle.width = `${mainTableWidth.value}px`
    baseStyle.height = props.fullHeight?.enabled ? `${heightConfig.value.value || 400}px` : 'auto'
    baseStyle.overflowX = 'auto'
    baseStyle.overflowY = rightFixedColumns.value.length ? 'hidden' : 'auto'
  }
  return baseStyle
}

const getFixedTableStyle = (section: string, position: 'left' | 'right') => {
  const baseStyle: Record<string, any> = {
    overflow: section === 'Body' ? 'hidden' : 'visible'
  }
  if (position === 'left') {
    baseStyle.width = fixedLeftTableWidth.value > 1 ? `${fixedLeftTableWidth.value}px` : 'auto'
  } else {
    baseStyle.width = fixedRightTableWidth.value > 1 ? `${fixedRightTableWidth.value}px` : 'auto'
  }
  if (section === 'Body' && props.fullHeight?.enabled) {
    baseStyle.height = `${fixedTableHeight.value}px`
  }
  return baseStyle
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

const handleHeaderResize = (payload: any) => {
  const { event, col, newWidth, deltaX } = payload;
  const tableEl = tableContainer.value;
  if (!tableEl) return;

  if (event === 'start') {
    const th = tableEl.querySelector(`th[data-index="${col.index}"]`) as HTMLElement;
    if (!th) return;
    resizingStartX = th.getBoundingClientRect().right - tableEl.getBoundingClientRect().left;
    showGhostLine.value = true;
    ghostLineStyle.value = {
      left: `${resizingStartX}px`,
      top: 0,
      height: `${tableEl.clientHeight}px`
    };
  } else if (event === 'resizing') {
    ghostLineStyle.value.left = `${resizingStartX + deltaX}px`;
  } else if (event === 'end') {
    showGhostLine.value = false;
    if (col && newWidth) {
      const targetCol = columns.value.find(c => c.index === col.index);
      if (targetCol) {
        targetCol.width = Math.max(newWidth, MIN_COL_WIDTH);
        if (targetCol.colStyle) {
          targetCol.colStyle.width = `${Math.max(newWidth, MIN_COL_WIDTH)}px`;
        }
      }
    }
  }
};

const handleEvent = (event: any, type: string, data?: any, others?: any) => {
  // Note: handle-event is not in the defined emits, so we'll handle it internally
}

const handleTableBodyEvent = (event: any, type: string, eventData?: any, others?: any) => {
  if (type === 'checkbox') {
    const { row, rowIndex } = eventData
    const { isChecked } = others
    
    // Update the row's checked state
    if (row && typeof rowIndex === 'number') {
      // Update the data directly
      const targetRow = finalData.value[rowIndex]
      if (targetRow) {
        targetRow._isChecked = isChecked
        // Force reactivity update by updating the original data
        data.value = [...data.value]
      }
    }
  } else if (type === 'rowClick') {
    // Emit row-click event to parent - let DataTable handle nested logic
    emit('row-click', eventData.row, eventData.rowIndex)
  } else if (type === 'nestedToggle') {
    // Emit nested-toggle event to parent
    emit('nested-toggle', eventData.row, true)
  }
}

const handleTableHeaderEvent = (event: any, type: string, eventData?: any, others?: any) => {
  if (type === 'toggleCheckAll') {
    const { isChecked } = others
    
    // Update all rows' checked state
    data.value = data.value.map(row => ({
      ...row,
      _isChecked: isChecked
    }))
  } else if (type === 'showColumnMenu') {
    const { column, columnIndex } = eventData
    const target = event.target as HTMLElement
    const rect = target.getBoundingClientRect()
    
    columnMenuState.value = {
      show: true,
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      isOverflow: false,
      selectedColumn: column
    }
  }
}

const fireResizeEvent = () => {
  nextTick(() => {
    const resizeEvent = new Event('resize')
    window.dispatchEvent(resizeEvent)
  })
}

function handleSort(field: string) {
  // Toggle sort direction or add to sort array for multi-sort
  const current = query.value.sort.find((s: any) => s.field === field)
  if (current) {
    current.direction = current.direction === 'asc' ? 'desc' : 'asc'
  } else {
    query.value.sort = [{ field, direction: 'asc' }]
  }
  
  // Apply sorting to data
  applySorting()
}

function applySorting() {
  if (query.value.sort.length === 0) {
    return
  }
  
  const sortConfig = query.value.sort[0] // Use first sort for now
  const { field, direction } = sortConfig
  
  data.value = [...data.value].sort((a, b) => {
    let aVal = a[field]
    let bVal = b[field]
    
    // Handle different data types
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

function handleMenuAction({ action, col }: { action: string, col: any }) {
  switch (action) {
    case 'sortAsc':
      query.value.sort = [{ field: col.field, direction: 'asc' }]
      break
    case 'sortDesc':
      query.value.sort = [{ field: col.field, direction: 'desc' }]
      break
    case 'pinLeft':
      pinColumnLeft(col.field)
      break
    case 'pinRight':
      pinColumnRight(col.field)
      break
    case 'unpin':
      unpinColumn(col.field)
      break
    case 'autosize':
      autosizeColumn(col.field, data.value)
      break
    case 'autosizeAll':
      autosizeAllColumns(data.value)
      break
    case 'chooseColumns':
      // TODO: open column chooser
      break
    case 'resetColumns':
      resetColumns(props.columns || [])
      break
    case 'filter':
      // TODO: open filter UI
      break
  }
  // Always close the column menu after an action
  if (columnMenuState && columnMenuState.value) {
    columnMenuState.value.show = false
  }
}

function handleTableContextMenu(event: MouseEvent) {
  event.preventDefault();
  
  // Check for both tr (regular table) and div (virtual table) rows
  const rowEl = (event.target as HTMLElement).closest('tr, .mh-table-row');
  if (rowEl) {
    // Get the row index from the data-index attribute or by finding position
    const rowIndex = parseInt(rowEl.getAttribute('data-index') || '0', 10);
    const rowData = data.value[rowIndex];

    if (rowData && props.contextMenuOptions && props.contextMenuOptions.length > 0) {
      contextMenuState.value = {
        show: true,
        top: event.clientY,
        left: event.clientX,
        selectedRow: rowData
      };

      // Close menu when clicking elsewhere
      const clickListener = (e: MouseEvent) => {
        const contextMenu = document.querySelector('.mh-context-menu');
        if (!contextMenu || !contextMenu.contains(e.target as Node)) {
          contextMenuState.value.show = false;
          document.removeEventListener('click', clickListener);
        }
      };
      
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('click', clickListener);
      }, 0);
    }
  }
}

// Watch for query changes to apply sorting
watch(() => query.value.sort, () => {
  applySorting()
}, { deep: true })

// Watch for data changes to ensure virtual display is updated
watch([data, scrollTop], () => {
  // Force reactivity update for virtual display when data or scroll changes
  if (isVirtualized.value) {
    console.log(`Data/scroll changed: data.length=${data.value.length}, scrollTop=${scrollTop.value}`)
  }
}, { immediate: false })

// Universal scroll synchronization function
let isScrolling = false;
let scrollListeners: (() => void)[] = [];

const syncScrolling = (sourceElement: HTMLElement) => {
  if (isScrolling) return;
  isScrolling = true;
  
  const currentScrollTop = sourceElement.scrollTop;
  const scrollLeft = sourceElement.scrollLeft;
  
  // Update reactive scrollTop for virtualization
  scrollTop.value = currentScrollTop;
  
  // Get current table sections
  const mainHeader = mainTableHeader.value;
  const mainBody = mainTableBody.value;
  const leftBody = leftTableBody.value;
  const rightBody = rightTableBody.value;
  
  // Sync vertical scroll to all other scroll containers
  const scrollContainers = [mainBody, leftBody, rightBody].filter(Boolean);
  scrollContainers.forEach(container => {
    if (container && container !== sourceElement && container.scrollTop !== currentScrollTop) {
      container.scrollTop = currentScrollTop;
    }
  });
  
  // Sync horizontal scroll to header (only for main body)
  if (sourceElement === mainBody && mainHeader && mainHeader.scrollLeft !== scrollLeft) {
    mainHeader.scrollLeft = scrollLeft;
  }
  
  console.log(`Scroll sync: scrollTop=${currentScrollTop}, source=${sourceElement.className}`);
  
  requestAnimationFrame(() => {
    isScrolling = false;
  });
};

const setupScrollSync = () => {
  // Remove existing listeners
  scrollListeners.forEach(cleanup => cleanup());
  scrollListeners = [];
  
  // Get current table sections
  const mainBody = mainTableBody.value;
  const leftBody = leftTableBody.value;
  const rightBody = rightTableBody.value;
  
  // Add scroll listeners to all active scroll containers
  const scrollContainers = [mainBody, leftBody, rightBody].filter(Boolean);
  scrollContainers.forEach(container => {
    if (container) {
      const listener = () => syncScrolling(container);
      container.addEventListener('scroll', listener, { passive: true });
      scrollListeners.push(() => container.removeEventListener('scroll', listener));
    }
  });
};

// Watch for changes in fixed columns to re-setup scroll sync
watch([leftFixedColumns, rightFixedColumns], () => {
  console.log(`Column layout changed: leftFixed=${leftFixedColumns.value.length}, rightFixed=${rightFixedColumns.value.length}`);
  nextTick(() => {
    setupScrollSync();
    
    // Preserve scroll position after column layout changes
    const currentScrollTop = scrollTop.value;
    if (currentScrollTop > 0) {
      setTimeout(() => {
        const mainBody = mainTableBody.value;
        const leftBody = leftTableBody.value;
        const rightBody = rightTableBody.value;
        
        [mainBody, leftBody, rightBody].filter(Boolean).forEach(container => {
          if (container) {
            container.scrollTop = currentScrollTop;
          }
        });
      }, 50);
    }
  });
}, { immediate: false });

onMounted(() => {
  // Initialize table dimensions and other setup
  fireResizeEvent()

  // Ensure all columns have an explicit width after first render
  nextTick(() => {
    const table = tableContainer.value?.querySelector('table')
    if (!table) return
    const colEls = table.querySelectorAll('col')
    if (!colEls.length) return
    let needsUpdate = false
    const newColumns = columns.value.map((col, idx) => {
      let width = col.colStyle?.width
      if (!width || width === 'auto') {
        const colEl = colEls[idx + (props.selectable ? 1 : 0)]
        if (colEl) {
          const measured = (colEl as HTMLElement).offsetWidth
          if (measured > 0) {
            needsUpdate = true
            return { ...col, colStyle: { ...col.colStyle, width: measured + 'px' } }
          }
        }
      }
      return col
    })
    if (needsUpdate) {
      columns.value = newColumns
    }
  })

  nextTick(() => {
    // Initialize table dimensions and other setup
    fireResizeEvent()
    
    // Setup initial scroll synchronization
    setupScrollSync();
    
    // Force column width synchronization
    setTimeout(() => {
      const mainHeader = mainTableHeader.value;
      const mainBody = mainTableBody.value;
      const leftBody = leftTableBody.value;
      const rightBody = rightTableBody.value;
      
      // Ensure all tables have the same colgroup structure
      const allTables = [
        mainHeader?.querySelector('table'),
        mainBody?.querySelector('table'),
        leftBody?.querySelector('table'),
        rightBody?.querySelector('table')
      ].filter(Boolean);
      
      allTables.forEach(table => {
        if (table) {
          const cols = table.querySelectorAll('colgroup col');
          cols.forEach((col: any) => {
            col.style.boxSizing = 'border-box';
          });
        }
      });
    }, 100);
  })

  // Add context menu listener
  const tableEl = tableContainer.value;
  if (tableEl) {
    tableEl.addEventListener('contextmenu', handleTableContextMenu);
  }
  
  // Initialize column reordering
  initColumnReordering()
})

watch([leftFixedColumns, normalColumns, rightFixedColumns], ([left, center, right]) => {
  // eslint-disable-next-line no-console
  console.log('leftFixedColumns:', left)
  // eslint-disable-next-line no-console
  console.log('normalColumns:', center)
  // eslint-disable-next-line no-console
  console.log('rightFixedColumns:', right)
  
  // Reinitialize column reordering when column layout changes
  nextTick(() => {
    reinitializeSortables()
  })
})

function showColumnMenu(column: TableColumn, event: MouseEvent) {
  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();
  columnMenuState.value = {
    show: true,
    top: rect.bottom,
    left: rect.left - 180, // Adjust to open to the left of the icon
    isOverflow: false, 
    selectedColumn: column
  };
}

// Handle scroll events - now handled in onMounted syncScrolling function

defineExpose({
  get leftFixedColumns() { return leftFixedColumns.value },
  get rightFixedColumns() { return rightFixedColumns.value },
  get normalColumns() { return normalColumns.value },
  get columns() { return columns.value },
  showColumnMenu,
  sort: handleSort
  })
</script> 