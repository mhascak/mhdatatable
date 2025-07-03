import { ref, computed, watch, nextTick } from 'vue'
import type { 
  TableColumn, 
  TableQuery, 
  TableRow, 
  DataSource,
  TableProps 
} from '@/types'

export function useTableState(props: TableProps) {
  // Reactive state
  const columns = ref<TableColumn[]>([])
  const data = ref<TableRow[]>([])
  const query = ref<TableQuery>({
    limit: 20,
    offset: 0,
    sort: [],
    filters: []
  })
  const loading = ref(false)
  const total = ref(0)

  // Initialize state from props
  const initializeState = () => {
    if (props.columns) {
      columns.value = props.columns.map((col, index) => ({
        ...col,
        index,
        visible: col.visible !== false,
        colStyle: {
          width: typeof col.colStyle?.width === 'string' && col.colStyle.width !== 'auto' ? col.colStyle.width : (col.width ? String(col.width) : '120px'),
          ...col.colStyle
        }
      }))
    }

    if (props.data) {
      data.value = processData(props.data)
    }

    if (props.query) {
      query.value = { ...query.value, ...props.query }
    }

    if (props.total !== undefined) {
      total.value = props.total
    }

    if (props.loading !== undefined) {
      loading.value = props.loading
    }
  }

  // Process data to add internal properties
  const processData = (rawData: any[]): TableRow[] => {
    return rawData.map((row, index) => ({
      ...row,
      _isHover: false,
      _isExpanded: row._isExpanded ?? false,
      _isChecked: row._isChecked ?? false,
      _level: row._level ?? 1,
      _isHide: false,
      _isFold: false,
      _childrenLen: row.children?.length ?? 0,
      _normalIndex: index + 1,
      _rowDetailHeight: 0,
      __nested__: props.supportNested ? {
        comp: undefined,
        visible: false,
        $toggle(comp?: any, visible?: boolean) {
          if (arguments.length === 0) {
            this.visible = !this.visible
          } else if (arguments.length === 1) {
            if (typeof comp === 'boolean') {
              this.visible = comp
            } else {
              this.comp = comp
              this.visible = !this.visible
            }
          } else {
            this.comp = comp
            this.visible = visible!
          }
        }
      } : undefined
    }))
  }

  // Computed properties
  const visibleColumns = computed(() => 
    columns.value.filter(col => col.visible !== false)
  )

  const leftFixedColumns = computed(() => 
    visibleColumns.value.filter(col => col.fixed === 'left' || col.fixed === true)
  )

  const rightFixedColumns = computed(() => 
    visibleColumns.value.filter(col => col.fixed === 'right')
  )

  const normalColumns = computed(() => 
    visibleColumns.value.filter(col => !col.fixed)
  )

  const currentPage = computed(() => 
    Math.floor(query.value.offset / query.value.limit) + 1
  )

  const totalPages = computed(() => 
    Math.ceil(total.value / query.value.limit)
  )

  // Watchers
  watch(() => props.columns, (newColumns) => {
    if (newColumns) {
      columns.value = newColumns.map((col, index) => ({
        ...col,
        index,
        visible: col.visible !== false,
        colStyle: {
          width: typeof col.colStyle?.width === 'string' && col.colStyle.width !== 'auto' ? col.colStyle.width : (col.width ? String(col.width) : '120px'),
          ...col.colStyle
        }
      }))
    }
  }, { deep: true, immediate: true })

  watch(() => props.data, (newData) => {
    if (newData) {
      data.value = processData(newData)
    }
  }, { deep: true, immediate: true })

  watch(() => props.query, (newQuery) => {
    if (newQuery) {
      query.value = { ...query.value, ...newQuery }
    }
  }, { deep: true, immediate: true })

  watch(() => props.total, (newTotal) => {
    if (newTotal !== undefined) {
      total.value = newTotal
    }
  }, { immediate: true })

  watch(() => props.loading, (newLoading) => {
    if (newLoading !== undefined) {
      loading.value = newLoading
    }
  }, { immediate: true })

  // Initialize on mount
  initializeState()

  return {
    // State
    columns,
    data,
    query,
    loading,
    total,

    // Computed
    visibleColumns,
    leftFixedColumns,
    rightFixedColumns,
    normalColumns,
    currentPage,
    totalPages,

    // Methods
    processData,
    initializeState
  }
} 