<template>
  <div class="nested-row-details">
    <h4>{{ row?.name || 'Unknown Employee' }} – Nested Data</h4>
    <DataTable
      v-if="nested?.data && nested.data.length"
      :columns="nestedColumns"
      :data="Array.isArray(nested.data) ? nested.data : []"
      :total="Array.isArray(nested.data) ? nested.data.length : 0"
      :query="{ limit: 100, offset: 0, sort: [], filters: [] }"
      :selectable="false"
      :show-pagination="false"
      :nested-grid="nestedGridConfig"
      :comp-reg="compReg"
      grid-name="nested-grid"
    />
    <div v-else>
      Žádná data k zobrazení.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataTable from './DataTable.vue'
import type { NestedGridConfig } from '../types'

const props = defineProps({
  row: Object,
  nested: Object,
  compReg: Object
})

const nestedColumns = [
  { field: 'type', title: 'Typ' },
  { field: 'phone', title: 'Telefon' },
  { field: 'address', title: 'Adresa' },
  { field: 'emergency', title: 'Nouzový kontakt' },
  { field: 'startDate', title: 'Nástup' },
  { field: 'manager', title: 'Manažer' },
  { field: 'team', title: 'Tým' },
  { field: 'workLocation', title: 'Pracoviště' },
  { field: 'healthInsurance', title: 'Zdravotní pojištění' },
  { field: 'vacation', title: 'Dovolená' },
  { field: 'bonus', title: 'Bonus' },
  { field: 'stockOptions', title: 'Akcie' }
]

const nestedGridConfig = computed<NestedGridConfig>(() => ({
  enabled: true,
  mode: 'accordion' as const,
  trigger: 'click',
  component: 'nested-row-details'
}))
</script>

<style scoped>
.nested-row-details {
  padding: 20px;
  background: var(--mh-bg-secondary);
  border-left: 4px solid var(--mh-primary);
  margin: 8px 0;
}
.nested-row-details h4 {
  margin: 0 0 16px 0;
  color: var(--mh-text-primary);
  font-size: 18px;
  font-weight: 600;
}
</style> 