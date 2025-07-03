<template>
  <span @click.prevent="handleClick" class="mh-table-sort" name="HeadSort" :title="`Sort order: ${order || 'none'}`">
    <span v-if="!order" class="sort-icon sort-icon--default" aria-label="Unsorted">
      <!-- Neutral sort circle with up/down arrows -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1" fill="none"/>
        <path d="M6 7l2-2 2 2M6 9l2 2 2-2" stroke="currentColor" stroke-width="1" fill="none"/>
      </svg>
    </span>
    <span v-else-if="order === 'asc'" class="sort-icon sort-icon--asc" aria-label="Sorted ascending">
      <!-- Ascending sort circle with up arrow -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1" fill="currentColor" fill-opacity="0.1"/>
        <path d="M6 9l2-2 2 2" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
    </span>
    <span v-else class="sort-icon sort-icon--desc" aria-label="Sorted descending">
      <!-- Descending sort circle with down arrow -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1" fill="currentColor" fill-opacity="0.1"/>
        <path d="M6 7l2 2 2-2" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
    </span>
  </span>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  field: string,
  query: { sort: { field: string, direction: string }[] }
}>()

const order = ref('')

watch(() => props.query.sort, (sortArray) => {
  const obj = sortArray.find(x => x.field === props.field)
  order.value = obj ? obj.direction : ''
}, { deep: true, immediate: true })

function handleClick(event: MouseEvent) {
  const { query } = props
  let obj = null
  let filtered = query.sort.filter(x => x.field === props.field)
  if (!event.shiftKey) {
    query.sort = filtered
  }
  if (filtered.length > 0) {
    obj = filtered[0]
  }
  let direction = 'desc'
  if (obj) {
    if (obj.direction === 'asc') {
      query.sort.splice(query.sort.indexOf(obj), 1)
      order.value = ''
      return
    }
    direction = obj.direction === 'desc' ? 'asc' : 'desc'
  }
  let columnSort = { field: props.field, direction }
  if (obj) {
    obj.field = props.field
    obj.direction = direction
  } else {
    query.sort.push(columnSort)
  }
  order.value = direction
}
</script>
<style scoped>
.mh-table-sort {
  margin-left: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.mh-table-sort:hover {
  opacity: 1;
}

.sort-icon {
  display: inline-flex;
  vertical-align: middle;
  color: var(--datatable-sort-icon-color, #666);
  transition: color 0.2s ease;
}

.sort-icon--default {
  color: var(--datatable-sort-icon-color, #999);
}

.sort-icon--asc,
.sort-icon--desc {
  color: var(--datatable-sort-icon-active-color, #2563eb);
}

.sort-icon--asc svg,
.sort-icon--desc svg {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}
</style> 