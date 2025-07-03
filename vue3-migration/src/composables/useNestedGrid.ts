import { ref, computed, nextTick, type Ref } from 'vue'
import type { NestedGridConfig, TableRow } from '@/types'

/**
 * Composable for handling nested grid functionality
 */
export function useNestedGrid(
  data: Ref<any[]>,
  config: Ref<NestedGridConfig | undefined>
) {
  const expandedRows = ref<string[]>([])
  const nestedCache = ref<Map<string, any>>(new Map())
  const loadingRows = ref<Set<string>>(new Set())
  
  // Enhanced data processing with nested support
  const processedData = computed(() => {
    console.log('processedData recomputed, expandedRows:', expandedRows.value)
    if (!config.value?.enabled) {
      return data.value
    }
    
    console.log('processedData computed - expandedRows:', expandedRows.value)
    
    return data.value.map((row, index) => {
      const rowKey = getRowKey(row, index)
      const nestedData = getNestedData(row, index)
      const isExpanded = expandedRows.value.includes(rowKey)
      
      // Debug log for first few rows
      if (index < 2) {
        console.log(`Row ${index} (${row.name}): rowKey=${rowKey}, isExpanded=${isExpanded}, hasChildren=${!!row.children}`)
      }
      
      const processedRow = {
        ...row,
        _hasNested: hasNestedContent(row),
        _nestedExpanded: isExpanded,
        _nestedLoading: loadingRows.value.has(rowKey),
        _nestedConfig: config.value,
        __nested__: {
          comp: config.value?.component,
          visible: isExpanded,
          data: nestedData,
          $toggle: (comp?: any, visible?: boolean) => {
            // Robust toggle: always toggle if arguments are missing or undefined
            const args = Array.from(arguments)
            console.log('$toggle called for rowKey:', rowKey, 'args:', args)
            if (args.length === 0 || (args.length === 2 && typeof comp === 'undefined' && typeof visible === 'undefined')) {
              console.log('Toggling (no args or all undefined)')
              toggleNestedRow(rowKey)
            } else if (args.length === 1 && typeof comp === 'boolean') {
              console.log('Toggling (boolean arg)', comp)
              toggleNestedRow(rowKey, comp)
            } else if (args.length === 2 && typeof visible === 'boolean') {
              console.log('Toggling (visible arg)', visible)
              toggleNestedRow(rowKey, comp, visible)
            } else {
              console.log('Toggling (fallback)', args)
              toggleNestedRow(rowKey)
            }
          }
        }
      }
      

      
      return processedRow
    })
  })
  
  // Get flattened data including nested rows
  const flattenedData = computed(() => {
    if (!config.value?.enabled) {
      return processedData.value
    }
    
    const result: any[] = []
    
    processedData.value.forEach((row, index) => {
      result.push(row)
      
      // Add nested row if expanded
      if (row._nestedExpanded && row._hasNested) {
        const nestedData = getNestedData(row, index)
        if (nestedData) {
          result.push({
            _isNestedRow: true,
            _parentRow: row,
            _nestedData: nestedData,
            _nestedComponent: config.value?.component,
            _nestedProps: {
              ...config.value?.props,
              row,
              data: nestedData
            }
          })
        }
      }
    })
    
    return result
  })
  
  // Statistics
  const nestedStats = computed(() => ({
    totalRows: processedData.value.length,
    expandedCount: expandedRows.value.length,
    cachedCount: nestedCache.value.size,
    loadingCount: loadingRows.value.size
  }))
  
  /**
   * Check if row has nested content
   */
  function hasNestedContent(row: any): boolean {
    if (!config.value) return false
    
    // Check for children property
    if (config.value.mode === 'accordion' && row.children) {
      return Array.isArray(row.children) && row.children.length > 0
    }
    
    // Check for nested component
    if (config.value.component) {
      return true
    }
    
    return false
  }
  
  /**
   * Get unique row key
   */
  function getRowKey(row: any, index: number): string {
    const key = row.id || row._id || `row-${index}`
    console.log('getRowKey:', key, 'for row:', row.name)
    return key
  }
  
  /**
   * Toggle nested row expansion
   */
  async function toggleNestedRow(
    rowKey: string, 
    comp?: any, 
    visible?: boolean
  ): Promise<void> {
    console.log('=== toggleNestedRow called ===')
    console.log('rowKey:', rowKey)
    console.log('arguments.length:', arguments.length)
    console.log('expandedRows before:', expandedRows.value)
    
    const idx = expandedRows.value.indexOf(rowKey)
    
    if (arguments.length === 0) {
      // Toggle current state
      if (idx !== -1) {
        expandedRows.value.splice(idx, 1)
        console.log('Removed from expandedRows (no args)')
      } else {
        expandedRows.value.push(rowKey)
        console.log('Added to expandedRows (no args)')
      }
    } else if (arguments.length === 1) {
      if (typeof comp === 'boolean') {
        // Set visibility
        if (comp) {
          if (idx === -1) expandedRows.value.push(rowKey)
          console.log('Added to expandedRows (boolean true)')
        } else {
          if (idx !== -1) expandedRows.value.splice(idx, 1)
          console.log('Removed from expandedRows (boolean false)')
        }
      } else {
        // Toggle with component
        if (idx !== -1) {
          expandedRows.value.splice(idx, 1)
          console.log('Removed from expandedRows (toggle)')
        } else {
          expandedRows.value.push(rowKey)
          console.log('Added to expandedRows (toggle)')
        }
      }
    } else {
      // Set component and visibility
      if (visible) {
        if (idx === -1) expandedRows.value.push(rowKey)
        console.log('Added to expandedRows (visible true)')
      } else {
        if (idx !== -1) expandedRows.value.splice(idx, 1)
        console.log('Removed from expandedRows (visible false)')
      }
    }
    
    console.log('expandedRows after:', expandedRows.value)
    console.log('=== End toggleNestedRow ===')
    
    // Load nested data if needed
    if (expandedRows.value.includes(rowKey) && config.value?.lazy) {
      await loadNestedData(rowKey)
    }
  }
  
  /**
   * Load nested data for a row
   */
  async function loadNestedData(rowKey: string): Promise<void> {
    if (!config.value?.lazy || nestedCache.value.has(rowKey)) {
      return
    }
    
    loadingRows.value.add(rowKey)
    
    try {
      // Simulate async loading - replace with actual data loading logic
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const row = processedData.value.find((r, i) => getRowKey(r, i) === rowKey)
      if (row) {
        const nestedData = await fetchNestedData(row)
        if (config.value?.cache) {
          nestedCache.value.set(rowKey, nestedData)
        }
      }
    } finally {
      loadingRows.value.delete(rowKey)
    }
  }
  
  /**
   * Get nested data for a row
   */
  function getNestedData(row: any, index: number): any {
    const rowKey = getRowKey(row, index)
    
    // Check cache first
    if (config.value?.cache && nestedCache.value.has(rowKey)) {
      return nestedCache.value.get(rowKey)
    }
    
    // Return children if available
    if (row.children) {
      return row.children
    }
    
    // Return empty array if no children
    return []
  }
  
  /**
   * Fetch nested data (override this method for custom loading)
   */
  async function fetchNestedData(row: any): Promise<any> {
    // Default implementation - return children or empty array
    return row.children || []
  }
  
  /**
   * Expand all nested rows
   */
  function expandAllNested(): void {
    processedData.value.forEach((row, index) => {
      if (row._hasNested) {
        expandedRows.value.push(getRowKey(row, index))
      }
    })
  }
  
  /**
   * Collapse all nested rows
   */
  function collapseAllNested(): void {
    expandedRows.value.splice(0, expandedRows.value.length)
  }
  
  /**
   * Check if row is expanded
   */
  function isRowExpanded(rowKey: string): boolean {
    return expandedRows.value.includes(rowKey)
  }
  
  /**
   * Get nested component for row
   */
  function getNestedComponent(row: any): string | any {
    if (row.__nested__?.comp) {
      return row.__nested__.comp
    }
    return config.value?.component || 'div'
  }
  
  /**
   * Clear nested cache
   */
  function clearNestedCache(): void {
    nestedCache.value.clear()
  }
  
  /**
   * Get nested props for row
   */
  function getNestedProps(row: any, index: number): Record<string, any> {
    return {
      ...config.value?.props,
      row,
      nested: row.__nested__,
      data: getNestedData(row, index),
      index
    }
  }
  
  /**
   * Handle accordion mode (only one expanded at a time)
   */
  function handleAccordionMode(rowKey: string): void {
    if (config.value?.mode === 'accordion') {
      // Close all other expanded rows
      const otherKeys = Array.from(expandedRows.value).filter(key => key !== rowKey)
      otherKeys.forEach(key => expandedRows.value.splice(expandedRows.value.indexOf(key), 1))
    }
  }
  
  return {
    processedData,
    flattenedData,
    nestedStats,
    expandedRows: computed(() => Array.from(expandedRows.value)),
    toggleNestedRow,
    loadNestedData,
    expandAllNested,
    collapseAllNested,
    isRowExpanded,
    getNestedComponent,
    getNestedProps,
    clearNestedCache,
    hasNestedContent,
    getRowKey
  }
} 