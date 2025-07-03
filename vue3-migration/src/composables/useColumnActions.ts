/**
 * @fileoverview Column Actions Composable
 * 
 * Handles all column-related operations including:
 * - Column pinning/unpinning
 * - Auto-sizing columns
 * - Column reordering
 * - Column visibility
 * - Column width calculations
 * 
 * @author MH DataTable Team  
 * @version 4.0.0
 */

import { ref, computed, nextTick } from 'vue'
import type { TableColumn } from '@/types'

export interface ColumnMetrics {
  averageContentWidth: number
  maxContentWidth: number
  minWidth: number
  recommendedWidth: number
}

/**
 * Column actions composable
 */
export function useColumnActions(columns: any) {
  const MIN_COLUMN_WIDTH = 60
  const MAX_COLUMN_WIDTH = 500
  const DEFAULT_COLUMN_WIDTH = 120

  /**
   * Pin column to the left
   */
  const pinColumnLeft = (columnField: string) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      column.fixed = 'left'
      // Re-order columns to move pinned columns to the beginning
      reorderPinnedColumns()
    }
  }

  /**
   * Pin column to the right
   */
  const pinColumnRight = (columnField: string) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      column.fixed = 'right'
      // Re-order columns to move pinned columns to the end
      reorderPinnedColumns()
    }
  }

  /**
   * Unpin column
   */
  const unpinColumn = (columnField: string) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      column.fixed = false
      delete column.fixed
    }
  }

  /**
   * Reorder columns to group pinned columns
   */
  const reorderPinnedColumns = () => {
    const leftFixed = columns.value.filter((col: TableColumn) => col.fixed === 'left')
    const normal = columns.value.filter((col: TableColumn) => !col.fixed)
    const rightFixed = columns.value.filter((col: TableColumn) => col.fixed === 'right')
    
    columns.value = [...leftFixed, ...normal, ...rightFixed].map((col, index) => ({
      ...col,
      index
    }))
  }

  /**
   * Calculate column metrics for auto-sizing
   */
  const calculateColumnMetrics = (
    columnField: string, 
    data: any[], 
    headerText: string
  ): ColumnMetrics => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      return {
        averageContentWidth: DEFAULT_COLUMN_WIDTH,
        maxContentWidth: DEFAULT_COLUMN_WIDTH,
        minWidth: MIN_COLUMN_WIDTH,
        recommendedWidth: DEFAULT_COLUMN_WIDTH
      }
    }

    // Set font to match table
    context.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    
    // Measure header width
    const headerWidth = context.measureText(headerText).width + 32 // padding

    // Measure content widths
    const contentWidths: number[] = []
    const sampleSize = Math.min(data.length, 100) // Sample first 100 rows for performance

    for (let i = 0; i < sampleSize; i++) {
      const value = getNestedValue(data[i], columnField)
      const text = String(value || '')
      const width = context.measureText(text).width + 32 // padding
      contentWidths.push(width)
    }

    const averageContentWidth = contentWidths.length > 0 
      ? contentWidths.reduce((a, b) => a + b, 0) / contentWidths.length 
      : DEFAULT_COLUMN_WIDTH

    const maxContentWidth = Math.max(headerWidth, ...contentWidths, MIN_COLUMN_WIDTH)

    // Calculate recommended width with some constraints
    const recommendedWidth = Math.min(
      Math.max(
        Math.max(headerWidth, averageContentWidth * 1.2), 
        MIN_COLUMN_WIDTH
      ),
      MAX_COLUMN_WIDTH
    )

    return {
      averageContentWidth,
      maxContentWidth: Math.min(maxContentWidth, MAX_COLUMN_WIDTH),
      minWidth: MIN_COLUMN_WIDTH,
      recommendedWidth: Math.round(recommendedWidth)
    }
  }

  /**
   * Auto-size a specific column
   */
  const autosizeColumn = (columnField: string, data: any[]) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (!column) return

    const metrics = calculateColumnMetrics(columnField, data, column.title)
    
    // Update column width
    column.colStyle = {
      ...column.colStyle,
      width: `${metrics.recommendedWidth}px`
    }
  }

  /**
   * Auto-size all columns
   */
  const autosizeAllColumns = (data: any[]) => {
    columns.value.forEach((column: TableColumn) => {
      if (column.visible !== false) {
        autosizeColumn(column.field, data)
      }
    })
  }

  /**
   * Set specific width for a column
   */
  const setColumnWidth = (columnField: string, width: number) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      const constrainedWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, width))
      column.colStyle = {
        ...column.colStyle,
        width: `${constrainedWidth}px`
      }
    }
  }

  /**
   * Toggle column visibility
   */
  const toggleColumnVisibility = (columnField: string) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      column.visible = column.visible !== false ? false : true
    }
  }

  /**
   * Show column
   */
  const showColumn = (columnField: string) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      column.visible = true
    }
  }

  /**
   * Hide column
   */
  const hideColumn = (columnField: string) => {
    const column = columns.value.find((col: TableColumn) => col.field === columnField)
    if (column) {
      column.visible = false
    }
  }

  /**
   * Reset columns to default state
   */
  const resetColumns = (originalColumns: TableColumn[]) => {
    columns.value = originalColumns.map((col, index) => ({
      ...col,
      index,
      fixed: false,
      visible: true,
      colStyle: {
        width: `${DEFAULT_COLUMN_WIDTH}px`,
        ...col.colStyle
      }
    }))
  }

  /**
   * Reorder columns
   */
  const reorderColumns = (newOrder: string[]) => {
    const reorderedColumns = newOrder
      .map(field => columns.value.find((col: TableColumn) => col.field === field))
      .filter(Boolean)
      .map((col, index) => ({ ...col, index }))
    
    columns.value = reorderedColumns
  }

  /**
   * Get total width of visible columns
   */
  const getTotalWidth = computed(() => {
    return columns.value
      .filter((col: TableColumn) => col.visible !== false)
      .reduce((total: number, col: TableColumn) => {
        const width = col.colStyle?.width 
          ? parseInt(col.colStyle.width.toString().replace('px', ''))
          : DEFAULT_COLUMN_WIDTH
        return total + width
      }, 0)
  })

  /**
   * Get columns by fixed position
   */
  const getColumnsByPosition = computed(() => {
    return {
      left: columns.value.filter((col: TableColumn) => col.fixed === 'left'),
      normal: columns.value.filter((col: TableColumn) => !col.fixed),
      right: columns.value.filter((col: TableColumn) => col.fixed === 'right')
    }
  })

  /**
   * Helper function to get nested value
   */
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Calculate optimal column distribution
   */
  const distributeColumnsEvenly = (containerWidth: number) => {
    const visibleColumns = columns.value.filter((col: TableColumn) => col.visible !== false)
    const columnWidth = Math.max(MIN_COLUMN_WIDTH, containerWidth / visibleColumns.length)
    
    visibleColumns.forEach((column: TableColumn) => {
      column.colStyle = {
        ...column.colStyle,
        width: `${Math.round(columnWidth)}px`
      }
    })
  }

  /**
   * Smart column width adjustment
   */
  const adjustColumnWidths = (containerWidth: number, priority: 'content' | 'equal' = 'content') => {
    const visibleColumns = columns.value.filter((col: TableColumn) => col.visible !== false)
    
    if (priority === 'equal') {
      distributeColumnsEvenly(containerWidth)
      return
    }

    // Content-based distribution
    const totalCurrentWidth = getTotalWidth.value
    const scaleFactor = containerWidth / totalCurrentWidth

    visibleColumns.forEach((column: TableColumn) => {
      const currentWidth = column.colStyle?.width 
        ? parseInt(column.colStyle.width.toString().replace('px', ''))
        : DEFAULT_COLUMN_WIDTH
      
      const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(currentWidth * scaleFactor))
      
      column.colStyle = {
        ...column.colStyle,
        width: `${newWidth}px`
      }
    })
  }

  return {
    // Column positioning
    pinColumnLeft,
    pinColumnRight,
    unpinColumn,
    reorderPinnedColumns,
    reorderColumns,
    
    // Column sizing
    autosizeColumn,
    autosizeAllColumns,
    setColumnWidth,
    calculateColumnMetrics,
    distributeColumnsEvenly,
    adjustColumnWidths,
    
    // Column visibility
    toggleColumnVisibility,
    showColumn,
    hideColumn,
    
    // Column management
    resetColumns,
    
    // Computed
    getTotalWidth,
    getColumnsByPosition,
    
    // Constants
    MIN_COLUMN_WIDTH,
    MAX_COLUMN_WIDTH,
    DEFAULT_COLUMN_WIDTH
  }
} 