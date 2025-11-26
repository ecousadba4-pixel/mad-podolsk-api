import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useBodyClass } from './useBodyClass.js'

/**
 * Управление состоянием модального окна + побочные эффекты (esc, запрет скролла body).
 */
export function useModal(initialVisible = false, options = {}) {
  const { lockScroll = true, closeOnEsc = true } = options
  const isOpen = ref(initialVisible)
  const { set: setBodyClass } = useBodyClass('modal-open', isOpen)

  const close = () => { isOpen.value = false }
  const open = () => { isOpen.value = true }
  const toggle = () => { isOpen.value = !isOpen.value }

  const handleKey = (e) => {
    if (!closeOnEsc || !isOpen.value) return
    if (e.key === 'Escape') close()
  }

  watch(isOpen, (value) => {
    if (!lockScroll) return
    setBodyClass(value)
  }, { immediate: true })

  onMounted(() => {
    window.addEventListener('keydown', handleKey)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKey)
    if (lockScroll) setBodyClass(false)
  })

  return { isOpen, open, close, toggle }
}
