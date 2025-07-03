<template>
  <thead class="mh-table-header">
    <tr class="mh-table-row">
      <th class="mh-table-cell -selectable-column" v-if="shouldRenderSelection" key="--th-multi">
        <MultiSelect :status="{ indeterminate, allCheck }" @onChange="checked => handleEvent(null, 'toggleCheckAll', null, { isChecked: checked })" />
      </th>
      <th v-for="(col, idx) in tableColumns"
          :key="col.field + col.index + col.isFilterApplied + ''"
          :data-index="col.index"
          :class="['mh-table-cell draggable', col.thClass, col.tdClass]"
          :style="{ width: col.colStyle.width, minWidth: col.colStyle.minWidth || '80px' }"
          @click="col.sortable ? handleSort(col) : null"
          style="cursor: pointer; position: relative;"
      >
        <template v-if="$slots[`header-${col.field}`]">
          <slot :name="`header-${col.field}`" :column="col" />
        </template>
        <template v-else-if="$slots.header">
          <slot name="header" :column="col"></slot>
        </template>
        <template v-else-if="col.thComp">
          <component :is="col.thComp" :column="col" />
        </template>
        <template v-else>
          <div class="mh-table-header-label">
            <button class="mh-table-header-burger" aria-haspopup="true" :aria-expanded="menuOpen === idx" @click.stop="toggleMenu(idx)" @keydown.enter.stop.prevent="toggleMenu(idx)" tabindex="0" :aria-label="`Column menu for ${col.title}`">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="3" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/></svg>
            </button>
            <div v-if="menuOpen === idx" class="mh-table-header-menu-dropdown" tabindex="-1" @keydown.esc="closeMenu" @blur="closeMenu" ref="menuDropdown">
              <ul class="mh-table-header-menu-list" role="menu">
                <li role="menuitem" tabindex="0" @click="emitMenu('sortAsc', col)">↑ Sort Ascending</li>
                <li role="menuitem" tabindex="0" @click="emitMenu('sortDesc', col)">↓ Sort Descending</li>
                <li role="menuitem" tabindex="0" @click="emitMenu('pinLeft', col)">
                  <span v-if="col.fixed === 'left'">✔ </span>Pin Left
                </li>
                <li role="menuitem" tabindex="0" @click="emitMenu('pinRight', col)">
                  <span v-if="col.fixed === 'right'">✔ </span>Pin Right
                </li>
                <li role="menuitem" tabindex="0" @click="emitMenu('unpin', col)">
                  <span v-if="!col.fixed">✔ </span>Unpin
                </li>
                <li role="menuitem" tabindex="0" @click="emitMenu('autosize', col)">↔ Autosize This Column</li>
                <li role="menuitem" tabindex="0" @click="emitMenu('autosizeAll', col)">↔ Autosize All Columns</li>
                <li role="menuitem" tabindex="0" @click="emitMenu('chooseColumns', col)">☰ Choose Columns</li>
                <li role="menuitem" tabindex="0" @click="emitMenu('resetColumns', col)">⟲ Reset Columns</li>
                <li role="menuitem" tabindex="0" @click="emitMenu('filter', col)">⏷ Filter</li>
              </ul>
            </div>
            <span v-if="!col.isMenuDisabled" class="mh-table-header-menu" :class="{ 'filter-applied': col.isFilterApplied }" @click.prevent.stop="handleEvent($event, 'showColumnMenu', { column: col, columnIndex: idx }, {})">
              <i class="fa fa-bars" aria-hidden="true"></i>
            </span>
            <div class="mh-table-header-title">
              <span class="mh-table-header-text" :title="col.title">{{ col.title }}</span>
              <span class="mh-table-header-info" v-if="col.explain">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><rect x="7.25" y="4.5" width="1.5" height="1.5" rx="0.75" fill="currentColor"/><rect x="7.25" y="7" width="1.5" height="4.5" rx="0.75" fill="currentColor"/></svg>
              </span>
              <HeadSort v-if="col.sortable" :field="col.field" :query="query" />
            </div>
          </div>
        </template>
        <div ref="resizeContainer" :data-index="col.index" @mousedown="resizeStart($event, col)" @dragstart="preventDrag" @drag="preventDrag" class="mh-table-resize-handle"></div>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import HeadSort from './HeadSort.vue'
import MultiSelect from './MultiSelect.vue'
import { isColVisible } from '@/utils/isColVisible'

const props = defineProps<{
  tableColumns: any[],
  query: any,
  shouldRenderSelection?: boolean,
  leftFixed?: boolean,
  rightFixed?: boolean,
  bodyData?: any[]
}>()
const emit = defineEmits(['handle-event', 'header-resize', 'sort', 'menu-action'])

const isMoving = ref(false)
const movingColumn = ref<any>(null)
const movingElement = ref<any>(null)
const movingStartX = ref<number | null>(null)
const menuOpen = ref<number|null>(null)
const menuDropdown = ref<HTMLElement|null>(null)

function handleEvent($event: any, type: string, data?: any, others?: any) {
  emit('handle-event', $event, type, data, others)
}

function handleSort(col: any) {
  emit('sort', col.field)
}

function emitMenu(action: string, col: any) {
  emit('menu-action', { action, col })
  closeMenu()
}

function toggleMenu(idx: number) {
  if (menuOpen.value === idx) {
    closeMenu()
  } else {
    menuOpen.value = idx
    nextTick(() => {
      const el = menuDropdown.value as HTMLElement | null
      if (el && typeof el.focus === 'function') {
        el.focus()
      }
    })
  }
}
function closeMenu() {
  menuOpen.value = null
}

function preventDrag(e: Event) {
  e.preventDefault()
  e.stopPropagation()
}

function resizeStart(e: MouseEvent, col: any) {
  e.preventDefault()
  e.stopPropagation()
  movingStartX.value = e.pageX
  isMoving.value = true
  movingColumn.value = col
  movingElement.value = (e.target as HTMLElement).parentElement
  
  // Mark the column as being resized to prevent drag conflicts
  if (movingElement.value) {
    movingElement.value.setAttribute('data-resizing', 'true')
  }
  
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', handleResize)
  window.addEventListener('mouseup', resizeEnd)
  emit('header-resize', { event: 'start', col })
  return false
}

function getDeltaX(e: MouseEvent) {
  if (movingStartX.value === null) return 0
  let deltaX = e.pageX - movingStartX.value
  if (tableType.value === 'R') deltaX = -deltaX
  return deltaX
}

function getNewWidth(deltaX: number) {
  if (!movingElement.value) return 0
  const oldWidth = parseFloat((movingElement.value.offsetWidth || 0).toString())
  return oldWidth + deltaX
}

function resizeEnd(e: MouseEvent) {
  document.body.style.cursor = 'default'
  document.body.style.userSelect = ''
  window.removeEventListener('mouseup', resizeEnd)
  window.removeEventListener('mousemove', handleResize)
  
  // Remove the resizing marker
  if (movingElement.value) {
    movingElement.value.removeAttribute('data-resizing')
  }
  
  const deltaX = getDeltaX(e)
  const newWidth = getNewWidth(deltaX)
  emit('header-resize', { event: 'end', col: movingColumn.value, newWidth })
  isMoving.value = false
  movingColumn.value = null
  movingElement.value = null
  movingStartX.value = null
}

function handleResize(e: MouseEvent) {
  if (isMoving.value && movingColumn.value && movingElement.value) {
    const deltaX = getDeltaX(e)
    const newWidth = getNewWidth(deltaX)
    emit('header-resize', { event: 'resizing', col: movingColumn.value, newWidth, deltaX })
  }
}

const allCheck = computed(() => props.bodyData?.every((row: any) => row._isChecked))
const indeterminate = computed(() => !allCheck.value && props.bodyData?.some((row: any) => row._isChecked))
const tableType = computed(() => props.leftFixed ? 'L' : props.rightFixed ? 'R' : 'M')
</script>

<style scoped>
.mh-table-header-burger {
  background: none;
  border: none;
  padding: 0 4px;
  margin-right: 4px;
  cursor: pointer;
  color: inherit;
  outline: none;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
}
.mh-table-header-burger:focus {
  outline: 2px solid var(--datatable-focus-color, #007bff);
}
.mh-table-header-menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background: var(--datatable-menu-bg, #232b36);
  color: var(--datatable-menu-color, #fff);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  padding: 4px 0;
  margin-top: 2px;
}
.mh-table-header-menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.mh-table-header-menu-list li {
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  font-size: 15px;
  display: flex;
  align-items: center;
}
.mh-table-header-menu-list li:focus,
.mh-table-header-menu-list li:hover {
  background: var(--datatable-menu-hover-bg, #2d3a4a);
  outline: none;
}
.mh-table-header-info svg {
  margin-left: 4px;
  vertical-align: middle;
  color: var(--datatable-info-icon-color, #888);
}
.mh-table-cell {
  min-width: 80px;
}
.mh-table-header-label, .mh-table-header-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}
</style> 