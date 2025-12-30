import { onScopeDispose, watchEffect, type Ref } from 'vue'

/**
 * Добавляет/удаляет CSS-класс на <body>
 */
export function useBodyClass(className: string, activeRef: Ref<boolean> | null = null) {
  const apply = (value: boolean): void => {
    if (typeof document === 'undefined') return
    const { body } = document
    if (!body) return
    body.classList.toggle(className, value)
  }

  if (activeRef) {
    // watchEffect автоматически отслеживает activeRef.value
    watchEffect(() => {
      apply(activeRef.value)
    })
  }

  // Используем onScopeDispose вместо onUnmounted - работает и в setup, и в composables
  onScopeDispose(() => apply(false))

  return { set: apply }
}
