import { ref } from 'vue'
import type { TableProps, TableEmits, TableQuery, FilterItem, TableSelection } from '@/types'

export function useTableActions(props: TableProps, emit: any) {
  const isPending = ref(false)

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    emit('sort', field, direction)
  }

  const handleFilter = (filters: FilterItem[]) => {
    emit('filter', filters)
  }

  const handlePageChange = (page: number) => {
    const newQuery = { ...props.query }
    newQuery.offset = (page - 1) * newQuery.limit
    emit('update:query', newQuery)
  }

  const handlePageSizeChange = (size: number) => {
    const newQuery = { ...props.query }
    newQuery.limit = size
    newQuery.offset = 0 // Reset to first page
    emit('update:query', newQuery)
  }

  const handleColumnReorder = (columns: any[]) => {
    emit('column-reorder', columns)
  }

  const handleRowClick = (row: any, index: number, event?: MouseEvent) => {
    emit('row-click', row, index, event)
  }

  const handleRowDoubleClick = (row: any, index: number, event?: MouseEvent) => {
    emit('row-dblclick', row, index, event)
  }

  const handleCellClick = (row: any, column: any, value: any, event?: MouseEvent) => {
    emit('cell-click', row, column, value, event)
  }

  const handleSelectionChange = (selection: TableSelection) => {
    emit('selection-change', selection)
    emit('update:selection', selection)
  }

  const handleRefresh = () => {
    if (props.dataSource?.read) {
      loadData()
    } else {
      emit('datasource-refresh')
    }
  }

  const loadData = async () => {
    if (!props.dataSource?.read) return

    isPending.value = true
    emit('data-loading')

    try {
      const response = await props.dataSource.read({
        params: {
          pq_filter: JSON.stringify(props.query.filters),
          pq_sort: JSON.stringify(props.query.sort),
          pq_curPage: Math.ceil(props.query.offset / props.query.limit) + 1,
          pq_rPP: props.query.limit
        }
      })

      const normalizedResult = props.dataSource.normalizeResponseCallback 
        ? props.dataSource.normalizeResponseCallback(response)
        : response

      emit('update:data', normalizedResult.rows)
      emit('update:total', normalizedResult.total)
    } catch (error) {
      console.error('Error loading data:', error)
      emit('data-error', error)
    } finally {
      isPending.value = false
      emit('data-loaded')
    }
  }

  return {
    isPending,
    handleSort,
    handleFilter,
    handlePageChange,
    handlePageSizeChange,
    handleColumnReorder,
    handleRowClick,
    handleRowDoubleClick,
    handleCellClick,
    handleSelectionChange,
    handleRefresh,
    loadData
  }
} 