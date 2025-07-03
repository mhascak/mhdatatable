import { App } from 'vue'
import DataTable from './components/DataTable.vue'
import { createPinia } from 'pinia'

// Export components
export { default as DataTable } from './components/DataTable.vue'

// Export types
export type {
  TableColumn,
  TableQuery,
  TableRow,
  TableProps,
  TableEmits,
  SortItem,
  FilterItem,
  DataSource,
  TablePagination,
  TableSelection,
  TableSettings,
  VirtualScrollOptions,
  DragDropOptions
} from './types'

// Export composables
export { useTableState } from './composables/useTableState'
export { useTableActions } from './composables/useTableActions'
export { useLocalStorage } from './composables/useLocalStorage'

// Export store
export { useTableStore } from './stores/tableStore'

// Plugin installation
export default {
  install: (app: App, options?: { locale?: Record<string, string> }) => {
    const pinia = createPinia()
    app.use(pinia)
    
    // Register global component
    app.component('DataTable', DataTable)
    
    // Add i18n support
    if (options?.locale) {
      app.config.globalProperties.$t = (key: string) => {
        return options.locale![key] || key
      }
    } else {
      app.config.globalProperties.$t = (key: string) => key
    }
  }
}

// Auto-install if used in browser
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(DataTable)
} 