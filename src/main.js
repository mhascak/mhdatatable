import Datatable from './index.vue'
import VueTippy from 'vue-tippy'

Datatable.install = (Vue, options) => {
  const locale = options ? options.locale : {}

  // this might be the simplest i18n solution
  Vue.prototype.$i18nForDatatable = srcTxt => locale[srcTxt] || srcTxt

  Vue.component('Datatable', Datatable)
  Vue.use(VueTippy)
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(Datatable)
  window.Vue.use(VueTippy)
}

export default Datatable
