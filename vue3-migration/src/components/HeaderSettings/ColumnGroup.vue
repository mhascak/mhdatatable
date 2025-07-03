<template>
  <ul class="-col-group col-group" name="ColumnGroup">
    <label class="-col-group-title">
      {{ groupName === 'undefined' ? 'Columns' : groupName }}
    </label>
    <li v-for="(col, idx) in columns" :key="idx">
      <input
        type="checkbox"
        :id="uuidGen(col.field || idx)"
        :name="groupName"
        :checked="isColVisible(col)"
        :disabled="typeof col.visible === 'string'"
        @change="handleChange(col, $event.target.checked)"
      >
      <label :for="uuidGen(col.field || idx)">
        {{ col.label || col.title }}
        <i v-if="col.explain" class="fa fa-info-circle" style="cursor: help" :title="col.explain"></i>
      </label>
    </li>
  </ul>
</template>
<script setup lang="ts">
import { ref, getCurrentInstance } from 'vue'
import { isColVisible } from '../../utils/isColVisible'
import type { TableColumn } from '../../types'

const props = defineProps<{
  groupName: string,
  columns: TableColumn[]
}>()

const changes = ref<{ col: TableColumn, isChecked: boolean }[]>([])
const instance = getCurrentInstance()

function handleChange(col: TableColumn, isChecked: boolean) {
  changes.value.push({ col, isChecked })
}

function uuidGen(key: string | number) {
  // Use instance.uid for unique id
  return `-col-${instance?.uid ?? '0'}-${key}`
}

function apply() {
  changes.value.forEach(({ col, isChecked }) => {
    col.visible = isChecked
  })
  changes.value = []
}

defineExpose({ apply })
</script>
<style scoped>
.-col-group {
  display: inline-block;
  margin-bottom: 5px;
  padding: 0;
  width: 150px;
  vertical-align: top;
}
.-col-group-title {
  display: block;
  margin: 5px;
  padding: 5px;
  border-bottom: 1px solid #ddd;
  font-size: 18px;
}
.-col-group > li {
  margin-bottom: 5px;
  padding-left: 10px;
  list-style: none;
  line-height: 20px;
  font-size: 12px;
}
.-col-group > li > * {
  margin: 0;
  vertical-align: middle;
}
</style> 