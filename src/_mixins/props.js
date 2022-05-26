export default {
  props: {
    gridName: { type: String, required: false, default: '' },
    columns: { type: Array, required: true },
    data: { type: Array, required: true }, // rows
    total: { type: Number, required: true },
    query: { type: Object, required: true },
    showSaveGridViewButton: { type: Boolean, default: false },
    selection: Array, // container for multi-select
    summary: Object, // an extra summary row
    xprops: Object, // extra custom props carrier passed to dynamic components
    customResetLogic: {
      type: Boolean,
      default: () => false
    },
    HeaderSettings: { type: Boolean, default: true }, // whether to render `HeaderSettings`
    Pagination: { type: Boolean, default: true }, // whether to render `PageSizeSelect` and `Pagination`
    pageSizeOptions: {
      type: Array,
      default: function() {
        return [10, 20, 40, 50, 80, 100]
      }
    },
    contextMenuOptions: {
      type: Array,
      default() {
        return []
      }
    },
    pending: { type: Boolean, default: false },
    tblClass: [String, Object, Array], // classes for <table>
    tblStyle: [String, Object, Array], // inline styles for <table>
    fixHeaderAndSetBodyMaxHeight: Number, // a fancy prop which combines two props into one
    supportNested: [Boolean, String], // support nested components feature (String is only for 'accordion')
    supportBackup: Boolean, // support backup for `HeaderSettings`
    fullHeight: { type: Object },
    treeColumnOptions: { type: Object },
    showSelection: { type: Boolean, default: false },
    compReg: { type: Object, default: () => {} },
    dataSource: {
      type: Object,
      default: function() {
        return {
          read: null,
          create: null,
          update: null,
          delete: null,
          headers: [],
          normalizeResponseCallback: null
        }
      }
    } // read, update, delete, edit
  },
  data() {
    let datatableInstance = this
    while (datatableInstance.$options.name !== 'Datatable') {
      datatableInstance = datatableInstance.$parent
    }
    return {
      // the source of dynamic components (thComp / tdComp / nested components)
      comp: {...datatableInstance.$parent.$options.components, ...this.compReg}
    }
  },
  methods: {
    // usage: <component :is="forDynCompIs(XXX)" ... />
    forDynCompIs(component) {
      // according to https://vuejs.org/v2/guide/components.html#Dynamic-Components
      // dynamic components can be names (string) or component objects
      return typeof component === 'object' ? component : this.comp[component]
    }
  }
}
