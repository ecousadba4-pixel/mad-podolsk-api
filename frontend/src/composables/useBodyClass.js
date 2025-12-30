import { onScopeDispose, watchEffect } from 'vue'

/**
 * Добавляет/удаляет CSS-класс на <body>. Если передать реактивный флаг,
 * класс будет синхронизирован с его значением.
 * 
 * @param {string} className - имя CSS класса
 * @param {import('vue').Ref<boolean>|null} activeRef - реактивный флаг
 * @returns {{ set: (value: boolean) => void }}
 */
export function useBodyClass(className, activeRef = null) {
  const apply = (value) => {
    if (typeof document === 'undefined') return
    const { body } = document
    if (!body) return
    body.classList.toggle(className, Boolean(value))
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
