import { getCurrentInstance, onMounted, onUnmounted, ref } from 'vue'

/**
 * Синхронизация темы с системным предпочтением. Если на <html> уже указан data-theme,
 * компоновка не вмешивается и просто возвращает текущее значение.
 * Работает как внутри компонентов (через хуки), так и вне них (вызов выполняется сразу).
 */
export function usePreferredTheme(options = {}) {
  const { root = typeof document !== 'undefined' ? document.documentElement : null } = options
  const theme = ref(root?.dataset?.theme || null)
  let mediaQuery
  let handler

  const applyPreferred = (matches) => {
    if (!root) return
    if (root.dataset.theme) {
      theme.value = root.dataset.theme
      return
    }
    const next = matches ? 'dark' : 'light'
    root.dataset.theme = next
    theme.value = next
  }

  const setup = () => {
    if (typeof window === 'undefined' || !root) return
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    applyPreferred(mediaQuery.matches)
    handler = (e) => applyPreferred(e.matches)
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handler)
    else mediaQuery.addListener(handler)
  }

  const teardown = () => {
    if (!mediaQuery || !handler) return
    if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handler)
    else mediaQuery.removeListener(handler)
  }

  const setTheme = (value) => {
    if (!root) return
    if (!value) {
      applyPreferred(mediaQuery ? mediaQuery.matches : false)
      return
    }
    root.dataset.theme = value
    theme.value = value
  }

  const instance = getCurrentInstance()
  if (instance) {
    onMounted(setup)
    onUnmounted(() => {
      teardown()
    })
  } else {
    setup()
  }

  return { theme, setTheme, stop: teardown }
}
