<template>
  <nav class="tablePagination" v-bind="$attrs">
    <span class="total-count">Total: {{ total }}</span>
    <ul class="pagination" style="margin: 0" name="Pagination">
      <li class="page-item" :class="{ disabled: isFirstPage }" @click="turnPage(-1)">
        <a href="#" class="page-link" @click.prevent>
          <i class="fa fa-arrow-left"></i>
        </a>
      </li>
      <li v-for="(i, index) in dspBtns" :key="index" :class="['page-item', { active: i === curPage }]">
        <a v-if="i" href="#" class="page-link" @click.prevent="handleClick(i)">
          {{ i }}
        </a>
        <a v-else class="page-link">
          <i class="fa fa-ellipsis-h"></i>
        </a>
      </li>
      <li :class="{ disabled: isLastPage }" class="page-item" @click="turnPage(1)">
        <a href="#" class="page-link" @click.prevent>
          <i class="fa fa-arrow-right"></i>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts" inheritAttrs="false">
import { computed, toRefs, watch } from 'vue'

const props = defineProps<{
  total: number,
  query: { offset: number, limit: number }
}>()
const emit = defineEmits<{ (e: 'page-change', page: number): void }>()

const { total, query } = toRefs(props)

const totalPage = computed(() => Math.ceil(total.value / query.value.limit))
const curPage = computed(() => Math.ceil(query.value.offset / query.value.limit) + 1)
const isFirstPage = computed(() => query.value.offset === 0 || query.value.limit >= total.value)
const isLastPage = computed(() => query.value.offset + query.value.limit >= total.value)

const dspBtns = computed(() => {
  const n = totalPage.value
  const i = curPage.value
  if (n <= 9) return Array.from({ length: n }, (_, idx) => idx + 1)
  if (i <= 5) return [1, 2, 3, 4, 0, n]
  if (i >= n - 4) return [1, 0, n - 4, n - 3, n - 2, n - 1, n]
  return [1, 0, i - 2, i - 1, i, i + 1, i + 2, 0, n]
})

function handleClick(n: number) {
  emit('page-change', n)
}

function turnPage(i: number) {
  if ((i < 0 && isFirstPage.value) || (i > 0 && isLastPage.value)) return
  emit('page-change', curPage.value + i)
}
</script> 