import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Sortable from 'sortablejs'
import type { TableColumn } from '@/types'

/**
 * Column reordering composable using SortableJS
 * Handles synchronization between multiple table sections (left fixed, main, right fixed)
 */
export function useColumnReordering(
  columns: any, 
  emit: any,
  options: {
    onReorder?: (newOrder: TableColumn[]) => void
    onStart?: (event: any) => void
    onEnd?: (event: any) => void
  } = {}
) {
  const sortableInstances = ref<Map<string, Sortable>>(new Map())
  const isDragging = ref(false)
  const dragClue = ref<HTMLElement | null>(null)
  const reorderCue = ref<HTMLElement | null>(null)
  const currentDragColumn = ref<TableColumn | null>(null)

  /**
   * Initialize sortable on a table header element
   */
  const initSortable = (element: HTMLElement, tableType: 'left' | 'right' | 'main' = 'main') => {
    if (!element) {
      console.warn('No element provided for sortable initialization')
      return null
    }

    // Destroy existing sortable for this table type
    const existingSortable = sortableInstances.value.get(tableType)
    if (existingSortable) {
      existingSortable.destroy()
    }

    const sortable = Sortable.create(element, {
      draggable: 'th.draggable',
      animation: 150,
      dataIdAttr: 'data-index',
      ghostClass: 'mh-column-dragging-ghost',
      dragClass: 'mh-column-dragging',
      chosenClass: 'mh-column-chosen',
      fallbackClass: 'mh-column-fallback',
      
      // Prevent sorting between different table sections
      group: {
        name: tableType,
        pull: false,
        put: false
      },

      onStart: function(event: any) {
        // Check if the drag started from a resize handle (more targeted check)
        const target = event.originalEvent?.target || event.target
        if (target && target.classList.contains('mh-table-resize-handle')) {
          console.log('Drag blocked: started from resize handle')
          return false // Prevent drag
        }
        
        // Column drag started successfully
        isDragging.value = true
        
        // Get the column being dragged
        const columnIndex = parseInt(event.item.dataset.index || '0')
        currentDragColumn.value = columns.value.find((col: TableColumn) => col.index === columnIndex) || null
        
        // Show drag clue
        if (dragClue.value && currentDragColumn.value) {
          const columnTitle = currentDragColumn.value.title || currentDragColumn.value.field || 'Column'
          dragClue.value.textContent = columnTitle
          dragClue.value.classList.add('mh-drag-clue--active')
        }

        // Add drag event listener for positioning
        document.addEventListener('dragover', handleDragMove)
        document.addEventListener('drop', handleDragEnd)
        
        options.onStart?.(event)
        emit?.('column-drag-start', { 
          columnIndex: event.oldIndex, 
          tableType,
          column: currentDragColumn.value
        })
      },

      onMove: function(event: any) {
        // Show reorder cue
        if (reorderCue.value && event.related) {
          const rect = event.related.getBoundingClientRect()
          reorderCue.value.style.display = 'block'
          reorderCue.value.style.top = (rect.top - 5) + 'px'
          reorderCue.value.style.height = (rect.height + 10) + 'px'
          
          // Position cue based on drag direction
          if (event.draggedRect && event.relatedRect) {
            if (event.draggedRect.left > event.relatedRect.left) {
              // Dragging from right to left - show cue on left side
              reorderCue.value.style.left = (rect.left - 2) + 'px'
            } else {
              // Dragging from left to right - show cue on right side
              reorderCue.value.style.left = (rect.right - 2) + 'px'
            }
          }
        }
        
        return true // Allow the move
      },

      onEnd: function(event: any) {
        isDragging.value = false
        
        // Hide drag clue
        if (dragClue.value) {
          dragClue.value.classList.remove('mh-drag-clue--active')
        }
        
        // Hide reorder cue
        if (reorderCue.value) {
          reorderCue.value.style.display = 'none'
        }

        // Remove drag event listeners
        document.removeEventListener('dragover', handleDragMove)
        document.removeEventListener('drop', handleDragEnd)

        // Handle the reorder if position changed
        if (event.oldIndex !== event.newIndex) {
          handleColumnReorder(event.oldIndex, event.newIndex, tableType)
        }

        currentDragColumn.value = null

        options.onEnd?.(event)
        emit?.('column-drag-end', { 
          oldIndex: event.oldIndex, 
          newIndex: event.newIndex,
          tableType,
          column: currentDragColumn.value
        })
      }
    })

    // Sortable instance created successfully
    sortableInstances.value.set(tableType, sortable)
    return sortable
  }

  /**
   * Handle drag move for positioning drag clue
   */
  const handleDragMove = (event: DragEvent) => {
    if (dragClue.value && isDragging.value) {
      const scrollTop = window.scrollY
      const scrollLeft = window.scrollX
      dragClue.value.style.top = (event.clientY + scrollTop + 10) + 'px'
      dragClue.value.style.left = (event.clientX + scrollLeft + 10) + 'px'
    }
  }

  /**
   * Handle drag end cleanup
   */
  const handleDragEnd = () => {
    // Additional cleanup if needed
    if (reorderCue.value) {
      reorderCue.value.style.display = 'none'
    }
  }

  /**
   * Handle column reorder with proper synchronization
   */
  const handleColumnReorder = (oldIndex: number, newIndex: number, tableType: string) => {
    if (oldIndex === newIndex) return

    console.log(`Column reorder: ${oldIndex} -> ${newIndex} in ${tableType} table`)

    // Get the columns for the specific table type
    let relevantColumns: TableColumn[] = []
    let columnOffset = 0

    switch (tableType) {
      case 'left':
        relevantColumns = columns.value.filter((col: TableColumn) => col.fixed === 'left')
        columnOffset = 0
        break
      case 'right':
        relevantColumns = columns.value.filter((col: TableColumn) => col.fixed === 'right')
        columnOffset = columns.value.filter((col: TableColumn) => col.fixed !== 'right').length
        break
      case 'main':
      default:
        relevantColumns = columns.value.filter((col: TableColumn) => !col.fixed || (col.fixed !== 'left' && col.fixed !== 'right'))
        columnOffset = columns.value.filter((col: TableColumn) => col.fixed === 'left').length
        break
    }

    if (oldIndex >= relevantColumns.length || newIndex >= relevantColumns.length) {
      console.warn('Invalid column indices for reorder')
      return
    }

    // Get the actual columns being moved
    const draggedColumn = relevantColumns[oldIndex]
    if (!draggedColumn) {
      console.warn('Could not find dragged column')
      return
    }

    // Create new column order
    const newColumns = [...columns.value]
    
    // Find the actual indices in the full columns array
    const draggedGlobalIndex = newColumns.findIndex(col => col.index === draggedColumn.index)
    if (draggedGlobalIndex === -1) {
      console.warn('Could not find dragged column in global array')
      return
    }

    // Calculate the target global index
    let targetGlobalIndex: number
    if (newIndex === 0) {
      // Moving to the beginning of the section
      targetGlobalIndex = columnOffset
    } else if (newIndex >= relevantColumns.length - 1) {
      // Moving to the end of the section
      targetGlobalIndex = columnOffset + relevantColumns.length - 1
    } else {
      // Moving within the section
      const targetColumn = relevantColumns[newIndex]
      targetGlobalIndex = newColumns.findIndex(col => col.index === targetColumn.index)
    }

    // Perform the reorder
    const [movedColumn] = newColumns.splice(draggedGlobalIndex, 1)
    newColumns.splice(targetGlobalIndex, 0, movedColumn)

    // Update column indices to maintain consistency
    const reorderedColumns = newColumns.map((col, index) => ({
      ...col,
      index
    }))

    // Update the columns
    columns.value = reorderedColumns

    console.log('Column reorder completed:', {
      draggedColumn: draggedColumn.title,
      oldGlobalIndex: draggedGlobalIndex,
      newGlobalIndex: targetGlobalIndex,
      tableType
    })

    // Emit reorder event
    emit?.('columns-reordered', {
      oldIndex: draggedGlobalIndex,
      newIndex: targetGlobalIndex,
      columns: reorderedColumns,
      tableType
    })

    options.onReorder?.(reorderedColumns)

    // Force re-initialization of sortables after reorder
    nextTick(() => {
      reinitializeSortables()
    })
  }

  /**
   * Reinitialize all sortable instances
   */
  const reinitializeSortables = () => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      // Reinitialize sortables for all table sections
      const mainHeader = document.querySelector('.mh-table-main thead tr')
      if (mainHeader) {
        initSortable(mainHeader as HTMLElement, 'main')
      }

      const leftHeader = document.querySelector('.mh-table-fixed-left thead tr')
      if (leftHeader) {
        initSortable(leftHeader as HTMLElement, 'left')
      }

      const rightHeader = document.querySelector('.mh-table-fixed-right thead tr')
      if (rightHeader) {
        initSortable(rightHeader as HTMLElement, 'right')
      }
    }, 100)
  }

  /**
   * Initialize drag and drop elements
   */
  const initDragElements = () => {
    nextTick(() => {
      // Create drag clue if it doesn't exist
      if (!dragClue.value) {
        dragClue.value = document.createElement('div')
        dragClue.value.className = 'mh-drag-clue'
        document.body.appendChild(dragClue.value)
      }

      // Create reorder cue if it doesn't exist
      if (!reorderCue.value) {
        reorderCue.value = document.createElement('div')
        reorderCue.value.className = 'mh-reorder-cue'
        document.body.appendChild(reorderCue.value)
      }
    })
  }

  /**
   * Destroy all sortable instances
   */
  const destroySortables = () => {
    sortableInstances.value.forEach(sortable => {
      sortable.destroy()
    })
    sortableInstances.value.clear()
  }

  /**
   * Clean up drag elements
   */
  const cleanupDragElements = () => {
    if (dragClue.value && document.body.contains(dragClue.value)) {
      document.body.removeChild(dragClue.value)
      dragClue.value = null
    }
    if (reorderCue.value && document.body.contains(reorderCue.value)) {
      document.body.removeChild(reorderCue.value)
      reorderCue.value = null
    }
  }

  /**
   * Enable/disable column reordering
   */
  const setEnabled = (enabled: boolean) => {
    sortableInstances.value.forEach(sortable => {
      sortable.option('disabled', !enabled)
    })
  }

  // Initialize drag elements on mount
  onMounted(() => {
    initDragElements()
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    destroySortables()
    cleanupDragElements()
    document.removeEventListener('dragover', handleDragMove)
    document.removeEventListener('drop', handleDragEnd)
  })

  return {
    initSortable,
    destroySortables,
    reinitializeSortables,
    setEnabled,
    isDragging,
    dragClue,
    reorderCue,
    handleColumnReorder
  }
} 