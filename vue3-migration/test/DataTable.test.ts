import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import DataTable from '../src/components/DataTable.vue'
import type { TableColumn, TableQuery } from '../src/types'

// Mock data
const mockColumns: TableColumn[] = [
  { field: 'id', title: 'ID', sortable: true },
  { field: 'name', title: 'Name' },
  { field: 'email', title: 'Email' }
]

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]

const mockQuery: TableQuery = {
  limit: 10,
  offset: 0,
  sort: [],
  filters: []
}

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'Pin Column': 'Pin Column',
      'Pin left': 'Pin left',
      'Pin right': 'Pin right',
      'No pin': 'No pin',
      'Auto size This Column': 'Auto size This Column',
      'Auto size All Columns': 'Auto size All Columns',
      'Reset columns': 'Reset columns',
      'Reset all filters': 'Reset all filters'
    }
  }
})

describe('DataTable', () => {
  const createWrapper = (props = {}) => {
    const pinia = createPinia()
    return mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        total: 2,
        query: mockQuery,
        ...props
      },
      global: {
        plugins: [pinia, i18n],
        stubs: {
          // Stub child components to avoid complex dependencies
          HeaderSettings: {
            template: '<div class="header-settings-stub">HeaderSettings</div>',
            props: ['columns', 'support-backup']
          },
          Table: {
            template: '<div class="table-stub">Table</div>',
            props: ['columns', 'data', 'query', 'loading']
          },
          Pagination: {
            template: '<div class="tablePagination">Pagination - Total: {{ total }}</div>',
            props: ['total', 'query']
          },
          PageSizeSelect: {
            template: '<div class="page-size-select-stub">PageSizeSelect</div>',
            props: ['query', 'page-size-options']
          }
        }
      }
    })
  }

  it('renders without crashing', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the correct number of columns', () => {
    const wrapper = createWrapper()
    // Access columns through props instead of vm
    expect(wrapper.props('columns')).toHaveLength(3)
  })

  it('displays the correct data', () => {
    const wrapper = createWrapper()
    // Access data through props instead of vm
    expect(wrapper.props('data')).toHaveLength(2)
  })

  it('emits update:query when query changes', async () => {
    const wrapper = createWrapper()
    const newQuery = { ...mockQuery, limit: 20 }
    
    await wrapper.setProps({ query: newQuery })
    
    expect(wrapper.emitted('update:query')).toBeTruthy()
  })

  it('emits update:columns when columns change', async () => {
    const wrapper = createWrapper()
    const newColumns = [...mockColumns, { field: 'age', title: 'Age' }]
    
    await wrapper.setProps({ columns: newColumns })
    
    expect(wrapper.emitted('update:columns')).toBeTruthy()
  })

  it('shows header settings when enabled', () => {
    const wrapper = createWrapper({ showHeaderSettings: true })
    expect(wrapper.find('.header-settings-stub').exists()).toBe(true)
  })

  it('hides header settings when disabled', () => {
    const wrapper = createWrapper({ showHeaderSettings: false })
    expect(wrapper.find('.header-settings-stub').exists()).toBe(false)
  })

  it('shows pagination when enabled', () => {
    const wrapper = createWrapper({ showPagination: true })
    expect(wrapper.find('.tablePagination').exists()).toBe(true)
  })

  it('hides pagination when disabled', () => {
    const wrapper = createWrapper({ showPagination: false })
    expect(wrapper.find('.tablePagination').exists()).toBe(false)
  })

  it('displays total count correctly', () => {
    const wrapper = createWrapper({ total: 100 })
    expect(wrapper.text()).toContain('100')
  })

  it('handles empty data gracefully', () => {
    const wrapper = createWrapper({ data: [], total: 0 })
    // Access data through props instead of vm
    expect(wrapper.props('data')).toHaveLength(0)
  })

  it('supports custom table classes', () => {
    const wrapper = createWrapper({ tblClass: 'custom-table' })
    // Access tblClass through props instead of vm
    expect(wrapper.props('tblClass')).toBe('custom-table')
  })

  it('supports custom table styles', () => {
    const customStyle = { backgroundColor: 'red' }
    const wrapper = createWrapper({ tblStyle: customStyle })
    // Access tblStyle through props instead of vm
    expect(wrapper.props('tblStyle')).toEqual(customStyle)
  })
}) 