import { ref, nextTick, onMounted, onBeforeUnmount, watch, type Ref, type ComputedRef } from 'vue'

export interface TitleItem {
  title?: string
  description?: string
  work_name?: string
  [key: string]: unknown
}

export interface UseTitleExpansionReturn {
  idFor: (item: TitleItem, idx: number) => string
  registerTitleRef: (el: HTMLElement | null, id: string) => void
  isExpanded: (id: string) => boolean
  isClamped: (id: string) => boolean
  toggleExpand: (id: string) => void
  checkClamped: () => void
  collapseAll: () => void
}

/**
 * Composable для управления раскрытием/сворачиванием обрезанного текста.
 * Автоматически определяет, какие элементы обрезаны (clamped) и позволяет их раскрывать.
 */
export function useTitleExpansion(
  itemsRef?: Ref<TitleItem[]> | ComputedRef<TitleItem[]>
): UseTitleExpansionReturn {
  const expanded = ref<Set<string>>(new Set())
  const clamped = ref<Record<string, boolean>>({})
  const titleEls = new Map<string, HTMLElement>()

  /**
   * Генерирует уникальный ID для элемента
   */
  function idFor(item: TitleItem, idx: number): string {
    return `${idx}-${String(item.title || item.description || item.work_name || '')}`
  }

  /**
   * Регистрирует ref элемента для отслеживания
   */
  function registerTitleRef(el: HTMLElement | null, id: string): void {
    if (el) titleEls.set(id, el)
    else titleEls.delete(id)
  }

  /**
   * Проверяет, раскрыт ли элемент
   */
  function isExpanded(id: string): boolean {
    return expanded.value.has(id)
  }

  /**
   * Проверяет, обрезан ли текст элемента
   */
  function isClamped(id: string): boolean {
    return Boolean(clamped.value[id])
  }

  /**
   * Переключает состояние раскрытия элемента
   */
  function toggleExpand(id: string): void {
    const s = new Set(expanded.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    expanded.value = s
  }

  /**
   * Проверяет все зарегистрированные элементы на обрезку текста
   */
  function checkClamped(): void {
    nextTick(() => {
      const result: Record<string, boolean> = {}
      try {
        for (const [id, el] of titleEls.entries()) {
          if (!el) continue
          const tolerance = 2
          const fullH = el.scrollHeight || el.offsetHeight || 0
          const visibleH = el.clientHeight || el.offsetHeight || 0
          result[id] = fullH > (visibleH + tolerance)
        }
      } catch {
        // ignore
      }
      clamped.value = result
    })
  }

  /**
   * Сбрасывает все раскрытые элементы
   */
  function collapseAll(): void {
    expanded.value = new Set()
  }

  onMounted(() => {
    checkClamped()
    window.addEventListener('resize', checkClamped)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkClamped)
  })

  // Перепроверяем при изменении списка
  if (itemsRef) {
    watch(itemsRef, () => {
      checkClamped()
    })
  }

  return {
    idFor,
    registerTitleRef,
    isExpanded,
    isClamped,
    toggleExpand,
    checkClamped,
    collapseAll
  }
}
