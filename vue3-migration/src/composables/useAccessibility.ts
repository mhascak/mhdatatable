/**
 * @fileoverview Accessibility Composable
 * Provides accessibility features, ARIA attributes, and keyboard navigation
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { TableProps } from '@/types'

export function useAccessibility(props: TableProps) {
  const focusedRowIndex = ref(-1)
  const focusedColumnIndex = ref(-1)
  const announcementRef = ref<HTMLElement>()

  /**
   * Generate appropriate ARIA label for the table
   */
  const ariaLabel = computed(() => {
    if (props.ariaLabel) return props.ariaLabel
    
    const parts = []
    if (props.data?.length) {
      parts.push(`Data table with ${props.data.length} rows`)
    } else {
      parts.push('Data table')
    }
    
    if (props.columns?.length) {
      parts.push(`and ${props.columns.length} columns`)
    }
    
    if (props.total && props.total > props.data?.length) {
      parts.push(`showing ${props.data?.length} of ${props.total} total records`)
    }
    
    return parts.join(' ')
  })

  /**
   * Generate ARIA description for table features
   */
  const ariaDescription = computed(() => {
    const features = []
    
    if (props.selectable) features.push('row selection')
    if (props.columns?.some(col => col.sortable)) features.push('column sorting')
    if (props.columns?.some(col => col.filterable)) features.push('column filtering')
    if (props.virtualized) features.push('virtual scrolling')
    
    if (features.length > 0) {
      return `Table supports: ${features.join(', ')}`
    }
    
    return undefined
  })

  /**
   * Announce changes to screen readers
   */
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.value) {
      announcementRef.value.setAttribute('aria-live', priority)
      announcementRef.value.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.value) {
          announcementRef.value.textContent = ''
        }
      }, 1000)
    }
  }

  /**
   * Handle keyboard navigation
   */
  const handleKeyNavigation = (event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey } = event
    
    switch (key) {
      case 'ArrowUp':
        event.preventDefault()
        moveFocus('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        moveFocus('down')
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveFocus('left')
        break
      case 'ArrowRight':
        event.preventDefault()
        moveFocus('right')
        break
      case 'Home':
        event.preventDefault()
        if (ctrlKey || metaKey) {
          focusFirstCell()
        } else {
          focusRowStart()
        }
        break
      case 'End':
        event.preventDefault()
        if (ctrlKey || metaKey) {
          focusLastCell()
        } else {
          focusRowEnd()
        }
        break
      case 'PageUp':
        event.preventDefault()
        moveFocus('pageUp')
        break
      case 'PageDown':
        event.preventDefault()
        moveFocus('pageDown')
        break
      case 'Enter':
      case ' ':
        if (event.target && (event.target as HTMLElement).tagName === 'BUTTON') {
          // Let buttons handle their own activation
          return
        }
        event.preventDefault()
        activateCell()
        break
    }
  }

  /**
   * Move focus in specified direction
   */
  const moveFocus = (direction: 'up' | 'down' | 'left' | 'right' | 'pageUp' | 'pageDown') => {
    const maxRows = props.data?.length || 0
    const maxCols = props.columns?.length || 0
    
    switch (direction) {
      case 'up':
        if (focusedRowIndex.value > 0) {
          focusedRowIndex.value--
        }
        break
      case 'down':
        if (focusedRowIndex.value < maxRows - 1) {
          focusedRowIndex.value++
        }
        break
      case 'left':
        if (focusedColumnIndex.value > 0) {
          focusedColumnIndex.value--
        }
        break
      case 'right':
        if (focusedColumnIndex.value < maxCols - 1) {
          focusedColumnIndex.value++
        }
        break
      case 'pageUp':
        focusedRowIndex.value = Math.max(0, focusedRowIndex.value - 10)
        break
      case 'pageDown':
        focusedRowIndex.value = Math.min(maxRows - 1, focusedRowIndex.value + 10)
        break
    }
    
    updateFocus()
  }

  /**
   * Focus first cell
   */
  const focusFirstCell = () => {
    focusedRowIndex.value = 0
    focusedColumnIndex.value = 0
    updateFocus()
  }

  /**
   * Focus last cell
   */
  const focusLastCell = () => {
    focusedRowIndex.value = (props.data?.length || 1) - 1
    focusedColumnIndex.value = (props.columns?.length || 1) - 1
    updateFocus()
  }

  /**
   * Focus start of current row
   */
  const focusRowStart = () => {
    focusedColumnIndex.value = 0
    updateFocus()
  }

  /**
   * Focus end of current row
   */
  const focusRowEnd = () => {
    focusedColumnIndex.value = (props.columns?.length || 1) - 1
    updateFocus()
  }

  /**
   * Update DOM focus based on current focus position
   */
  const updateFocus = () => {
    const cell = document.querySelector(
      `[data-row-index="${focusedRowIndex.value}"][data-col-index="${focusedColumnIndex.value}"]`
    ) as HTMLElement
    
    if (cell) {
      cell.focus()
    }
  }

  /**
   * Activate current cell (trigger click or selection)
   */
  const activateCell = () => {
    const cell = document.querySelector(
      `[data-row-index="${focusedRowIndex.value}"][data-col-index="${focusedColumnIndex.value}"]`
    ) as HTMLElement
    
    if (cell) {
      cell.click()
    }
  }

  /**
   * Generate cell attributes for accessibility
   */
  const getCellAttributes = (rowIndex: number, colIndex: number, column: any) => {
    return {
      'data-row-index': rowIndex,
      'data-col-index': colIndex,
      'tabindex': rowIndex === focusedRowIndex.value && colIndex === focusedColumnIndex.value ? 0 : -1,
      'aria-describedby': column.filterable ? `filter-${column.field}` : undefined,
      'role': 'gridcell'
    }
  }

  /**
   * Generate row attributes for accessibility
   */
  const getRowAttributes = (rowIndex: number, row: any) => {
    return {
      'data-row-index': rowIndex,
      'aria-rowindex': rowIndex + 2, // +2 because header is row 1
      'aria-selected': props.selectable ? row._isChecked : undefined,
      'role': 'row'
    }
  }

  /**
   * Generate table attributes
   */
  const getTableAttributes = () => {
    return {
      'role': 'grid',
      'aria-label': ariaLabel.value,
      'aria-description': ariaDescription.value,
      'aria-rowcount': props.total || props.data?.length || 0,
      'aria-colcount': props.columns?.length || 0,
      'aria-multiselectable': props.selectable ? true : undefined
    }
  }

  // Setup keyboard event listeners
  onMounted(() => {
    document.addEventListener('keydown', handleKeyNavigation)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyNavigation)
  })

  return {
    ariaLabel,
    ariaDescription,
    announce,
    focusedRowIndex,
    focusedColumnIndex,
    getCellAttributes,
    getRowAttributes,
    getTableAttributes,
    focusFirstCell,
    focusLastCell,
    announcementRef
  }
} 