import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DataGridVue3',
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`
    },
    rollupOptions: {
      external: ['vue', '@vueuse/core', 'pinia', 'lodash-es', 'sortablejs', '@floating-ui/vue'],
      output: {
        globals: {
          vue: 'Vue',
          '@vueuse/core': 'VueUse',
          pinia: 'Pinia',
          'lodash-es': '_',
          sortablejs: 'Sortable',
          '@floating-ui/vue': 'FloatingUI'
        }
      }
    }
  }
}) 