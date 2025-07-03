import type { VNode, Component } from 'vue'

export interface TableColumn {
  field: string
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  fixed?: 'left' | 'right' | boolean
  visible?: boolean
  group?: string
  tdClass?: string | string[]
  tdStyle?: Record<string, any>
  thClass?: string | string[]
  thStyle?: Record<string, any>
  tdComp?: string | Component
  thComp?: string | Component
  options?: Record<string, any>
  isTreeColumn?: boolean
  isFilterApplied?: boolean
  index?: number
  colStyle?: {
    width?: string
    minWidth?: string
    maxWidth?: string
  }
  children?: TableColumn[]
  colspan?: number
  rowspan?: number
  level?: number
  parent?: string
  headerGroup?: string
  explain?: string
  label?: string
  resizable?: boolean
  draggable?: boolean
  minWidth?: number
  maxWidth?: number
}

export interface ComplexHeader {
  field: string
  title: string
  children?: ComplexHeader[]
  colspan?: number
  rowspan?: number
  level: number
  style?: Record<string, any>
  class?: string | string[]
}

export interface GroupConfig {
  field: string
  title?: string
  sortable?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
  aggregation?: {
    fields: string[]
    functions: ('sum' | 'avg' | 'count' | 'min' | 'max')[]
  }
  headerTemplate?: string | Component
  footerTemplate?: string | Component
}

export interface GroupedRow {
  isGroup: boolean
  groupKey: string
  groupValue: any
  groupTitle: string
  children: any[]
  expanded: boolean
  level: number
  aggregations?: Record<string, any>
  _originalData?: any
}

export interface NestedGridConfig {
  enabled: boolean
  mode?: 'inline' | 'modal' | 'accordion'
  component?: string | Component
  props?: Record<string, any>
  height?: number | string
  lazy?: boolean
  cache?: boolean
  trigger?: 'click' | 'dblclick' | 'button'
  position?: 'below' | 'right'
}

export interface SortItem {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterItem {
  field: string
  value: any
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith'
}

export interface TableQuery {
  limit: number
  offset: number
  sort: SortItem[]
  filters: FilterItem[]
  groupBy?: string[]
  expandedGroups?: string[]
}

export interface TablePagination {
  total: number
  currentPage: number
  pageSize: number
  pageSizeOptions: number[]
}

export interface TableSelection {
  selectedRows: any[]
  selectedKeys: (string | number)[]
}

export interface TableSettings {
  columns: TableColumn[]
  query: TableQuery
  pagination: TablePagination
  selection: TableSelection
}

export interface DataSource {
  read?: (params: any) => Promise<{ rows: any[], total: number }>
  create?: (data: any) => Promise<any>
  update?: (data: any) => Promise<any>
  delete?: (id: string | number) => Promise<any>
  headers?: Record<string, string>
  normalizeResponseCallback?: (response: any) => { rows: any[], total: number }
}

export interface TableHeightConfig {
  mode: 'auto' | 'fixed' | 'full' | 'min-max'
  value?: number | string
  minHeight?: number | string
  maxHeight?: number | string
  fullHeightOffset?: number | string
}

export interface TableProps {
  columns: TableColumn[]
  data: any[]
  total: number
  query: TableQuery
  loading?: boolean
  selectable?: boolean
  virtual?: boolean
  virtualized?: boolean
  virtualItemHeight?: number
  virtualContainerHeight?: number
  virtualBuffer?: number
  supportNested?: boolean | 'accordion'
  supportBackup?: boolean
  gridName?: string
  showSaveGridViewButton?: boolean
  showHeaderSettings?: boolean
  showPagination?: boolean
  pageSizeOptions?: number[]
  contextMenuOptions?: any[]
  tblClass?: string | string[] | Record<string, boolean>
  tblStyle?: string | Record<string, any>
  height?: TableHeightConfig | number | string
  fullHeight?: {
    enabled: boolean
    height?: number
  }
  treeColumnOptions?: Record<string, any>
  compReg?: Record<string, Component>
  dataSource?: DataSource
  xprops?: Record<string, any>
  compact?: boolean
  ariaLabel?: string
  grouping?: GroupConfig
  complexHeaders?: boolean
  nestedGrid?: NestedGridConfig
  expandableRows?: boolean
  treeMode?: boolean
  childrenField?: string
}

export interface TableEmits {
  (e: 'update:query', query: TableQuery): void
  (e: 'update:columns', columns: TableColumn[]): void
  (e: 'update:selection', selection: TableSelection): void
  (e: 'row-click', row: any, index: number): void
  (e: 'row-dblclick', row: any, index: number): void
  (e: 'cell-click', row: any, column: TableColumn, value: any): void
  (e: 'sort', field: string, direction: 'asc' | 'desc'): void
  (e: 'filter', filters: FilterItem[]): void
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
  (e: 'selection-change', selection: TableSelection): void
  (e: 'column-reorder', columns: TableColumn[]): void
  (e: 'data-loading'): void
  (e: 'data-loaded'): void
  (e: 'table-settings-exported', settings: string): void
  (e: 'reset-filters'): void
  (e: 'datasource-refresh'): void
  (e: 'group-expand', groupKey: string, expanded: boolean): void
  (e: 'group-collapse', groupKey: string): void
  (e: 'nested-toggle', row: any, visible: boolean): void
  (e: 'tree-node-expand', row: any, expanded: boolean): void
  (e: 'tree-node-collapse', row: any): void
}

export interface TableRow {
  [key: string]: any
  _isHover?: boolean
  _isExpanded?: boolean
  _isChecked?: boolean
  _level?: number
  _isHide?: boolean
  _isFold?: boolean
  _childrenLen?: number
  _normalIndex?: number
  _rowDetailHeight?: number
  _isGroup?: boolean
  _groupKey?: string
  _groupValue?: any
  _groupLevel?: number
  _hasChildren?: boolean
  _isParent?: boolean
  _childrenVisible?: boolean
  __nested__?: {
    comp?: string | Component
    visible: boolean
    $toggle: (comp?: string | Component | boolean, visible?: boolean) => void
  }
}

export interface VirtualScrollOptions {
  itemHeight: number
  overscan?: number
  containerHeight?: number
}

export interface DragDropOptions {
  enabled: boolean
  group?: string
  sort?: boolean
  filter?: boolean
  onStart?: (event: any) => void
  onEnd?: (event: any) => void
  onMove?: (event: any) => void
}

export type Column = TableColumn
export type Query = TableQuery

export interface XProps {
  eventbus: {
    emit: (event: string, ...args: any[]) => void
    on: (event: string, handler: (...args: any[]) => void) => void
    off: (event: string, handler: (...args: any[]) => void) => void
  }
  [key: string]: any
} 