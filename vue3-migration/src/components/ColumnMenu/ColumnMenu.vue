<template>
  <div
    class="mh-column-menu"
    :class="{ 
      'mh--overflow': isOverflow,
      'mh--above': isAbove 
    }"
    :style="{ 
      top: top + 'px', 
      left: left + 'px',
      '--arrow-offset': arrowOffset + 'px'
    }"
    v-show="show"
  >
    <header ref="tabHeader" class="mh-tab-herader">
      <span 
        @click="selectTab($event, 'setting')" 
        class="mh-tab" 
        :class="{ 'mh-tab-selected': selectedTabName === 'setting' }"
      >
        <span class="mh-icon" unselectable="on">⚙️</span>
      </span>
      <span 
        v-if="hasColumnFilter" 
        @click="selectTab($event, 'filter')" 
        class="mh-tab" 
        :class="{ 'mh-tab-selected': selectedTabName === 'filter' }"
      >
        <span class="mh-icon" unselectable="on">🔍</span>
      </span>
      <span 
        @click="selectTab($event, 'columns')" 
        class="mh-tab" 
        :class="{ 'mh-tab-selected': selectedTabName === 'columns' }"
      >
        <span class="mh-icon" unselectable="on">☰</span>
      </span>
    </header>
    <main>
      <ul v-if="selectedTabName === 'setting'" class="mh-menu mh-control">
        <li class="mh-menu__item" @click="sortAscending">
          <span class="cIcon left">↑</span>
          <span class="cName">Sort Ascending</span>
        </li>
        <li class="mh-menu__item" @click="sortDescending">
          <span class="cIcon left">↓</span>
          <span class="cName">Sort Descending</span>
        </li>
        <li class="mh-menu__item mh-separator--top">
          <span class="cIcon left">📌</span>
          <span class="cName">Pin Column</span>
          <span class="cIcon">▶</span>
          <ul class="mh-menu--submenu">
            <li @click="pinColumnLeft" class="mh-menu__item">
              <span class="cIcon left" v-if="isColumnPinnedLeft">✓</span>
              <span class="cName">Pin left</span>
            </li>
            <li @click="pinColumnRight" class="mh-menu__item">
              <span class="cIcon left" v-if="isColumnPinned && !isColumnPinnedLeft">✓</span>
              <span class="cName">Pin right</span>
            </li>
            <li v-if="isColumnPinned" @click="cancelPin" class="mh-menu__item">
              <span class="cName">No pin</span>
            </li>
          </ul>
        </li>
        <li class="mh-menu__item mh-separator--top" @click="setColumnAutoWidth">
          <span class="cIcon left">↔</span>
          <span class="cName">Autosize This Column</span>
        </li>
        <li class="mh-menu__item" @click="setAllColumnAutoWidth">
          <span class="cIcon left">↔</span>
          <span class="cName">Autosize All Columns</span>
        </li>
        <li class="mh-menu__item mh-separator--top" @click="openColumnChooser">
          <span class="cIcon left">📊</span>
          <span class="cName">Group by P&L</span>
        </li>
        <li class="mh-menu__item mh-separator--top" @click="openColumnChooser">
          <span class="cIcon left">☰</span>
          <span class="cName">Choose Columns</span>
        </li>
        <li class="mh-menu__item" @click="resetColumns">
          <span class="cIcon left">⟲</span>
          <span class="cName">Reset Columns</span>
        </li>
      </ul>
      <div v-if="selectedTabName === 'columns'" class="mh-menu mh-control mh-column-list-wrap">
        <ul class="mh-menu--submenu mh-column-list">
          <li v-for="(col, index) in columns" :key="index" class="mh-menu__item">
            <Checkbox 
              :status="{ checked: isColVisible(col) }" 
              :title="col.title" 
              @onChange="handleColumnVisibilityChange(col, $event)" 
              :label="col.title"
            />
          </li>
        </ul>
      </div>
      <component
        v-else-if="selectedTabName === 'filter' && selectedColumn != null && !selectedColumn.isFilterDisabled && selectedColumn.hasOwnProperty('thComp')"
        ref="dynamicFilterContent"
        :is="forDynCompIs(selectedColumn.thComp)"
        :key="key"
        :column="selectedColumn"
        :columns="columns"
        :query="query"
        :xprops="xprops"
        :field="selectedColumn.field"
        :title="selectedColumn.title"
        @close-column-menu="close"
      />
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Checkbox from '../Checkbox/Checkbox.vue'
import { isColVisible } from '../../utils/isColVisible'
import type { TableColumn, Query, XProps } from '../../types'

interface Props {
  selectedColumn?: TableColumn | null
  columns: TableColumn[]
  show: boolean
  top: number
  left: number
  isOverflow?: boolean
  isAbove?: boolean
  arrowOffset?: number
  query: Query
  xprops: XProps
}

const props = withDefaults(defineProps<Props>(), {
  selectedColumn: null,
  isOverflow: false,
  isAbove: false,
  arrowOffset: 20
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'reset-columns': []
  'reset-filters': []
  'set-auto-allColumns-width': [column: TableColumn]
  'set-auto-column-width': [column: TableColumn]
  'column-unpinned-left': [width: string | number]
  'column-unpinned-right': [width: string | number]
  'column-pinned-left': [width: string | number]
  'column-pinned-right': [width: string | number]
  'force-grid-resize': []
}>()

const { t: $t } = useI18n()

const selectedTabName = ref('filter')
const changes = ref<Array<{ col: TableColumn; isChecked: boolean }>>([])
const key = ref(Date.now())
const tabHeader = ref<HTMLElement>()
const dynamicFilterContent = ref()
let _touchEvent: string

const hasColumnFilter = computed(() => {
  return props.selectedColumn && 
         props.selectedColumn.hasOwnProperty('thComp') && 
         !props.selectedColumn.isFilterDisabled
})

const hasColumnFixedWidth = computed(() => {
  return props.selectedColumn != null && 
         props.selectedColumn.hasOwnProperty('colStyle') && 
         props.selectedColumn.colStyle.hasOwnProperty('width') && 
         props.selectedColumn.colStyle.width !== 'auto'
})

const isColumnPinned = computed(() => {
  if (props.selectedColumn != null && 
      props.selectedColumn.hasOwnProperty('fixed') && 
      (props.selectedColumn.fixed === true || 
       props.selectedColumn.fixed === 'left' || 
       props.selectedColumn.fixed === 'right')) {
    return true
  }
  return false
})

const isColumnPinnedLeft = computed(() => {
  if (props.selectedColumn != null && 
      props.selectedColumn.hasOwnProperty('fixed') && 
      (props.selectedColumn.fixed === true || 
       props.selectedColumn.fixed === 'left')) {
    return true
  }
  return false
})

const close = () => {
  emit('update:show', false)
}

const selectTab = ($event: Event, tabName: string) => {
  if (selectedTabName.value === tabName) {
    emit('update:show', false)
  }
  selectedTabName.value = tabName
}

const resetColumns = () => {
  emit('reset-columns')
  emit('update:show', false)
  emit('force-grid-resize')
}

const resetFilters = () => {
  emit('reset-filters')
  emit('update:show', false)
  emit('force-grid-resize')
}

const setAllColumnAutoWidth = () => {
  if (props.selectedColumn) {
    emit('set-auto-allColumns-width', props.selectedColumn)
    emit('update:show', false)
    emit('force-grid-resize')
  }
}

const setColumnAutoWidth = () => {
  if (props.selectedColumn) {
    emit('set-auto-column-width', props.selectedColumn)
    emit('update:show', false)
    emit('force-grid-resize')
  }
}

const cancelPin = () => {
  if (!props.selectedColumn) return

  if (props.selectedColumn.fixed === 'left') {
    emit('column-unpinned-left', props.selectedColumn.colStyle?.width || 'auto')
  }

  if (props.selectedColumn.fixed === 'right') {
    emit('column-unpinned-right', props.selectedColumn.colStyle?.width || 'auto')
  }

  props.selectedColumn.fixed = false
  emit('update:show', false)
  emit('force-grid-resize')
}

const pinColumnLeft = () => {
  if (!props.selectedColumn) return

  props.selectedColumn.fixed = 'left'
  emit('column-pinned-left', props.selectedColumn.colStyle?.width || 'auto')
  emit('update:show', false)
  emit('force-grid-resize')
}

const pinColumnRight = () => {
  if (!props.selectedColumn) return

  props.selectedColumn.fixed = 'right'
  emit('column-pinned-right', props.selectedColumn.colStyle?.width || 'auto')
  emit('update:show', false)
  emit('force-grid-resize')
}

const handleColumnVisibilityChange = (col: TableColumn, isChecked: boolean) => {
  col.visible = isChecked
  emit('force-grid-resize')
}

const eventEndHandler = (evt: Event) => {
  const target = evt.target as HTMLElement
  if (target && !target.closest('.mh-column-menu') && props.show) {
    emit('update:show', false)
  }
}

const optionSelected = (e: Event, option: any) => {
  // Handle option selection if needed
}

const uuidGen = (key: string) => {
  return `-col-${Date.now()}-${key}`
}

const apply = () => {
  changes.value.forEach(({ col, isChecked }) => {
    col.visible = isChecked
  })
  changes.value = []
}

const forDynCompIs = (component: any) => {
  return component
}

const sortAscending = () => {
  if (props.selectedColumn) {
    // Create new array to trigger reactivity
    props.query.sort.splice(0, props.query.sort.length, { field: props.selectedColumn.field, direction: 'asc' })
    emit('update:show', false)
  }
}

const sortDescending = () => {
  if (props.selectedColumn) {
    // Create new array to trigger reactivity
    props.query.sort.splice(0, props.query.sort.length, { field: props.selectedColumn.field, direction: 'desc' })
    emit('update:show', false)
  }
}

const openColumnChooser = () => {
  selectedTabName.value = 'columns'
}

watch(() => props.selectedColumn, (newValue) => {
  key.value = Date.now()
  if (selectedTabName.value === 'filter' && !hasColumnFilter.value) {
    selectedTabName.value = 'setting'
  }
}, { deep: true, immediate: true })

onMounted(() => {
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  _touchEvent = touchSupport ? 'touchend' : 'click'
  document.body.addEventListener(_touchEvent, eventEndHandler)
  
  // Add dynamic submenu positioning
  nextTick(() => {
    const menuElement = document.querySelector('.mh-column-menu')
    if (menuElement) {
      const menuItems = menuElement.querySelectorAll('.mh-menu__item')
      menuItems.forEach((item: any) => {
        const submenu = item.querySelector('.mh-menu--submenu')
        if (submenu) {
          item.addEventListener('mouseenter', () => {
            // Check if submenu would overflow on the right
            const itemRect = item.getBoundingClientRect()
            const submenuWidth = 140 // min-width from CSS
            const viewportWidth = window.innerWidth
            
            if (itemRect.right + submenuWidth > viewportWidth - 10) {
              // Position submenu to the left
              submenu.style.left = 'auto'
              submenu.style.right = '100%'
            } else {
              // Position submenu to the right (default)
              submenu.style.left = '100%'
              submenu.style.right = 'auto'
            }
          })
        }
      })
    }
  })
})

onBeforeUnmount(() => {
  document.body.removeEventListener(_touchEvent, eventEndHandler)
})
</script>

<style scoped>
/* Component-specific styles that override global menu styles */
.mh-control {
  box-sizing: border-box;
}

.mh-column-menu ul .mh-menu__item label.mh-checkbox-wrapper {
  text-overflow: ellipsis;
  overflow: hidden;
}

.mh-column-menu li.mh-menu__item ul.mh-column-list li.mh-menu__item {
  font-weight: normal;
}

.mh-column-menu .mh-checkbox-label {
  font-weight: normal;
}
</style> 