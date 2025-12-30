import { computed, shallowRef, unref, type ComputedRef, type Ref, type ShallowRef } from 'vue'
import type { SortDirection } from '@/types/dashboard'

export type SortCompareFn<T> = (a: T, b: T, key: string, dir: SortDirection) => number

export interface UseSortOptions<T> {
  /** Начальный ключ сортировки */
  initialKey?: string | null
  /** Начальное направление (1 = asc, -1 = desc) */
  initialDir?: SortDirection
  /** Кастомная функция сравнения */
  compare?: SortCompareFn<T>
}

export interface UseSortReturn<T> {
  sortKey: ShallowRef<string | null>
  sortDir: ShallowRef<SortDirection>
  sortedItems: ComputedRef<T[]>
  setSort: (key: string, dir?: SortDirection) => void
  toggleSort: (key: string) => { key: string; dir: SortDirection }
}

type ItemsInput<T> = Ref<T[]> | T[] | (() => T[])

/**
 * Управление сортировкой: ключ + направление + готовый отсортированный список
 */
export function useSort<T extends Record<string, unknown>>(
  items: ItemsInput<T>,
  options: UseSortOptions<T> = {}
): UseSortReturn<T> {
  const { initialKey = null, initialDir = -1, compare } = options
  
  const sortKey = shallowRef<string | null>(initialKey)
  const sortDir = shallowRef<SortDirection>(initialDir)

  /**
   * Устанавливает ключ и/или направление сортировки
   */
  const setSort = (key: string, dir: SortDirection = sortDir.value): void => {
    if (key) sortKey.value = key
    if (typeof dir === 'number') sortDir.value = dir
  }

  /**
   * Переключает сортировку: меняет направление если тот же ключ
   */
  const toggleSort = (key: string): { key: string; dir: SortDirection } => {
    if (sortKey.value === key) {
      sortDir.value = (sortDir.value === 1 ? -1 : 1) as SortDirection
    } else {
      sortKey.value = key
      sortDir.value = initialDir || -1
    }
    return { key: sortKey.value!, dir: sortDir.value }
  }

  /**
   * Сравнение по умолчанию для числовых значений
   */
  const defaultCompare: SortCompareFn<T> = (a, b, key, dir) => {
    const va = Number(a?.[key] ?? 0)
    const vb = Number(b?.[key] ?? 0)
    if (va === vb) return 0
    return dir * (va > vb ? 1 : -1)
  }

  const sortedItems = computed<T[]>(() => {
    // Поддерживаем ref/array или getter function
    let list: T[]
    if (typeof items === 'function') {
      list = unref(items()) ?? []
    } else {
      list = unref(items) ?? []
    }
    
    if (!sortKey.value || !list.length) return list
    
    const sorter = compare ?? defaultCompare
    const key = sortKey.value
    const dir = sortDir.value
    
    // Используем toSorted в современных браузерах (не мутирует оригинал)
    if (typeof (list as unknown as { toSorted: unknown }).toSorted === 'function') {
      return (list as unknown as { toSorted: (fn: (a: T, b: T) => number) => T[] })
        .toSorted((a, b) => sorter(a, b, key, dir))
    }
    
    return [...list].sort((a, b) => sorter(a, b, key, dir))
  })

  return { sortKey, sortDir, sortedItems, setSort, toggleSort }
}
