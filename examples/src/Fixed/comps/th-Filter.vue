<template>
  <div class="mhtable-filter-wrapper" :title="title">
      <div class="mhtable-filter-body">
          <input 
            type="search" 
            class="form-control" 
            ref="input"
            v-model="keyword"
            @keyup.enter="search" 
          />
      </div>
      <div class="mhtable-filter-menu">
        <button type="submit" class="k-button k-primary" @click="search" aria-label="Search">Použít</button>
        <button type="reset"  class="k-button" @click="reset" aria-label="Close">Resetovat</button>
      </div>
  </div>
</template>
<script>
export default {
  name: 'columnMenuFilter',
  props: ['field', 'title', 'query', 'column', 'columns', 'data'],
  data() { 
    return {
      keyword: '',
      filtedApplied: false,
      popoverShow: false,
      targetId: 'filterMenuPopover' + this.field,
      selectedFilterType: 'begin',
      filterOptions: [
        { value: 'begin', text: this.L('filter_con_begin') },
        { value: 'contain', text: this.L('filter_con_contain') },
        { value: 'notcontain', text: this.L('filter_con_notcontain') },
        { value: 'eq', text: this.L('filter_con_eq') },
        { value: 'neq', text: this.L('filter_con_neq') },
        { value: 'empty', text: this.L('filter_con_empty') },
        { value: 'notempty', text: this.L('filter_con_notempty') }
      ]
    }
  },
  mounted () {
    this.$el.addEventListener('click', this.onClick)

    let filtered = this.query.filters.find(x => x.dataIndx === this.field)
    if (filtered != null) {
      this.keyword = filtered.value
      this.filtedApplied = true
    }
  },
  beforeDestroy() {
    this.$el.removeEventListener('click', this.onClick)
  },
  methods: {
    L(string) {
      return string;
    },
    onClick() {
      this.$refs.input.focus()
    },
    onClose () {
      this.popoverShow = false
      this.$emit('close-column-menu')
    },
    search (e, reset) {
      let isReset = reset || false

      if (this.keyword && this.keyword.length > 0) {
        this.filtedApplied = true
      } else {
        this.filtedApplied = false
      }

      const { query } = this

      let filterObj = {
        'dataIndx': this.field,
        'value': this.keyword,
        'condition': this.selectedFilterType,
        'dataType': 'string',
        'cbFn': ''
      }

      let filtered = query.filters.find(x => x.dataIndx === this.field)

      if (filtered != null && filtered != undefined) {
        Object.assign(filtered, filterObj)
      } else if (isReset === false) {
        query.filters.push(filterObj)
      }

      query.offset = 0 // reset pagination

      this.onClose()
    },
    reset() {
      const { query } = this
      
      let filtered = query.filters.filter(x => x.dataIndx !== this.field)
      query.filters = filtered

      this.selectedFilterType = this.filterOptions[0].value

      this.keyword = ''
      this.search(null, true)
    }
  }
}
</script>

<style scoped>
  input[type=search]::-webkit-search-cancel-button {
    -webkit-appearance: searchfield-cancel-button;
    cursor: pointer;
  }

  .mhtable-filter-wrapper{
    width: 100%;
    position: relative;
    display: inline-block;
    vertical-align: middle;
  }

  .mhtable-filter-body{
    padding-left: 5px;
    padding-right: 5px;
    padding-bottom: 5px;
  } 

  .mhtable-filter-menu {
    padding-top: 8px;
    margin-bottom: 5px;
    min-width: 36px;   
    text-align: right;
    padding-left: 5px;
    padding-right: 5px;
    border-top: 1px solid #e4e4e4;
  }

</style>
