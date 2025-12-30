import { onScopeDispose, ref, watchEffect } from 'vue'
import { useBodyClass } from './useBodyClass.js'

/**
 * Управление состоянием модального окна + побочные эффекты (esc, запрет скролла body).
 * @param {boolean} [initialVisible=false] - начальное состояние
 * @param {Object} [options] - опции
 * @param {boolean} [options.lockScroll=true] - блокировать скролл body
 * @param {boolean} [options.closeOnEsc=true] - закрывать по Escape
 */
export function useModal(initialVisible = false, options = {}) {
  const { lockScroll = true, closeOnEsc = true } = options
  const isOpen = ref(initialVisible)
  const { set: setBodyClass } = useBodyClass('modal-open', isOpen)

  const close = () => { isOpen.value = false }
  const open = () => { isOpen.value = true }
  const toggle = () => { isOpen.value = !isOpen.value }

  // Обработчик Escape - вынесен для корректного удаления
  const handleKey = (e) => {
    if (!closeOnEsc || !isOpen.value) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  // watchEffect автоматически отслеживает зависимости и выполняется сразу
  watchEffect(() => {
    if (lockScroll) {
      setBodyClass(isOpen.value)
    }
  })

  // Добавляем слушатель сразу (не только при mounted)
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKey)
  }

  // Очистка через onScopeDispose - работает и в setup, и в composables
  onScopeDispose(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKey)
    }
    if (lockScroll) setBodyClass(false)
  })

  return { isOpen, open, close, toggle }
}
