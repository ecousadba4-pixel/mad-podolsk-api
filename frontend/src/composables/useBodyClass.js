import { onMounted, onUnmounted, watch } from 'vue'

/**
 * Добавляет/удаляет CSS-класс на <body>. Если передать реактивный флаг,
 * класс будет синхронизирован с его значением.
 */
export function useBodyClass(className, activeRef = null) {
  const apply = (value) => {
    const body = typeof document !== 'undefined' ? document.body : null
    if (!body) return
    if (value) body.classList.add(className)
    else body.classList.remove(className)
  }

  if (activeRef) {
    watch(activeRef, apply, { immediate: true })
  } else {
    onMounted(() => apply(true))
  }

  onUnmounted(() => apply(false))

  return { set: apply }
}
