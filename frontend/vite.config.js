import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // Vue 3.4+: улучшения реактивности
      script: {
        defineModel: true,
        propsDestructure: true
      }
    }),
    // add visualizer only when ANALYZE=true is set in environment
    ...(process.env.ANALYZE === 'true' ? [visualizer({ filename: 'dist/stats.html', open: false })] : []),
    // PurgeCSS настроен через postcss.config.cjs
    // Generate compressed assets for server delivery (gzip + brotli)
    ...(process.env.NODE_ENV === 'production' ? [
      (compression && compression.default ? compression.default({ algorithm: 'gzip', ext: '.gz' }) : compression({ algorithm: 'gzip', ext: '.gz' })),
      (compression && compression.default ? compression.default({ algorithm: 'brotliCompress', ext: '.br' }) : compression({ algorithm: 'brotliCompress', ext: '.br' }))
    ] : [])
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Поднимаем лимит предупреждения для чанков (default 500kB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vendor_vue'
            if (id.includes('pinia') || id.includes('vue-router')) return 'vendor_state'
            return 'vendor'
          }
          if (id.includes('/src/api/')) return 'api'
          // Выносим composables в отдельный чанк
          if (id.includes('/src/composables/')) return 'composables'
        }
      }
    },
    // CSS code splitting для лучшего кэширования
    cssCodeSplit: true,
    // Minification
    minify: 'esbuild',
    // Source maps только в dev
    sourcemap: process.env.NODE_ENV !== 'production'
  },
  // Относительные ссылки на бандл, чтобы статика подтягивалась корректно
  // при раздаче из произвольного корня на хостинге.
  base: './',
  // Оптимизация dev сервера
  server: {
    warmup: {
      // Pre-transform часто используемые модули
      clientFiles: ['./src/main.js', './src/App.vue', './src/views/*.vue']
    }
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia']
  }
})
