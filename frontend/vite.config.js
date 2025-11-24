import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Относительные ссылки на бандл, чтобы статика подтягивалась корректно
  // при раздаче из произвольного корня на хостинге.
  base: './',
})
