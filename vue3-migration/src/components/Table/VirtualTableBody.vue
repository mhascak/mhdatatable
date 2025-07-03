<template>
  <div class="mh-virtual-table-body" :style="{ height: `${containerHeight}px` }">
    <div 
      ref="scrollContainer"
      class="mh-virtual-scroll-container"
      :style="{ height: `${containerHeight}px`, overflow: 'auto' }"
      @scroll="handleScroll"
    >
      <!-- Virtual spacer for total height -->
      <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
        <!-- Visible rows container -->
        <div 
          class="mh-virtual-rows-container"
          :style="{ 
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }"
        >
          <div
            v-for="({ item, index }) in visibleItems"
            :key="getRowKey(item, index)"
            class="mh-table-row"
            :class="{ 
              'mh-table-row--selected': item._isChecked,
              'mh-table-row--even': index % 2 === 0,
              'mh-table-row--odd': index % 2 === 1
            }"
            :style="{ height: `${itemHeight}px` }"
            :data-index="index"
            @click="handleRowClick(item, index)"
            @contextmenu="handleRowContextMenu(item, index, $event)"
          >
            <!-- Selection checkbox -->
            <div 
              v-if="shouldRenderSelection"
              class="mh-table-cell mh-table-cell--selection"
              :style="{ width: '50px' }"
            >
              <Checkbox
                :checked="item._isChecked"
                @change="handleCheckboxChange(item, index, $event)"
              />
            </div>

            <!-- Data cells -->
            <div
              v-for="column in columns"
              :key="column.field"
              class="mh-table-cell"
              :style="{ 
                width: `${column.width}px`,
                minWidth: `${column.width}px`,
                maxWidth: `${column.width}px`
              }"
            >
              <slot 
                :name="`cell-${column.field}`" 
                :row="item"
                :column="column"
                :value="getNestedValue(item, column.field)"
                :index="index"
              >
                {{ getNestedValue(item, column.field) }}
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useVirtualScrolling } from '../../composables/useVirtualScrolling';
import Checkbox from '../Checkbox/Checkbox.vue';
import type { TableColumn } from '../../types';

interface Props {
  data: any[];
  columns: TableColumn[];
  itemHeight?: number;
  containerHeight?: number;
  shouldRenderSelection?: boolean;
}

interface Emits {
  (e: 'row-click', row: any, index: number): void;
  (e: 'row-context-menu', row: any, index: number, event: MouseEvent): void;
  (e: 'checkbox-change', row: any, index: number, checked: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 48,
  containerHeight: 400,
  shouldRenderSelection: true
});

const emit = defineEmits<Emits>();

// Virtual scrolling setup
const {
  containerRef: scrollContainer,
  visibleItems,
  totalHeight,
  offsetY,
  handleScroll
} = useVirtualScrolling(props.data, {
  itemHeight: props.itemHeight,
  containerHeight: props.containerHeight,
  buffer: 10 // Render 10 extra rows above/below viewport
});

// Row key generation
const getRowKey = (item: any, index: number) => {
  return item.id || item._id || index;
};

// Get nested value from object path
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Event handlers
const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index);
};

const handleRowContextMenu = (row: any, index: number, event: MouseEvent) => {
  emit('row-context-menu', row, index, event);
};

const handleCheckboxChange = (row: any, index: number, checked: boolean) => {
  emit('checkbox-change', row, index, checked);
};

// Performance optimization: Only re-render when necessary
const memoizedVisibleItems = computed(() => {
  return visibleItems.value.map(({ item, index }) => ({
    item: { ...item }, // Shallow copy to prevent mutations
    index
  }));
});
</script>

<style scoped>
.mh-virtual-table-body {
  position: relative;
  overflow: hidden;
}

.mh-virtual-scroll-container {
  position: relative;
}

.mh-virtual-rows-container {
  width: 100%;
}

.mh-table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #333;
  transition: background-color 0.1s ease;
}

.mh-table-row:hover {
  background-color: #222;
}

.mh-table-row--selected {
  background-color: rgba(102, 126, 234, 0.1);
}

.mh-table-row--even {
  background-color: #161616;
}

.mh-table-row--odd {
  background-color: #1a1a1a;
}

.mh-table-cell {
  padding: 12px 16px;
  border-right: 1px solid #333;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.mh-table-cell:last-child {
  border-right: none;
}

.mh-table-cell--selection {
  justify-content: center;
  padding: 8px;
}

/* Smooth scrolling for better UX */
.mh-virtual-scroll-container {
  scroll-behavior: smooth;
}

/* Loading state */
.mh-virtual-table-body.loading {
  opacity: 0.6;
  pointer-events: none;
}
</style> 