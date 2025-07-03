/**
 * @fileoverview Table Settings Composable
 * Handles grid settings persistence, backup/restore functionality
 */

import { computed, watch } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import type { TableProps, TableColumn, TableQuery } from '@/types'

export function useTableSettings(
  props: TableProps, 
  state: { columns: any, query: any }
) {
  const { saveToLS, getFromLS } = useLocalStorage()

  // Generate storage key based on grid name and columns hash
  const storageKey = computed(() => {
    if (!props.supportBackup || !props.gridName) return ''
    const columnsHash = JSON.stringify(props.columns.map(c => c.field)).slice(0, 20)
    return `datatable-${props.gridName}-${columnsHash}`
  })

  /**
   * Save current grid settings to localStorage
   */
  const saveGridSettings = () => {
    if (!storageKey.value) return
    
    const settings = {
      query: state.query.value,
      columns: state.columns.value.map((col: TableColumn) => ({
        field: col.field,
        width: col.colStyle?.width,
        visible: col.visible,
        fixed: col.fixed,
        index: col.index
      })),
      timestamp: Date.now()
    }
    
    saveToLS(storageKey.value, settings)
  }

  /**
   * Load grid settings from localStorage
   */
  const loadGridSettings = () => {
    if (!storageKey.value) return

    const backup = getFromLS(storageKey.value)
    if (!backup) return

    // Restore query state
    if (backup.query) {
      Object.assign(state.query.value, backup.query)
    }

    // Restore column state
    if (backup.columns && Array.isArray(backup.columns)) {
      const backupColumns = backup.columns
      
      state.columns.value = state.columns.value.map((col: TableColumn) => {
        const backupCol = backupColumns.find((bc: any) => bc.field === col.field)
        if (backupCol) {
          return {
            ...col,
            visible: backupCol.visible,
            fixed: backupCol.fixed,
            index: backupCol.index,
            colStyle: {
              ...col.colStyle,
              width: backupCol.width || col.colStyle?.width
            }
          }
        }
        return col
      })
    }
  }

  /**
   * Export grid settings as JSON string
   */
  const exportGridSettingsToJson = () => {
    const settings = {
      columns: state.columns.value,
      query: state.query.value,
      exportedAt: new Date().toISOString()
    }
    
    const jsonString = JSON.stringify(settings, null, 2)
    
    // Create and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.gridName || 'datatable'}-settings.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return jsonString
  }

  /**
   * Import grid settings from JSON string
   */
  const importGridSettingsFromJson = (jsonString: string) => {
    try {
      const settings = JSON.parse(jsonString)
      
      if (settings.columns) {
        state.columns.value = settings.columns
      }
      
      if (settings.query) {
        Object.assign(state.query.value, settings.query)
      }
      
      // Save to localStorage
      if (storageKey.value) {
        saveGridSettings()
      }
      
      return true
    } catch (error) {
      console.error('Failed to import grid settings:', error)
      return false
    }
  }

  /**
   * Reset grid settings to default
   */
  const resetGridSettings = () => {
    if (storageKey.value) {
      localStorage.removeItem(storageKey.value)
    }
    
    // Reset to original props
    state.columns.value = [...props.columns]
    state.query.value = {
      limit: 20,
      offset: 0,
      sort: [],
      filters: []
    }
  }

  // Auto-save on changes (debounced)
  let saveTimeout: NodeJS.Timeout
  const debouncedSave = () => {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveGridSettings, 1000)
  }

  if (props.supportBackup) {
    watch([state.columns, state.query], debouncedSave, { deep: true })
  }

  return {
    saveGridSettings,
    loadGridSettings,
    exportGridSettingsToJson,
    importGridSettingsFromJson,
    resetGridSettings,
    storageKey: storageKey.value
  }
} 