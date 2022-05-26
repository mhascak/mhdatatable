<template>
  <table :ref="'tableHeader'" :class="tableClass"  :style="[tblStyle, { width: colWidth }]">
    <colgroup>
      <col v-if="shouldRenderSelection" style="width: 30px" />
      <col v-for="(col) in tableColumns" 
      :data-index="col.index" 
      :class="col.colClass" 
      :key="col.field" 
       /> -->
    </colgroup>
    <slot />
  </table>
</template>
<script>
import props from '../_mixins/props'
import shouldRenderSelection from '../_mixins/shouldRenderSelection'
import isColVisible from '../_utils/isColVisible'

export default {
  name: 'TableFrame',
  mixins: [props, shouldRenderSelection],
  data() {
    return {
      width: 0
    }
  },
  computed: {
    tableClass() {
      let existColumnWithoutFixedWidth = false
      if (!this.rightFixed && !this.leftFixed) {
        existColumnWithoutFixedWidth = this.$parent.$parent.headerColumns.some(col => col.fixed !== true && col.fixed !== 'left' && col.fixed !== 'right' && (col.colStyle == null || col.colStyle != null && !col.colStyle.hasOwnProperty('width')))
      }

      let newClass = {
        'table table-striped table-hover': true
        // 'table-columns-auto': existColumnWithoutFixedWidth === true, //&& this.$parent.$parent.colWidth >= this.$parent.tableWidth,
        // 'table-clomuns-allFixed': existColumnWithoutFixedWidth === false //&& this.leftFixed === false && this.rightFixed === false && this.$parent.$parent.colWidth < this.width
      }
      newClass[this.tblClass] = true

      return newClass
    },
    tableColumns() {
      if (this.leftFixed) {
        return this.$parent.$parent.headerColumns.filter(col => isColVisible(col) && (col.fixed === true || col.fixed === 'left'))
      } else if (this.rightFixed) {
        return this.$parent.$parent.headerColumns.filter(col => isColVisible(col) && col.fixed === 'right')
      } else {
        return this.$parent.$parent.headerColumns.filter(col => isColVisible(col) && (col.fixed !== true && col.fixed !== 'left' && col.fixed !== 'right'))
      }
    },
    colWidth() {
      return this.$parent.$parent.colWidth > 0 && !this.leftFixed && !this.rightFixed ? this.$parent.$parent.colWidth + 'px' : '100%'
    }
  },
  destroyed() {
    // window.removeEventListener('resize', this.handleResize)
  },
  mounted() {
    // this._el = this.$el
    // window.addEventListener('resize', this.handleResize)
  },
  methods: {
    // handleResize (event) {
    //   if(this.leftFixed === false && this.rightFixed === false){
    //   console.log(this.$el.offsetWidth)
    //   this.width = this.$el.offsetWidth
    //   }
    // }
  }
  
}
</script>
