import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // add visualizer only when ANALYZE=true is set in environment
    ...(process.env.ANALYZE === 'true' ? [visualizer({ filename: 'dist/stats.html', open: false })] : []),
    // (UnoCSS skipped due to vite version compatibility) 
    // PurgeCSS настроен через postcss.config.cjs
    // Generate compressed assets for server delivery (gzip + brotli)
    ...(process.env.NODE_ENV === 'production' ? [
      (compression && compression.default ? compression.default({ algorithm: 'gzip', ext: '.gz' }) : compression({ algorithm: 'gzip', ext: '.gz' })),
      (compression && compression.default ? compression.default({ algorithm: 'brotliCompress', ext: '.br' }) : compression({ algorithm: 'brotliCompress', ext: '.br' }))
    ] : [])
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vendor_vue'
            if (id.includes('pinia') || id.includes('vue-router')) return 'vendor_state'
            return 'vendor'
          }
          if (id.includes('/src/api/')) return 'api'
        }
      }
    }
  },
  // Относительные ссылки на бандл, чтобы статика подтягивалась корректно
  // при раздаче из произвольного корня на хостинге.
  base: './',
})
