import { ref, onMounted, onUnmounted } from 'vue'

// Composable: useIsMobile
// Returns a reactive `isMobile` ref that tracks `(max-width: 767px)`.
// Works in SSR-safe way (checks window existence).
export function useIsMobile() {
  const isMobile = ref(false)
  let mq = null
  let handler = null

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mq = window.matchMedia('(max-width: 767px)')
    isMobile.value = mq.matches
    handler = (e) => { isMobile.value = e.matches }
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
  })

  onUnmounted(() => {
    if (!mq || !handler) return
    if (mq.removeEventListener) mq.removeEventListener('change', handler)
    else mq.removeListener(handler)
  })

  return { isMobile }
}
