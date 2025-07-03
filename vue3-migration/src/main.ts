import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import './styles/preset-default.css'
import './styles/design-tokens.css'
import './styles/core.css'
import './styles/components.css'
import './styles/themes.css'
import './styles/advanced-demo.css'

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      'Pin Column': 'Pin Column',
      'Pin left': 'Pin left',
      'Pin right': 'Pin right',
      'No pin': 'No pin',
      'Auto size This Column': 'Auto size This Column',
      'Auto size All Columns': 'Auto size All Columns',
      'Reset columns': 'Reset columns',
      'Reset all filters': 'Reset all filters'
    }
  }
})

// Create Pinia store
const pinia = createPinia()

// Create and mount the app
const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.mount('#app') 