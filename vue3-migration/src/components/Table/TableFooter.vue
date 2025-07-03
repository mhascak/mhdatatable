<template>
  <tfoot class="mh-table-footer">
    <tr class="mh-table-row">
      <td v-for="(col, idx) in tableColumns" :key="idx" class="mh-table-cell">
        <!-- Render summary or leave empty -->
        <span v-if="summary && summary[col.field]">{{ summary[col.field] }}</span>
      </td>
    </tr>
  </tfoot>
</template>

<script setup lang="ts">
const props = defineProps<{
  tableColumns: any[],
  summary?: Record<string, any>
}>()
</script> 