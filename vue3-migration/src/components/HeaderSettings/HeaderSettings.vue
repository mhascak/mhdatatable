<template>
  <div class="header-settings-stub btn-group" ref="dropdownRoot" v-bind="$attrs">
    <button class="btn btn-default dropdown-toggle" @click.stop.prevent="toggle" type="button">
      <i class="fa" :class="[usingBak ? 'text-info' : '', processingCls || 'fa-cog']"></i>
      <span class="caret"></span>
    </button>
    <div v-if="open" class="dropdown-menu clearfix" :style="drpMenuStyle">
      <div class="-col-group-container">
        <ColumnGroup v-for="(columns, groupName) in colGroups"
          :key="groupName"
          :group-name="groupName"
          :columns="columns"
          ref="colGroups"
        />
      </div>
      <div class="clearfix" style="margin: 10px 0">
        <div class="btn-group btn-group-sm pull-right">
          <button class="btn btn-default" type="button" @click="apply()">
            Apply
          </button>
          <template v-if="supportBackup">
            <button class="btn btn-default dropdown-toggle" type="button" style="box-shadow: none">
              <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
              <li @click="apply(true)">
                <a href="#" @click.prevent>
                  <i class="fa fa-floppy-o"></i>&nbsp;
                  Apply and backup settings to local
                </a>
              </li>
              <li v-if="usingBak" @click="rmBackup()">
                <a href="#" @click.prevent>
                  <i class="fa fa-trash-o text-danger"></i>&nbsp;
                  Clear local settings backup and restore
                </a>
              </li>
            </ul>
          </template>
        </div>
      </div>
      <small v-if="usingBak" class="pull-left text-muted" style="margin-top: -8px">
        ( Using local settings )
      </small>
    </div>
  </div>
</template>

<script setup lang="ts" inheritAttrs="false">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import groupBy from 'lodash-es/groupBy'
import ColumnGroup from './ColumnGroup.vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { stringify } from '@/utils'

const props = defineProps<{
  columns: any[],
  supportBackup: boolean
}>()

const open = ref(false)
const usingBak = ref(false)
const processingCls = ref('')
const dropdownRoot = ref<HTMLElement | null>(null)
const origSettings = JSON.stringify(props.columns)
const storageKey = computed(() => props.supportBackup ? `datatable-header-${origSettings.substring(0, 50)}` : '')
const { saveToLS, getFromLS, removeFromLS } = useLocalStorage()

const colGroups = computed(() => {
  return groupBy(
    props.columns.filter(col => col.label || col.title),
    'group'
  )
})

const drpMenuStyle = computed(() => {
  const w = Object.keys(colGroups.value).length * 150
  return {
    padding: '10px 10px 0',
    width: `${w + 25}px`,
    left: `-${w - 25}px`
  }
})

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function apply(alsoBackup?: boolean) {
  close()
  // Apply column group changes
  const colGroups = dropdownRoot.value?.querySelectorAll('.col-group') || []
  colGroups.forEach((colGroup: any) => {
    if (colGroup && colGroup.__vueParentComponent && colGroup.__vueParentComponent.proxy.apply) {
      colGroup.__vueParentComponent.proxy.apply()
    }
  })
  if (alsoBackup) nextTick(() => backup())
}

function backup() {
  if (storageKey.value) {
    saveToLS(storageKey.value, props.columns)
    usingBak.value = true
  }
}

function rmBackup() {
  if (storageKey.value) {
    removeFromLS(storageKey.value)
    usingBak.value = false
    // restore original
    // TODO: replaceWith logic
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRoot.value && !dropdownRoot.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (props.supportBackup && storageKey.value) {
    const backup = getFromLS(storageKey.value)
    if (backup) {
      // TODO: replaceWith logic
      usingBak.value = true
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.header-settings-stub {
  position: relative;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-default {
  background: #ffffff;
  border-color: #d1d5db;
}

.caret {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 2px;
  vertical-align: middle;
  border-top: 4px solid;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  display: block;
  min-width: 200px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-top: 2px;
}

.-col-group-container {
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 0;
}

.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

.btn-group-sm .btn {
  padding: 4px 8px;
  font-size: 12px;
}

.pull-right {
  float: right;
}

.pull-left {
  float: left;
}

.text-info {
  color: #3b82f6;
}

.text-muted {
  color: #6b7280;
}

.text-danger {
  color: #ef4444;
}

.fa {
  font-family: 'Font Awesome', sans-serif;
}

.fa-cog::before {
  content: '⚙️';
}

.fa-floppy-o::before {
  content: '💾';
}

.fa-trash-o::before {
  content: '🗑️';
}

.dropdown-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dropdown-menu li {
  padding: 0;
}

.dropdown-menu a {
  display: block;
  padding: 8px 16px;
  color: #374151;
  text-decoration: none;
  transition: background-color 0.2s;
}

.dropdown-menu a:hover {
  background-color: #f3f4f6;
}
</style> 