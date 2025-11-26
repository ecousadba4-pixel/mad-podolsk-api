import { ref } from 'vue'

/**
 * Унифицированный helper для загрузки данных: data + loading + error + execute().
 * loader должен возвращать данные (любого типа) или выбрасывать ошибку.
 */
export function useAsyncData(loader, options = {}) {
  const { immediate = false, initialValue = null } = options
  const data = ref(initialValue)
  const loading = ref(false)
  const error = ref(null)

  const execute = async (...args) => {
    loading.value = true
    error.value = null
    try {
      const result = await loader(...args)
      data.value = result
      return result
    } catch (err) {
      const msg = err?.message || 'Не удалось загрузить данные'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  if (immediate) execute()

  return { data, loading, error, execute }
}
