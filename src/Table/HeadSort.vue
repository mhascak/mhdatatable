<template>
  <a href="#" @click.prevent="handleClick" class="mh-table-sort" name="HeadSort">
    <i :class="cls"></i>
  </a>
</template>
<script>
/**
 * Sorting arrows within <th>
 */
export default {
  name: 'HeadSort',
  props: {
    field: { type: String, required: true },
    query: { type: Object, required: true }
  },
  data: () => ({
    order: ''
  }),
  computed: {
    cls () {
      const { order } = this
      return [
        'fa',
        { 'fa-sort text-muted': !order,
          'fa-sort-up': order === 'asc',
          'fa-sort-down': order === 'desc'
        }
      ]
    }
  },
  watch: {
    query: {
      handler (query) {
        let obj = query.sort.find(x => x.dataIndx === this.field)
        obj != null && obj != undefined ? this.order = obj.dir : this.order = ''
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    handleClick () {
      const { query, order } = this

      let obj = null
      let filtered = query.sort.filter(x => x.dataIndx === this.field)

      if (event.shiftKey === false) {
        query.sort = filtered
      }

      if (filtered.length > 0) {
        obj = filtered[0]
      }

      let isLast = false
      let dir = 'desc'

      if (obj != null && obj != undefined) {
        if (obj.dir === 'asc') {
          query.sort.splice(
            query.sort.indexOf(obj), 1
          )
          this.order = ''
          return
        }
        dir = obj.dir === 'desc' ? 'asc' : 'desc'
      }

      let columnSort = { dataIndx: this.field, dir: dir }

      if (obj != null && obj != undefined) {
        obj.dataIndx = this.field
        obj.dir = dir
      } else {
        query.sort.push(columnSort)
      }
    }
  }
}
</script>
<style>
.mh-table-sort{
  margin-left: 6px;
}
</style>
