<template>
  <thead>
    <tr>
      <th class="-selectable-column" v-if="shouldRenderSelection" key="--th-multi">
        <multi-select :status="{indeterminate, allCheck}" @onChange="checked => handleEvent(null, 'toggleCheckAll', null, { isChecked: checked })"  />
      </th>
      <th v-for="(col, idx) in tableColumns" 
        :key="col.field+col.index+col.isFilterApplied+''"
        :data-index="col.index"
        class="draggable"
        :class="col.thClass" 
        :style="[col.thStyle, { width: col.colStyle.width }]"
        >

        <div class="-cell-label-container">
          <span v-if="!col.isMenuDisabled" class="-cellMenu" :class="{'filter-applied' : col.isFilterApplied}" @click.prevent.stop="handleEvent($event, 'showColumnMenu', { column: col, columnIndex: idx }, { })">
            <i class="fa fa-bars" aria-hidden="true"></i>
          </span>
          <div class="-header-cell-label">
            <span class="-cellText" :title="col.title">{{ col.title }}</span>
            <span class="-cellInfo" v-if="col.explain" ><i class="fa fa-info-circle" style="cursor: help" :title="col.explain"></i></span>
            <head-sort v-if="col.sortable" :field="col.field" :query="query" />
          </div>
        </div>

        <div ref="resizeContainer" :data-index="col.index" @mousedown="resizeStart($event, $el, col)"  :class="['-cell-resize', '-cell-resize-'+ tableType]"></div>
      </th>
    </tr>
  </thead>
</template>
<script>
import HeadSort from './HeadSort.vue'
import MultiSelect from './MultiSelect.vue'
import props from '../_mixins/props'
import shouldRenderSelection from '../_mixins/shouldRenderSelection'
import isColVisible from '../_utils/isColVisible'

export default {
  name: 'TableHeader',
  components: { HeadSort, MultiSelect },
  mixins: [props, shouldRenderSelection],
  mounted() {},
  data: () => ({
    isMoving: false,
    movingColumn: null,
    movingElement: null,
    mouseStart: null,
    movingElementPoint: null,
    movingStartX: null
  }),
  methods: {
    handleEvent($event, type, data, others) {
      this.$emit('handle-event', $event, type, data, others)
    },
    resizeStart(e, el, col) {
      this.mouseStart = e.clientX

      if (e.stopPropagation) e.stopPropagation()
      if (e.preventDefault) e.preventDefault()

      e.cancelBubble = true
      e.returnValue = false

      this.isMoving = true
      this.movingStartX = e.pageX
      this.movingColumn = col
      this.movingElement = e.target.parentElement
      this.movingElementPoint = e.target

      document.body.style.cursor = 'col-resize'
      window.addEventListener('mousemove', this.handleResize)
      window.addEventListener('mouseup', this.resizeEnd)

      this.$emit('header-resize', e, null, this.tableType)

      return false
    },
    getDeltaX(e) {
      let deltaX = e.pageX - this.movingStartX

      if (this.tableType === 'R') {
        deltaX = -deltaX
      }
      return deltaX
    },
    getNewWidth(deltaX) {
      const movingColumnWidth = this.movingElement.offsetWidth + 'px'
      const oldWidth = parseFloat(movingColumnWidth.replace('px', ''))
      const newWidth = oldWidth + deltaX
      return newWidth
    },
    resizeEnd(e) {
      document.body.style.cursor = 'default'

      window.removeEventListener('mouseup', this.resizeEnd)
      window.removeEventListener('mousemove', this.handleResize)

      const deltaX = this.getDeltaX(e)
      const newWidth = this.getNewWidth(deltaX)
      let columnIndex = this.movingColumn.index

      this.isMoving = false
      this.movingColumn = null
      this.movingElement.style.backgroundColor = ''
      this.movingElement = null
      this.movingElementPoint = null
      this.mouseStart = null

      this.$emit('header-resize', e, deltaX, this.tableType, newWidth, columnIndex)
    },
    handleResize(e) {
      if (this.isMoving && this.movingColumn && this.movingElement) {
        const deltaX = this.getDeltaX(e)
        const newWidth = this.getNewWidth(deltaX)
        this.$emit('header-resize', e, deltaX, null, newWidth, this.movingColumn.index)
      }
    }
  },
  computed: {
    table() {
      return this.$parent.$parent.$parent
    },
    allCheck() {
      return this.table.bodyData.every(row => row._isChecked)
    },
    indeterminate() {
      return !this.allCheck && this.table.bodyData.some(row => row._isChecked)
    },
    tableType() {
      return this.leftFixed ? 'L' : this.rightFixed ? 'R' : 'M'
    },
    tableColumns() {
      if (this.leftFixed) {
        return this.$parent.$parent.$parent.headerColumns.filter(col => isColVisible(col) && (col.fixed === true || col.fixed === 'left'))
      } else if (this.rightFixed) {
        return this.$parent.$parent.$parent.headerColumns.filter(col => isColVisible(col) && col.fixed === 'right')
      } else {
        return this.$parent.$parent.$parent.headerColumns.filter(col => isColVisible(col) && (col.fixed !== true && col.fixed !== 'left' && col.fixed !== 'right'))
      }
    }
  }
}
</script>
