import { getCurrentInstance, onMounted, onUnmounted, ref, type Ref } from 'vue'

type Theme = 'light' | 'dark' | string | null

export interface UsePreferredThemeOptions {
  root?: HTMLElement | null
}

export interface UsePreferredThemeReturn {
  theme: Ref<Theme>
  setTheme: (value: Theme) => void
  stop: () => void
}

/**
 * Синхронизация темы с системным предпочтением
 */
export function usePreferredTheme(
  options: UsePreferredThemeOptions = {}
): UsePreferredThemeReturn {
  const { root = typeof document !== 'undefined' ? document.documentElement : null } = options
  const theme = ref<Theme>(root?.dataset?.theme || null)
  
  let mediaQuery: MediaQueryList | undefined
  let handler: ((e: MediaQueryListEvent) => void) | undefined

  const applyPreferred = (matches: boolean): void => {
    if (!root) return
    if (root.dataset.theme) {
      theme.value = root.dataset.theme
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
    
    handler = (e: MediaQueryListEvent) => applyPreferred(e.matches)
    mediaQuery.addEventListener('change', handler)
  }

  const teardown = (): void => {
    if (!mediaQuery || !handler) return
    mediaQuery.removeEventListener('change', handler)
  }

  const setTheme = (value: Theme): void => {
    if (!root) return
    if (!value) {
      applyPreferred(mediaQuery?.matches ?? false)
      return
    }
    root.dataset.theme = value
    theme.value = value
  }

  const instance = getCurrentInstance()
  if (instance) {
    onMounted(setup)
    onUnmounted(teardown)
  } else {
    setup()
  }

  return { theme, setTheme, stop: teardown }
}
