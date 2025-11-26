import { computed, ref, unref } from 'vue'

/**
 * Управление сортировкой: ключ + направление + готовый отсортированный список.
 */
export function useSort(items, options = {}) {
  const { initialKey = null, initialDir = -1, compare } = options
  const sortKey = ref(initialKey)
  const sortDir = ref(initialDir)

  const setSort = (key, dir = sortDir.value) => {
    if (key) sortKey.value = key
    if (typeof dir === 'number') sortDir.value = dir
  }

  const toggleSort = (key) => {
    if (sortKey.value === key) {
      sortDir.value = -sortDir.value
    } else {
      sortKey.value = key
      sortDir.value = initialDir || -1
    }
    return { key: sortKey.value, dir: sortDir.value }
  }

  const sortedItems = computed(() => {
    const list = unref(items) || []
    if (!sortKey.value) return list
    const sorter = compare || ((a, b, key, dir) => {
      const va = Number(a?.[key] || 0)
      const vb = Number(b?.[key] || 0)
      const diff = va - vb
      return diff === 0 ? 0 : dir * Math.sign(diff)
    })
    return [...list].sort((a, b) => sorter(a, b, sortKey.value, sortDir.value))
  })

  return { sortKey, sortDir, sortedItems, setSort, toggleSort }
}
