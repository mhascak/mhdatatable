/**
 * @fileoverview Table Pagination Component
 * Combines pagination controls and page size selection in a modern, accessible design
 */

<template>
  <div class="mh-table-pagination" :class="{ 'mh-table-pagination--loading': loading }">
    <!-- Page Navigation -->
    <nav class="mh-pagination" role="navigation" :aria-label="$t('pagination.label')">
      <button
        type="button"
        class="mh-pagination__button"
        :disabled="currentPage <= 1 || loading"
        @click="handlePageChange(1)"
        :aria-label="$t('pagination.first')"
      >
        <IconFirst class="mh-icon" />
      </button>
      
      <button
        type="button"
        class="mh-pagination__button"
        :disabled="currentPage <= 1 || loading"
        @click="handlePageChange(currentPage - 1)"
        :aria-label="$t('pagination.previous')"
      >
        <IconPrevious class="mh-icon" />
      </button>
      
      <div class="mh-pagination__info">
        <span class="mh-pagination__current">{{ currentPage }}</span>
        <span class="mh-pagination__separator">of</span>
        <span class="mh-pagination__total">{{ totalPages }}</span>
      </div>
      
      <button
        type="button"
        class="mh-pagination__button"
        :disabled="currentPage >= totalPages || loading"
        @click="handlePageChange(currentPage + 1)"
        :aria-label="$t('pagination.next')"
      >
        <IconNext class="mh-icon" />
      </button>
      
      <button
        type="button"
        class="mh-pagination__button"
        :disabled="currentPage >= totalPages || loading"
        @click="handlePageChange(totalPages)"
        :aria-label="$t('pagination.last')"
      >
        <IconLast class="mh-icon" />
      </button>
    </nav>

    <!-- Page Size Selection -->
    <div class="mh-page-size">
      <label for="page-size-select" class="mh-page-size__label">
        {{ $t('pagination.pageSize') }}:
      </label>
      <select
        id="page-size-select"
        v-model="currentPageSize"
        class="mh-page-size__select"
        :disabled="loading"
        @change="handlePageSizeChange"
      >
        <option
          v-for="size in pageSizeOptions"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
      </select>
    </div>

    <!-- Total Records Info -->
    <div class="mh-pagination__summary">
      <span class="mh-pagination__total-text">
        {{ $t('pagination.total', { total: formattedTotal }) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent } from 'vue'

// Lazy load icons
const IconFirst = defineAsyncComponent(() => import('@/components/Icons/IconFirst.vue'))
const IconPrevious = defineAsyncComponent(() => import('@/components/Icons/IconPrevious.vue'))
const IconNext = defineAsyncComponent(() => import('@/components/Icons/IconNext.vue'))
const IconLast = defineAsyncComponent(() => import('@/components/Icons/IconLast.vue'))

/**
 * Component Props
 */
interface Props {
  total: number
  currentPage: number
  pageSize: number
  pageSizeOptions: number[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSizeOptions: () => [10, 20, 40, 50, 80, 100]
})

/**
 * Component Emits
 */
interface Emits {
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
}

const emit = defineEmits<Emits>()

/**
 * Reactive state
 */
const currentPageSize = ref(props.pageSize)

/**
 * Computed properties
 */
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const formattedTotal = computed(() => {
  return new Intl.NumberFormat().format(props.total)
})

/**
 * Event handlers
 */
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || props.loading) return
  emit('page-change', page)
}

const handlePageSizeChange = () => {
  emit('page-size-change', currentPageSize.value)
}

/**
 * Watchers
 */
watch(() => props.pageSize, (newSize) => {
  currentPageSize.value = newSize
})

// Internationalization helper
const $t = (key: string, params?: Record<string, any>) => {
  const translations: Record<string, string> = {
    'pagination.label': 'Pagination Navigation',
    'pagination.first': 'Go to first page',
    'pagination.previous': 'Go to previous page',
    'pagination.next': 'Go to next page',
    'pagination.last': 'Go to last page',
    'pagination.pageSize': 'Rows per page',
    'pagination.total': 'Total {total} records'
  }
  
  let translation = translations[key] || key
  
  if (params) {
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, String(params[param]))
    })
  }
  
  return translation
}
</script>

<style scoped>
.mh-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mh-spacing-4);
  padding: var(--mh-spacing-3) 0;
  flex-wrap: wrap;
}

.mh-table-pagination--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Pagination Navigation */
.mh-pagination {
  display: flex;
  align-items: center;
  gap: var(--mh-spacing-2);
}

.mh-pagination__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--mh-border-color);
  background: var(--mh-bg-primary);
  color: var(--mh-text-primary);
  border-radius: var(--mh-border-radius-sm);
  cursor: pointer;
  transition: all var(--mh-transition-fast);
}

.mh-pagination__button:hover:not(:disabled) {
  background: var(--mh-bg-hover);
  border-color: var(--mh-color-primary);
}

.mh-pagination__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mh-pagination__info {
  display: flex;
  align-items: center;
  gap: var(--mh-spacing-2);
  margin: 0 var(--mh-spacing-2);
  font-size: var(--mh-font-size-sm);
  color: var(--mh-text-secondary);
}

.mh-pagination__current {
  font-weight: var(--mh-font-weight-semibold);
  color: var(--mh-text-primary);
}

.mh-pagination__separator {
  color: var(--mh-text-muted);
}

/* Page Size Selection */
.mh-page-size {
  display: flex;
  align-items: center;
  gap: var(--mh-spacing-2);
}

.mh-page-size__label {
  font-size: var(--mh-font-size-sm);
  color: var(--mh-text-secondary);
  white-space: nowrap;
}

.mh-page-size__select {
  padding: var(--mh-spacing-1) var(--mh-spacing-2);
  border: 1px solid var(--mh-border-color);
  border-radius: var(--mh-border-radius-sm);
  background: var(--mh-bg-primary);
  color: var(--mh-text-primary);
  font-size: var(--mh-font-size-sm);
  cursor: pointer;
  transition: border-color var(--mh-transition-fast);
}

.mh-page-size__select:hover:not(:disabled) {
  border-color: var(--mh-color-primary);
}

.mh-page-size__select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Summary */
.mh-pagination__summary {
  font-size: var(--mh-font-size-sm);
  color: var(--mh-text-secondary);
  white-space: nowrap;
}

.mh-pagination__total-text {
  font-weight: var(--mh-font-weight-medium);
}

/* Icon styling */
.mh-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .mh-table-pagination {
    flex-direction: column;
    align-items: stretch;
    gap: var(--mh-spacing-3);
  }

  .mh-pagination,
  .mh-page-size {
    justify-content: center;
  }

  .mh-pagination__summary {
    text-align: center;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .mh-pagination__button {
    border-width: 2px;
  }
  
  .mh-pagination__button:hover:not(:disabled) {
    border-color: var(--mh-color-primary);
    background: var(--mh-color-primary);
    color: var(--mh-bg-primary);
  }
}
</style> 