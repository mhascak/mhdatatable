import { computed, type Ref } from 'vue'
import type { TableColumn, ComplexHeader } from '@/types'

/**
 * Composable for handling complex multi-level column headers
 */
export function useComplexHeaders(columns: Ref<TableColumn[]>) {
  
  // Build complex header structure
  const headerStructure = computed(() => {
    if (!hasComplexHeaders.value) {
      return {
        levels: 1,
        headers: [columns.value.map(col => ({
          field: col.field,
          title: col.title,
          colspan: 1,
          rowspan: 1,
          level: 0,
          style: col.thStyle,
          class: col.thClass,
          column: col
        }))]
      }
    }
    
    return buildHeaderStructure(columns.value)
  })
  
  // Check if columns have complex headers
  const hasComplexHeaders = computed(() => {
    return columns.value.some(col => col.children && col.children.length > 0)
  })
  
  // Get maximum header depth
  const maxHeaderDepth = computed(() => {
    if (!hasComplexHeaders.value) return 1
    
    const getDepth = (cols: TableColumn[], depth = 1): number => {
      let maxDepth = depth
      cols.forEach(col => {
        if (col.children && col.children.length > 0) {
          maxDepth = Math.max(maxDepth, getDepth(col.children, depth + 1))
        }
      })
      return maxDepth
    }
    
    return getDepth(columns.value)
  })
  
  // Get all leaf columns (columns without children)
  const leafColumns = computed(() => {
    const getLeafColumns = (cols: TableColumn[]): TableColumn[] => {
      const leaves: TableColumn[] = []
      cols.forEach(col => {
        if (col.children && col.children.length > 0) {
          leaves.push(...getLeafColumns(col.children))
        } else {
          leaves.push(col)
        }
      })
      return leaves
    }
    
    return getLeafColumns(columns.value)
  })
  
  /**
   * Build the complete header structure with levels
   */
  function buildHeaderStructure(cols: TableColumn[]) {
    const levels: ComplexHeader[][] = []
    const maxDepth = maxHeaderDepth.value
    
    // Initialize levels
    for (let i = 0; i < maxDepth; i++) {
      levels[i] = []
    }
    
    // Build headers recursively
    const buildLevel = (columns: TableColumn[], level: number, parentPath = '') => {
      columns.forEach(col => {
        const currentPath = parentPath ? `${parentPath}.${col.field}` : col.field
        
                 if (col.children && col.children.length > 0) {
           // Parent header
           const colspan = getColumnSpan(col.children)
           const header: ComplexHeader = {
             field: col.field,
             title: col.title,
             colspan,
             rowspan: 1,
             level,
             style: col.thStyle,
             class: col.thClass
           }
          
          levels[level].push(header)
          
          // Build children
          buildLevel(col.children, level + 1, currentPath)
        } else {
          // Leaf header
          const rowspan = maxDepth - level
          const header: ComplexHeader = {
            field: col.field,
            title: col.title,
            colspan: 1,
            rowspan,
            level,
            style: col.thStyle,
            class: col.thClass
          }
          
          levels[level].push(header)
        }
      })
    }
    
    buildLevel(cols, 0)
    
    return {
      levels: maxDepth,
      headers: levels
    }
  }
  
  /**
   * Calculate column span for a parent column
   */
  function getColumnSpan(children: TableColumn[]): number {
    let span = 0
    children.forEach(child => {
      if (child.children && child.children.length > 0) {
        span += getColumnSpan(child.children)
      } else {
        span += 1
      }
    })
    return span
  }
  
  /**
   * Get column by field path
   */
  function getColumnByPath(path: string): TableColumn | undefined {
    const findColumn = (cols: TableColumn[], targetPath: string): TableColumn | undefined => {
      for (const col of cols) {
        if (col.field === targetPath) {
          return col
        }
        if (col.children) {
          const found = findColumn(col.children, targetPath)
          if (found) return found
        }
      }
      return undefined
    }
    
    return findColumn(columns.value, path)
  }
  
  /**
   * Get all parent columns for a given column
   */
  function getColumnParents(field: string): TableColumn[] {
    const parents: TableColumn[] = []
    
    const findParents = (cols: TableColumn[], targetField: string, currentParents: TableColumn[] = []): boolean => {
      for (const col of cols) {
        if (col.field === targetField) {
          parents.push(...currentParents)
          return true
        }
        
        if (col.children) {
          const newParents = [...currentParents, col]
          if (findParents(col.children, targetField, newParents)) {
            return true
          }
        }
      }
      return false
    }
    
    findParents(columns.value, field)
    return parents
  }
  
  /**
   * Check if a column is visible (including parent visibility)
   */
  function isColumnVisible(field: string): boolean {
    const column = getColumnByPath(field)
    if (!column) return false
    
    // Check column visibility
    if (column.visible === false) return false
    
    // Check parent visibility
    const parents = getColumnParents(field)
    return parents.every(parent => parent.visible !== false)
  }
  
  /**
   * Get column level in hierarchy
   */
  function getColumnLevel(field: string): number {
    return getColumnParents(field).length
  }
  
  /**
   * Flatten columns for data access
   */
  function flattenColumns(): TableColumn[] {
    const flattened: TableColumn[] = []
    
    const flatten = (cols: TableColumn[]) => {
      cols.forEach(col => {
        if (col.children && col.children.length > 0) {
          flatten(col.children)
        } else {
          flattened.push(col)
        }
      })
    }
    
    flatten(columns.value)
    return flattened
  }
  
  /**
   * Update column visibility with cascade
   */
  function updateColumnVisibility(field: string, visible: boolean): void {
    const column = getColumnByPath(field)
    if (!column) return
    
    column.visible = visible
    
    // If hiding a parent, hide all children
    if (!visible && column.children) {
      const hideChildren = (children: TableColumn[]) => {
        children.forEach(child => {
          child.visible = false
          if (child.children) {
            hideChildren(child.children)
          }
        })
      }
      hideChildren(column.children)
    }
    
    // If showing a child, ensure parents are visible
    if (visible) {
      const parents = getColumnParents(field)
      parents.forEach(parent => {
        parent.visible = true
      })
    }
  }
  
  return {
    headerStructure,
    hasComplexHeaders,
    maxHeaderDepth,
    leafColumns,
    getColumnByPath,
    getColumnParents,
    isColumnVisible,
    getColumnLevel,
    flattenColumns,
    updateColumnVisibility
  }
} 