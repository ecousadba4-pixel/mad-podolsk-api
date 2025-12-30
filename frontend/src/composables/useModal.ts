import { onScopeDispose, ref, watchEffect, type Ref } from 'vue'
import { useBodyClass } from './useBodyClass'

export interface UseModalOptions {
  /** Блокировать скролл body при открытии */
  lockScroll?: boolean
  /** Закрывать по Escape */
  closeOnEsc?: boolean
}

export interface UseModalReturn {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Управление состоянием модального окна + побочные эффекты
 */
export function useModal(
  initialVisible = false, 
  options: UseModalOptions = {}
): UseModalReturn {
  const { lockScroll = true, closeOnEsc = true } = options
  const isOpen = ref(initialVisible)
  const { set: setBodyClass } = useBodyClass('modal-open', isOpen)

  const close = (): void => { isOpen.value = false }
  const open = (): void => { isOpen.value = true }
  const toggle = (): void => { isOpen.value = !isOpen.value }

  // Обработчик Escape
  const handleKey = (e: KeyboardEvent): void => {
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
