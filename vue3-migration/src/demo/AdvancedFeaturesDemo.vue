<template>
  <div class="advanced-features-demo">
    <h1>Advanced DataTable Features Demo</h1>
    
    <!-- Feature Toggle Controls -->
    <div class="demo-controls">
      <div class="control-group">
        <h3>Features</h3>
        <label>
          <input type="checkbox" v-model="enableNestedGrids" />
          Enable Nested Grids (Row Details)
        </label>
        <label>
          <input type="checkbox" v-model="enableGrouping" />
          Enable Grouping
        </label>
        <label>
          <input type="checkbox" v-model="enableComplexHeaders" />
          Enable Complex Headers
        </label>
      </div>
      
      <div class="control-group" v-if="enableNestedGrids">
        <h3>Nested Grid Options</h3>
        <button @click="expandAllRows">Expand All Rows</button>
        <button @click="collapseAllRows">Collapse All Rows</button>
      </div>
      
      <div class="control-group" v-if="enableGrouping">
        <h3>Grouping Options</h3>
        <label>
          Group by:
          <select v-model="groupByField">
            <option value="">None</option>
            <option value="department">Department</option>
            <option value="location">Location</option>
            <option value="status">Status</option>
          </select>
        </label>
        <button @click="expandAllGroups">Expand All Groups</button>
        <button @click="collapseAllGroups">Collapse All Groups</button>
      </div>
    </div>
    
    <!-- DataTable -->
    <div class="datatable-container">
      <DataTable
        :columns="currentColumns"
        :data="sampleData"
        :total="sampleData.length"
        :query="query"
        :selectable="true"
        :show-pagination="true"
        :virtualized="false"
        :nested-grid="nestedGridConfig"
        :grouping="groupingConfig"
        :complex-headers="enableComplexHeaders"
        :comp-reg="{ 'nested-row-details': NestedRowDetails }"
        grid-name="advanced-demo"
        @row-click="handleRowClick"
        @nested-toggle="handleNestedToggle"
      >
        <!-- Custom cell templates -->
        <template #cell-name="{ row }">
          <div class="employee-cell" :class="{ 'group-header': row._isGroupHeader }">
            <template v-if="row._isGroupHeader">
              <div class="group-header-content">
                <span class="group-icon">📁</span>
                <span class="group-title">{{ row.name }}</span>
                <span class="group-count">({{ row.children?.length || 0 }} items)</span>
              </div>
            </template>
            <template v-else>
              <img :src="row.avatar || '/default-avatar.png'" :alt="row.name || 'Employee'" class="employee-avatar" />
              <div class="employee-info">
                <div class="employee-name">{{ row.name || 'Unknown' }}</div>
                <div class="employee-title">{{ row.title || 'N/A' }}</div>
              </div>
            </template>
          </div>
        </template>

        <template #cell-department="{ row }">
          <span v-if="!row._isGroupHeader" class="department-badge" :class="`department-${row.department?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`">
            {{ row.department || 'N/A' }}
          </span>
          <span v-else class="group-cell">-</span>
        </template>

        <template #cell-salary="{ row }">
          <div class="salary-cell">
            <template v-if="row._isGroupHeader">
              <strong>${{ row.aggregations?.salary_sum?.toLocaleString() || '0' }}</strong>
              <small>(total)</small>
            </template>
            <template v-else>
              ${{ row.salary?.toLocaleString() || '0' }}
            </template>
          </div>
        </template>

        <template #cell-status="{ row }">
          <span v-if="!row._isGroupHeader" class="status-badge" :class="`status-${row.status?.toLowerCase() || 'unknown'}`">
            {{ row.status || 'N/A' }}
          </span>
          <span v-else class="group-cell">{{ row.aggregations?.salary_count || 0 }} items</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="action-buttons">
            <template v-if="!row._isGroupHeader">
              <button @click="viewEmployee(row)" class="btn-view" title="View Details">👁️</button>
              <button @click="editEmployee(row)" class="btn-edit" title="Edit">✏️</button>
              <button @click="deleteEmployee(row)" class="btn-delete" title="Delete">🗑️</button>
            </template>
            <template v-else>
              <button @click="toggleGroupExpansion(row)" class="btn-expand" :title="row._childrenVisible ? 'Collapse' : 'Expand'">
                {{ row._childrenVisible ? '▼' : '▶' }}
              </button>
            </template>
          </div>
        </template>
      </DataTable>
    </div>
      
    <!-- Demo Information -->
    <div class="demo-info">
      <h3>✅ Features Currently Working:</h3>
      <ul>
        <li><strong>Custom Cell Templates:</strong> Employee avatars, department badges, status indicators</li>
        <li><strong>Row Selection:</strong> Multi-row selection with checkboxes</li>
        <li><strong>Column Sorting:</strong> Click column headers to sort data</li>
        <li><strong>Column Reordering:</strong> Drag column headers to reorder</li>
        <li><strong>Row Actions:</strong> View, edit, and delete buttons</li>
        <li><strong>Pagination:</strong> Navigate through data pages</li>
        <li><strong>Nested Row Details:</strong> Click rows to expand additional information</li>
        <li><strong>Data Grouping:</strong> Group rows by department, location, or status with aggregations</li>
        <li><strong>Complex Headers:</strong> Multi-level column headers for better organization</li>
      </ul>
      
      <h3>🚀 Advanced Features (Available):</h3>
      <ul>
        <li><strong>Virtual Scrolling:</strong> Performance optimization for large datasets</li>
        <li><strong>Column Pinning:</strong> Pin columns to left or right</li>
        <li><strong>Tree Mode:</strong> Hierarchical data display (ready for implementation)</li>
        <li><strong>Performance Monitoring:</strong> Built-in performance metrics</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from '../components/DataTable.vue'
import NestedRowDetails from '../components/NestedRowDetails.vue'
import type { TableColumn, NestedGridConfig, TableQuery } from '../types'

// Demo state
const enableNestedGrids = ref(true)
const enableGrouping = ref(false)
const enableComplexHeaders = ref(false)
const groupByField = ref('')

// Query state
const query = ref<TableQuery>({
  limit: 10,
  offset: 0,
  sort: [],
  filters: [],
  groupBy: [],
  expandedGroups: []
})

// Nested grid configuration
const nestedGridConfig = computed<NestedGridConfig>(() => ({
  enabled: enableNestedGrids.value,
  mode: 'accordion',
  trigger: 'click',
  component: 'nested-row-details'
}))

// Grouping configuration
const groupingConfig = computed(() => {
  if (!enableGrouping.value || !groupByField.value) {
    return undefined
  }
  
  return {
    field: groupByField.value,
    title: groupByField.value.charAt(0).toUpperCase() + groupByField.value.slice(1),
    defaultExpanded: false,
    aggregation: {
      fields: ['salary'],
      functions: ['sum', 'avg', 'count'] as ('sum' | 'avg' | 'count' | 'min' | 'max')[]
    }
  }
})

// Sample data with rich employee profiles
const sampleData = ref([
  {
    id: 314181,
    name: 'Adrian Conner',
    title: 'COO',
    email: 'adrian.conner@company.com',
    department: 'Executive Management',
    employmentType: 'Permanent',
    location: 'Netherlands',
    country: 'Netherlands',
    joinDate: '2011-11-30',
    salary: 71450,
    paymentMethod: 'Check',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    _isExpanded: false,
    children: [
      { type: 'Personal Info', phone: '+31 20 123 4567', address: 'Amsterdam, Netherlands', emergency: 'Maria Conner (+31 20 987 6543)' },
      { type: 'Employment', startDate: '2011-11-30', manager: 'CEO', team: 'Executive', workLocation: 'Hybrid' },
      { type: 'Benefits', healthInsurance: 'Premium', vacation: '25 days', bonus: '15%', stockOptions: 'Yes' }
    ]
  },
  {
    id: 333238,
    name: 'Cheryl Browning',
    title: 'CTO',
    email: 'cheryl.browning@company.com',
    department: 'Customer Support',
    employmentType: 'Contract',
    location: 'United States',
    country: 'United States',
    joinDate: '2015-09-07',
    salary: 59670,
    paymentMethod: 'Bank Transfer',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    _isExpanded: false,
    children: [
      { type: 'Personal Info', phone: '+1 555 123 4567', address: 'San Francisco, CA', emergency: 'John Browning (+1 555 987 6543)' },
      { type: 'Employment', startDate: '2015-09-07', manager: 'COO', team: 'Technology', workLocation: 'Remote' },
      { type: 'Skills', primary: ['Leadership', 'Strategy', 'Technology'], secondary: ['Python', 'AWS', 'DevOps'] }
    ]
  },
  {
    id: 503906,
    name: 'Shawn Hendrix',
    title: 'Exec. Vice President',
    email: 'shawn.hendrix@company.com',
    department: 'Customer Support',
    employmentType: 'Contract',
    location: 'France',
    country: 'France',
    joinDate: '2001-12-28',
    salary: 112140,
    paymentMethod: 'Bank Transfer',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    _isExpanded: false,
    children: [
      { type: 'Personal Info', phone: '+33 1 23 45 67 89', address: 'Paris, France', emergency: 'Sophie Hendrix (+33 1 98 76 54 32)' },
      { type: 'Employment', startDate: '2001-12-28', manager: 'CEO', team: 'Operations', workLocation: 'Office' },
      { type: 'Achievements', awards: ['Employee of the Year 2020', 'Innovation Award 2019'], certifications: ['PMP', 'Agile'] }
    ]
  },
  {
    id: 442027,
    name: 'Dr. Janice Rice',
    title: 'Employee',
    email: 'janice.rice@company.com',
    department: 'Customer Support',
    employmentType: 'Contract',
    location: 'United Kingdom',
    country: 'United Kingdom',
    joinDate: '2005-09-16',
    salary: 44940,
    paymentMethod: 'Check',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
    _isExpanded: false,
    children: [
      { type: 'Personal Info', phone: '+44 20 1234 5678', address: 'London, UK', emergency: 'Michael Rice (+44 20 9876 5432)' },
      { type: 'Education', degree: 'PhD in Computer Science', university: 'Oxford University', year: '2003' },
      { type: 'Projects', current: ['AI Research', 'Data Analysis'], completed: ['Machine Learning Platform', 'Analytics Dashboard'] }
    ]
  }
])

// Column definitions
const baseColumns: TableColumn[] = [
  {
    field: 'name',
    title: 'Employee',
    sortable: true,
    width: 250
  },
  {
    field: 'department',
    title: 'Department',
    sortable: true,
    width: 180
  },
  {
    field: 'location',
    title: 'Location',
    sortable: true,
    width: 150
  },
  {
    field: 'salary',
    title: 'Salary',
    sortable: true,
    width: 120
  },
  {
    field: 'status',
    title: 'Status',
    sortable: true,
    width: 100
  },
  {
    field: 'actions',
    title: 'Actions',
    sortable: false,
    width: 120
  }
]

// Complex headers example
const complexColumns: TableColumn[] = [
  {
    field: 'employee-info',
    title: 'Employee Information',
    children: [
      {
        field: 'name',
        title: 'Name',
        sortable: true,
        width: 200
      },
      {
        field: 'title',
        title: 'Title',
        sortable: true,
        width: 150
      }
    ]
  },
  {
    field: 'work-details',
    title: 'Work Details',
    children: [
      {
        field: 'department',
        title: 'Department',
        sortable: true,
        width: 140
      },
      {
        field: 'location',
        title: 'Location',
        sortable: true,
        width: 120
      }
    ]
  },
  {
    field: 'compensation',
    title: 'Compensation',
    children: [
      {
        field: 'salary',
        title: 'Salary',
        sortable: true,
        width: 100
      },
      {
        field: 'status',
        title: 'Status',
        sortable: true,
        width: 80
      }
    ]
  },
  {
    field: 'actions',
    title: 'Actions',
    sortable: false,
    width: 120
  }
]

const currentColumns = computed(() => 
  enableComplexHeaders.value ? complexColumns : baseColumns
)

// Event handlers
function handleRowClick(row: any, index: number) {
  console.log('Row clicked:', row.name)
  console.log('Row has nested:', row._hasNested)
  console.log('Row nested data:', row.__nested__)
  console.log('Original row children:', row.children)
}

function handleNestedToggle(row: any, visible: boolean) {
  console.log('Nested toggle:', row.name, visible)
  const originalRow = sampleData.value.find(r => r.id === row.id)
  if (originalRow) {
    originalRow._isExpanded = visible
  }
}

function expandAllRows() {
  sampleData.value.forEach(row => {
    row._isExpanded = true
  })
}

function collapseAllRows() {
  sampleData.value.forEach(row => {
    row._isExpanded = false
  })
}

function expandAllGroups() {
  // Update query to expand all groups
  query.value.expandedGroups = ['all']
  console.log('Expand all groups')
}

function collapseAllGroups() {
  // Clear all expanded groups
  query.value.expandedGroups = []
  console.log('Collapse all groups')
}

// Action handlers
function viewEmployee(row: any) {
  alert(`Viewing employee: ${row.name}`)
}

function editEmployee(row: any) {
  alert(`Editing employee: ${row.name}`)
}

function deleteEmployee(row: any) {
  if (confirm(`Delete employee ${row.name}?`)) {
    const index = sampleData.value.findIndex(emp => emp.id === row.id)
    if (index > -1) {
      sampleData.value.splice(index, 1)
    }
  }
}

function toggleGroupExpansion(row: any) {
  if (row._groupKey) {
    // Toggle the group in the query's expandedGroups
    const currentExpanded = query.value.expandedGroups || []
    const groupKey = row._groupKey
    
    if (currentExpanded.includes(groupKey)) {
      // Remove from expanded groups (collapse)
      query.value.expandedGroups = currentExpanded.filter(key => key !== groupKey)
    } else {
      // Add to expanded groups (expand)
      query.value.expandedGroups = [...currentExpanded, groupKey]
    }
    
    console.log('Toggle group:', groupKey, 'Expanded groups:', query.value.expandedGroups)
  }
}
</script>

<style scoped>
.advanced-features-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.demo-controls {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--mh-bg-secondary);
  border-radius: var(--mh-border-radius-lg);
  border: 1px solid var(--mh-border-color);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group h3 {
  margin: 0 0 8px 0;
  color: var(--mh-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--mh-text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.control-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--mh-primary);
}

.control-group select {
  padding: 6px 12px;
  border: 1px solid var(--mh-border-color);
  border-radius: var(--mh-border-radius);
  background: var(--mh-bg-primary);
  color: var(--mh-text-primary);
  font-size: 14px;
}

.control-group button {
  padding: 8px 16px;
  background: var(--mh-primary);
  color: white;
  border: none;
  border-radius: var(--mh-border-radius);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-group button:hover {
  background: var(--mh-primary-dark);
}

.datatable-container {
  margin-bottom: 30px;
  border-radius: var(--mh-border-radius-lg);
  overflow: hidden;
  box-shadow: var(--mh-shadow-md);
}

/* Employee cell styling */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.employee-cell.group-header {
  background: rgba(var(--mh-primary-rgb), 0.1);
  padding: 8px 12px;
  border-radius: var(--mh-border-radius);
  font-weight: 600;
}

.group-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-icon {
  font-size: 16px;
}

.group-title {
  font-weight: 600;
  color: var(--mh-primary);
}

.group-count {
  color: var(--mh-text-secondary);
  font-size: 12px;
  font-weight: normal;
}

.group-cell {
  color: var(--mh-text-secondary);
  font-style: italic;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--mh-border-color);
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-name {
  font-weight: 600;
  color: var(--mh-text-primary);
  font-size: 14px;
}

.employee-title {
  font-size: 12px;
  color: var(--mh-text-secondary);
}

/* Department badge styling */
.department-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--mh-border-radius);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.department-executive-management {
  background: rgba(139, 69, 19, 0.1);
  color: #8B4513;
  border: 1px solid rgba(139, 69, 19, 0.2);
}

.department-customer-support {
  background: rgba(34, 139, 34, 0.1);
  color: #228B22;
  border: 1px solid rgba(34, 139, 34, 0.2);
}

.department-technology {
  background: rgba(70, 130, 180, 0.1);
  color: #4682B4;
  border: 1px solid rgba(70, 130, 180, 0.2);
}

/* Salary cell styling */
.salary-cell {
  font-weight: 600;
  color: var(--mh-success);
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
}

/* Status badge styling */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--mh-border-radius);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: rgba(34, 197, 94, 0.1);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-pending {
  background: rgba(251, 191, 36, 0.1);
  color: #FBBF24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

/* Action buttons styling */
.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-buttons button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--mh-border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-view {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.btn-view:hover {
  background: rgba(59, 130, 246, 0.2);
}

.btn-edit {
  background: rgba(251, 191, 36, 0.1);
  color: #FBBF24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.btn-edit:hover {
  background: rgba(251, 191, 36, 0.2);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Demo info styling */
.demo-info {
  background: var(--mh-bg-secondary);
  padding: 24px;
  border-radius: var(--mh-border-radius-lg);
  border: 1px solid var(--mh-border-color);
}

.demo-info h3 {
  margin: 0 0 16px 0;
  color: var(--mh-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.demo-info ul {
  margin: 0 0 24px 0;
  padding-left: 20px;
}

.demo-info li {
  margin-bottom: 8px;
  color: var(--mh-text-secondary);
  line-height: 1.5;
}

.demo-info li strong {
  color: var(--mh-text-primary);
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .demo-controls {
    flex-direction: column;
    gap: 20px;
  }
  
  .employee-cell {
    gap: 8px;
  }
  
  .employee-avatar {
    width: 32px;
    height: 32px;
  }
  
  .action-buttons {
    gap: 4px;
  }
  
  .action-buttons button {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
}
</style>