import { ref } from 'vue'

export function useSmetaSorting(initialKey = 'plan', initialDir = -1) {
  const sortKey = ref(initialKey)
  const sortDir = ref(initialDir)

  function setSort(key) {
    if (!key) return
    if (sortKey.value === key) {
      sortDir.value = sortDir.value * -1
    } else {
      sortKey.value = key
      sortDir.value = -1
    }
  }

  return {
    sortKey,
    sortDir,
    setSort,
  }
}
