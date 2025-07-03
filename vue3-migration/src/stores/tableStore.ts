import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { 
  TableColumn, 
  TableQuery, 
  TablePagination, 
  TableSelection, 
  TableRow,
  DataSource,
  FilterItem
} from '@/types'

export const useTableStore = defineStore('table', () => {
  // State
  const columns = ref<TableColumn[]>([])
  const data = ref<TableRow[]>([])
  const query = ref<TableQuery>({
    limit: 20,
    offset: 0,
    sort: [],
    filters: []
  })
  const pagination = ref<TablePagination>({
    total: 0,
    currentPage: 1,
    pageSize: 20,
    pageSizeOptions: [10, 20, 40, 50, 80, 100]
  })
  const selection = ref<TableSelection>({
    selectedRows: [],
    selectedKeys: []
  })
  const loading = ref(false)
  const dataSource = ref<DataSource | null>(null)
  const supportBackup = ref(false)
  const gridName = ref('')
  const supportNested = ref<boolean | 'accordion'>(false)

  // Computed
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
    Math.ceil(pagination.value.total / query.value.limit)
  )

  // Actions
  const updateColumns = (newColumns: TableColumn[]) => {
    columns.value = newColumns
  }

  const updateData = (newData: TableRow[]) => {
    data.value = newData
  }

  const updateQuery = (newQuery: Partial<TableQuery>) => {
    query.value = { ...query.value, ...newQuery }
  }

  const updatePagination = (newPagination: Partial<TablePagination>) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setDataSource = (source: DataSource) => {
    dataSource.value = source
  }

  const setSelection = (newSelection: TableSelection) => {
    selection.value = newSelection
  }

  const toggleRowSelection = (row: TableRow, checked: boolean) => {
    const key = row.id || row._normalIndex
    if (checked) {
      if (!selection.value.selectedKeys.includes(key)) {
        selection.value.selectedKeys.push(key)
        selection.value.selectedRows.push(row)
      }
    } else {
      const index = selection.value.selectedKeys.indexOf(key)
      if (index > -1) {
        selection.value.selectedKeys.splice(index, 1)
        selection.value.selectedRows.splice(index, 1)
      }
    }
  }

  const selectAll = (checked: boolean) => {
    if (checked) {
      selection.value.selectedKeys = data.value.map(row => row.id || row._normalIndex)
      selection.value.selectedRows = [...data.value]
    } else {
      selection.value.selectedKeys = []
      selection.value.selectedRows = []
    }
  }

  const sort = (field: string, direction: 'asc' | 'desc') => {
    const existingSortIndex = query.value.sort.findIndex(s => s.field === field)
    if (existingSortIndex > -1) {
      query.value.sort[existingSortIndex].direction = direction
    } else {
      query.value.sort.push({ field, direction })
    }
  }

  const addFilter = (field: string, value: any, operator: FilterItem['operator'] = 'eq') => {
    const existingFilterIndex = query.value.filters.findIndex(f => f.field === field)
    if (existingFilterIndex > -1) {
      query.value.filters[existingFilterIndex] = { field, value, operator }
    } else {
      query.value.filters.push({ field, value, operator })
    }
  }

  const removeFilter = (field: string) => {
    query.value.filters = query.value.filters.filter(f => f.field !== field)
  }

  const clearFilters = () => {
    query.value.filters = []
  }

  const goToPage = (page: number) => {
    query.value.offset = (page - 1) * query.value.limit
  }

  const setPageSize = (size: number) => {
    query.value.limit = size
    query.value.offset = 0 // Reset to first page
  }

  const loadData = async () => {
    if (!dataSource.value?.read) return

    setLoading(true)
    try {
      const response = await dataSource.value.read({
        params: {
          pq_filter: JSON.stringify(query.value.filters),
          pq_sort: JSON.stringify(query.value.sort),
          pq_curPage: currentPage.value,
          pq_rPP: query.value.limit
        }
      })

      const normalizedResult = dataSource.value.normalizeResponseCallback 
        ? dataSource.value.normalizeResponseCallback(response)
        : response

      updateData(normalizedResult.rows)
      updatePagination({ total: normalizedResult.total })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Watchers
  watch(query, () => {
    if (dataSource.value?.read) {
      loadData()
    }
  }, { deep: true })

  return {
    // State
    columns,
    data,
    query,
    pagination,
    selection,
    loading,
    dataSource,
    supportBackup,
    gridName,
    supportNested,

    // Computed
    visibleColumns,
    leftFixedColumns,
    rightFixedColumns,
    normalColumns,
    currentPage,
    totalPages,

    // Actions
    updateColumns,
    updateData,
    updateQuery,
    updatePagination,
    setLoading,
    setDataSource,
    setSelection,
    toggleRowSelection,
    selectAll,
    sort,
    addFilter,
    removeFilter,
    clearFilters,
    goToPage,
    setPageSize,
    loadData
  }
}) 