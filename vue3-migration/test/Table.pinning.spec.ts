import { mount } from '@vue/test-utils'
import Table from '../src/components/Table/Table.vue'

const columns = [
  { field: 'id', title: 'ID', width: 80 },
  { field: 'name', title: 'Name', width: 120 },
  { field: 'email', title: 'Email', width: 180 },
  { field: 'department', title: 'Department', width: 120 },
  { field: 'salary', title: 'Salary', width: 100 },
  { field: 'hireDate', title: 'Hire Date', width: 120 },
  { field: 'status', title: 'Status', width: 100 }
]

const data = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Name ${i + 1}`,
  email: `user${i + 1}@test.com`,
  department: 'Engineering',
  salary: 50000 + i * 1000,
  hireDate: '2022-01-01',
  status: 'Active'
}))

describe('DataTable Pinning and Scrolling', () => {
  it('renders all columns and rows', () => {
    const wrapper = mount(Table, {
      props: { columns, data, total: data.length, query: { limit: 20, offset: 0, sort: [], filters: [] } }
    })
    expect(wrapper.findAll('th').length).toBe(columns.length)
    expect(wrapper.findAll('tbody tr').length).toBe(data.length)
  })

  it('allows multiple columns to be pinned left', async () => {
    const wrapper = mount(Table, {
      props: { columns, data, total: data.length, query: { limit: 20, offset: 0, sort: [], filters: [] } }
    })
    // Simulate pinning 'id' and 'name' columns left
    await wrapper.vm.$nextTick()
    wrapper.vm.columns[0].fixed = 'left'
    wrapper.vm.columns[1].fixed = 'left'
    await wrapper.vm.$nextTick()
    const leftFixed = wrapper.vm.leftFixedColumns
    expect(leftFixed.length).toBe(2)
    expect(leftFixed[0].field).toBe('id')
    expect(leftFixed[1].field).toBe('name')
  })

  it('allows multiple columns to be pinned right', async () => {
    const wrapper = mount(Table, {
      props: { columns, data, total: data.length, query: { limit: 20, offset: 0, sort: [], filters: [] } }
    })
    // Simulate pinning 'status' and 'hireDate' columns right
    await wrapper.vm.$nextTick()
    wrapper.vm.columns[5].fixed = 'right'
    wrapper.vm.columns[6].fixed = 'right'
    await wrapper.vm.$nextTick()
    const rightFixed = wrapper.vm.rightFixedColumns
    expect(rightFixed.length).toBe(2)
    expect(rightFixed[0].field).toBe('hireDate')
    expect(rightFixed[1].field).toBe('status')
  })

  it('main table scrolls horizontally when columns overflow', async () => {
    const wrapper = mount(Table, {
      props: { columns, data, total: data.length, query: { limit: 20, offset: 0, sort: [], filters: [] } }
    })
    await wrapper.vm.$nextTick()
    // Pin a column to activate complex mode
    wrapper.vm.columns[0].fixed = 'left'
    await wrapper.vm.$nextTick()
    const mainTable = wrapper.find('.mh-table-main-body')
    expect(mainTable.exists()).toBe(true)
    // Simulate overflow by setting a small container width
    const el = mainTable.element as HTMLElement | null
    expect(el).not.toBeNull()
    if (el) {
      el.style.width = '200px'
      await wrapper.vm.$nextTick()
      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
      // Should have horizontal scroll
      expect(el.scrollWidth).toBeGreaterThan(el.clientWidth)
    }
  })

  it('pinned columns remain visible and fixed', async () => {
    const wrapper = mount(Table, {
      props: { columns, data, total: data.length, query: { limit: 20, offset: 0, sort: [], filters: [] } }
    })
    // Pin 'id' left and 'status' right
    await wrapper.vm.$nextTick()
    wrapper.vm.columns[0].fixed = 'left'
    wrapper.vm.columns[6].fixed = 'right'
    await wrapper.vm.$nextTick()
    // Check left and right fixed columns
    const leftFixed = wrapper.vm.leftFixedColumns
    const rightFixed = wrapper.vm.rightFixedColumns
    expect(leftFixed.length).toBe(1)
    expect(rightFixed.length).toBe(1)
    // Check that the left/right fixed tables exist
    expect(wrapper.find('.mh-table-fixed-left').exists()).toBe(true)
    expect(wrapper.find('.mh-table-fixed-right').exists()).toBe(true)
  })
}) 