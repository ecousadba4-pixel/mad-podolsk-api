import { computed, shallowRef, unref } from 'vue'

/**
 * @template T
 * @typedef {Object} UseSortOptions
 * @property {string|null} [initialKey=null] - начальный ключ сортировки
 * @property {1|-1} [initialDir=-1] - начальное направление (1 = asc, -1 = desc)
 * @property {(a: T, b: T, key: string, dir: 1|-1) => number} [compare] - кастомная функция сравнения
 */

/**
 * @template T
 * @typedef {Object} UseSortReturn
 * @property {import('vue').ShallowRef<string|null>} sortKey - текущий ключ сортировки
 * @property {import('vue').ShallowRef<1|-1>} sortDir - текущее направление
 * @property {import('vue').ComputedRef<T[]>} sortedItems - отсортированный список
 * @property {(key: string, dir?: 1|-1) => void} setSort - установить сортировку
 * @property {(key: string) => { key: string, dir: 1|-1 }} toggleSort - переключить сортировку
 */

/**
 * Управление сортировкой: ключ + направление + готовый отсортированный список.
 * Использует shallowRef для минимизации реактивных обновлений.
 * 
 * @template T
 * @param {import('vue').Ref<T[]>|T[]|(() => T[])} items - элементы для сортировки
 * @param {UseSortOptions<T>} [options={}] - опции
 * @returns {UseSortReturn<T>}
 * 
 * @example
 * const { sortKey, sortDir, sortedItems, toggleSort } = useSort(
 *   () => props.items,
 *   { initialKey: 'amount', initialDir: -1 }
 * )
 */
export function useSort(items, options = {}) {
  const { initialKey = null, initialDir = -1, compare } = options
  
  /** @type {import('vue').ShallowRef<string|null>} */
  const sortKey = shallowRef(initialKey)
  
  /** @type {import('vue').ShallowRef<1|-1>} */
  const sortDir = shallowRef(initialDir)

  /**
   * Устанавливает ключ и/или направление сортировки
   * @param {string} key 
   * @param {1|-1} [dir] 
   */
  const setSort = (key, dir = sortDir.value) => {
    if (key) sortKey.value = key
    if (typeof dir === 'number') sortDir.value = dir
  }

  /**
   * Переключает сортировку: меняет направление если тот же ключ, иначе устанавливает новый
   * @param {string} key 
   * @returns {{ key: string, dir: 1|-1 }}
   */
  const toggleSort = (key) => {
    if (sortKey.value === key) {
      sortDir.value = /** @type {1|-1} */ (-sortDir.value)
    } else {
      sortKey.value = key
      sortDir.value = initialDir || -1
    }
    return { key: sortKey.value, dir: sortDir.value }
  }

  /**
   * Сравнение по умолчанию для числовых значений
   * @param {T} a 
   * @param {T} b 
   * @param {string} key 
   * @param {1|-1} dir 
   * @returns {number}
   */
  const defaultCompare = (a, b, key, dir) => {
    const va = Number(a?.[key] ?? 0)
    const vb = Number(b?.[key] ?? 0)
    if (va === vb) return 0
    return dir * (va > vb ? 1 : -1)
  }

  const sortedItems = computed(() => {
    // Поддерживаем ref/array или getter function
    let list
    if (typeof items === 'function') {
      list = unref(items()) ?? []
    } else {
      list = unref(items) ?? []
    }
    
    if (!sortKey.value || !list.length) return list
    
    const sorter = compare ?? defaultCompare
    
    // Используем toSorted в современных браузерах (не мутирует оригинал)
    if (typeof list.toSorted === 'function') {
      return list.toSorted((a, b) => sorter(a, b, sortKey.value, sortDir.value))
    }
    
    return [...list].sort((a, b) => sorter(a, b, sortKey.value, sortDir.value))
  })

  return { sortKey, sortDir, sortedItems, setSort, toggleSort }
}
