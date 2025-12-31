import { getCurrentInstance, onMounted, onUnmounted, ref, type Ref } from 'vue'

type Theme = 'light' | 'dark' | string | null

export interface UsePreferredThemeOptions {
  root?: HTMLElement | null
  storageKey?: string
}

export interface UsePreferredThemeReturn {
  theme: Ref<Theme>
  setTheme: (value: Theme) => void
  toggleTheme: () => void
  stop: () => void
}

const STORAGE_KEY = 'theme-preference'

/**
 * Синхронизация темы с системным предпочтением и localStorage
 */
export function usePreferredTheme(
  options: UsePreferredThemeOptions = {}
): UsePreferredThemeReturn {
  const { 
    root = typeof document !== 'undefined' ? document.documentElement : null,
    storageKey = STORAGE_KEY
  } = options
  const theme = ref<Theme>(root?.dataset?.theme || null)
  
  let mediaQuery: MediaQueryList | undefined
  let handler: ((e: MediaQueryListEvent) => void) | undefined

  /** Чтение сохранённой темы из localStorage */
  const getStoredTheme = (): Theme => {
    if (typeof localStorage === 'undefined') return null
    try {
      return localStorage.getItem(storageKey) as Theme
    } catch {
      return null
    }
  }

  /** Сохранение темы в localStorage */
  const storeTheme = (value: Theme): void => {
    if (typeof localStorage === 'undefined') return
    try {
      if (value) {
        localStorage.setItem(storageKey, value)
      } else {
        localStorage.removeItem(storageKey)
      }
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
  }

  /** Применение темы на основе системных предпочтений (если нет сохранённой) */
  const applyPreferred = (matches: boolean): void => {
    if (!root) return
    const stored = getStoredTheme()
    if (stored) {
      root.dataset.theme = stored
      theme.value = stored
      return
    }
    const next = matches ? 'dark' : 'light'
    root.dataset.theme = next
    theme.value = next
  }

  const setup = (): void => {
    if (typeof window === 'undefined' || !root) return
    
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    applyPreferred(mediaQuery.matches)
    
    handler = (e: MediaQueryListEvent) => {
      // Реагируем на изменение системной темы только если нет сохранённого выбора
      if (!getStoredTheme()) {
        applyPreferred(e.matches)
      }
    }
    mediaQuery.addEventListener('change', handler)
  }

  const teardown = (): void => {
    if (!mediaQuery || !handler) return
    mediaQuery.removeEventListener('change', handler)
  }

  /** Установка темы вручную (сохраняется в localStorage) */
  const setTheme = (value: Theme): void => {
    if (!root) return
    if (!value) {
      // Сброс на системную тему
      storeTheme(null)
      applyPreferred(mediaQuery?.matches ?? false)
      return
    }
    storeTheme(value)
    root.dataset.theme = value
    theme.value = value
  }

  /** Переключение между светлой и тёмной темой */
  const toggleTheme = (): void => {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const instance = getCurrentInstance()
  if (instance) {
    onMounted(setup)
    onUnmounted(teardown)
  } else {
    setup()
  }

  return { theme, setTheme, toggleTheme, stop: teardown }
}
