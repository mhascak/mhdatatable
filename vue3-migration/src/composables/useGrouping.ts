import { ref, computed, watch, type Ref } from 'vue'
import type { GroupConfig, GroupedRow, TableRow, TableQuery } from '@/types'

/**
 * Composable for handling data grouping functionality
 */
export function useGrouping(
  data: Ref<any[]>,
  groupConfig: Ref<GroupConfig | undefined>,
  query: Ref<TableQuery>
) {
  const expandedGroups = ref<Set<string>>(new Set())
  
  // Process data into grouped structure
  const groupedData = computed(() => {
    if (!groupConfig.value || !groupConfig.value.field) {
      return data.value
    }
    
    return createGroupedData(data.value, groupConfig.value)
  })
  
  // Flatten grouped data for display
  const flattenedData = computed(() => {
    if (!groupConfig.value) {
      return data.value
    }
    
    return flattenGroupedData(groupedData.value)
  })
  
  // Group statistics
  const groupStats = computed(() => {
    if (!groupConfig.value) return {}
    
    const stats: Record<string, any> = {}
    groupedData.value.forEach((group: GroupedRow) => {
      if (group.isGroup) {
        stats[group.groupKey] = {
          count: group.children.length,
          aggregations: calculateAggregations(group.children, groupConfig.value!)
        }
      }
    })
    
    return stats
  })
  
  // Watch for query changes to update expanded groups
  watch(
    () => query.value.expandedGroups,
    (newExpanded) => {
      if (newExpanded) {
        expandedGroups.value = new Set(newExpanded)
      }
    },
    { immediate: true }
  )
  
  /**
   * Create grouped data structure
   */
  function createGroupedData(rawData: any[], config: GroupConfig): GroupedRow[] {
    const groups: Record<string, any[]> = {}
    
    // Group data by field
    rawData.forEach(row => {
      const groupValue = getNestedValue(row, config.field)
      const groupKey = String(groupValue || 'null')
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(row)
    })
    
    // Convert to GroupedRow structure
    const result: GroupedRow[] = []
    
    Object.entries(groups).forEach(([groupKey, children]) => {
      const groupValue = children[0] ? getNestedValue(children[0], config.field) : groupKey
      // Check if group should be expanded
      let isExpanded = false
      if (expandedGroups.value.size > 0) {
        // If we have explicit expanded groups, use that
        isExpanded = expandedGroups.value.has(groupKey)
      } else {
        // If no explicit expanded groups, use default
        isExpanded = config.defaultExpanded ?? true
      }
      
      // Add group header
      const groupRow: GroupedRow = {
        isGroup: true,
        groupKey,
        groupValue,
        groupTitle: config.title ? `${config.title}: ${groupValue}` : String(groupValue),
        children: children.map(child => ({
          ...child,
          _isGroup: false,
          _groupKey: groupKey,
          _groupValue: groupValue,
          _groupLevel: 1
        })),
        expanded: isExpanded,
        level: 0,
        aggregations: calculateAggregations(children, config),
        _originalData: children
      }
      
      result.push(groupRow)
    })
    
    // Sort groups if configured
    if (config.sortable) {
      result.sort((a, b) => {
        if (a.groupValue < b.groupValue) return -1
        if (a.groupValue > b.groupValue) return 1
        return 0
      })
    }
    
    return result
  }
  
  /**
   * Flatten grouped data for table display
   */
  function flattenGroupedData(grouped: GroupedRow[]): any[] {
    const result: any[] = []
    
    grouped.forEach(group => {
      // Add group header row with safe default values for template properties
      result.push({
        ...group,
        _isGroup: true,
        _groupKey: group.groupKey,
        _groupLevel: group.level,
        _hasChildren: group.children.length > 0,
        _childrenVisible: group.expanded,
        // Add safe defaults for common template properties
        id: `group-${group.groupKey}`,
        name: group.groupTitle,
        title: '',
        email: '',
        department: group.groupValue,
        location: '',
        salary: 0,
        status: '',
        avatar: '',
        _isGroupHeader: true
      })
      
      // Add children if expanded
      if (group.expanded && group.children.length > 0) {
        result.push(...group.children.map(child => ({
          ...child,
          _isGroup: false,
          _groupKey: group.groupKey,
          _groupLevel: group.level + 1,
          _isHide: false
        })))
      }
    })
    
    return result
  }
  
  /**
   * Calculate aggregations for a group
   */
  function calculateAggregations(data: any[], config: GroupConfig): Record<string, any> {
    if (!config.aggregation) return {}
    
    const result: Record<string, any> = {}
    
    config.aggregation.fields.forEach(field => {
      const values = data
        .map(row => getNestedValue(row, field))
        .filter(val => val != null && !isNaN(Number(val)))
        .map(Number)
      
      config.aggregation!.functions.forEach(func => {
        const key = `${field}_${func}`
        
        switch (func) {
          case 'sum':
            result[key] = values.reduce((sum, val) => sum + val, 0)
            break
          case 'avg':
            result[key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
            break
          case 'count':
            result[key] = values.length
            break
          case 'min':
            result[key] = values.length > 0 ? Math.min(...values) : 0
            break
          case 'max':
            result[key] = values.length > 0 ? Math.max(...values) : 0
            break
        }
      })
    })
    
    return result
  }
  
  /**
   * Get nested object value by path
   */
  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  /**
   * Toggle group expansion
   */
  function toggleGroup(groupKey: string): void {
    if (expandedGroups.value.has(groupKey)) {
      expandedGroups.value.delete(groupKey)
    } else {
      expandedGroups.value.add(groupKey)
    }
    
    // Update query to persist state
    query.value.expandedGroups = Array.from(expandedGroups.value)
  }
  
  /**
   * Expand all groups
   */
  function expandAllGroups(): void {
    groupedData.value.forEach(group => {
      if (group.isGroup) {
        expandedGroups.value.add(group.groupKey)
      }
    })
    query.value.expandedGroups = Array.from(expandedGroups.value)
  }
  
  /**
   * Collapse all groups
   */
  function collapseAllGroups(): void {
    expandedGroups.value.clear()
    query.value.expandedGroups = []
  }
  
  /**
   * Check if group is expanded
   */
  function isGroupExpanded(groupKey: string): boolean {
    return expandedGroups.value.has(groupKey)
  }
  
  return {
    groupedData,
    flattenedData,
    groupStats,
    expandedGroups: computed(() => Array.from(expandedGroups.value)),
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    isGroupExpanded
  }
} 