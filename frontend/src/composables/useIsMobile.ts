import { shallowRef, readonly, type DeepReadonly, type ShallowRef } from 'vue'

/**
 * Composable для определения мобильного viewport
 * Singleton pattern: single matchMedia listener shared across all components
 */

const isMobile: ShallowRef<boolean> = shallowRef(false)
let initialized = false

function init(): void {
  if (initialized || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }
  
  initialized = true
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  
  // Single listener for the entire app — no cleanup needed (lives for app lifetime)
  mq.addEventListener('change', (e: MediaQueryListEvent) => { 
    isMobile.value = e.matches 
  })
}

export interface UseIsMobileReturn {
  isMobile: DeepReadonly<ShallowRef<boolean>>
}

export function useIsMobile(): UseIsMobileReturn {
  init()
  return { isMobile: readonly(isMobile) }
}
