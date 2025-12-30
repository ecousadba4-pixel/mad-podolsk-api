import { ref, shallowRef, onScopeDispose } from 'vue'

/**
 * Унифицированный helper для загрузки данных: data + loading + error + execute().
 * loader должен возвращать данные (любого типа) или выбрасывать ошибку.
 * 
 * @template T
 * @param {(...args: any[]) => Promise<T>} loader - функция загрузки данных
 * @param {Object} options - опции
 * @param {boolean} [options.immediate=false] - выполнить загрузку сразу
 * @param {T|null} [options.initialValue=null] - начальное значение
 * @param {boolean} [options.shallow=false] - использовать shallowRef для больших объектов
 * @returns {{ data: import('vue').Ref<T|null>, loading: import('vue').Ref<boolean>, error: import('vue').Ref<string|null>, execute: (...args: any[]) => Promise<T>, abort: () => void }}
 */
export function useAsyncData(loader, options = {}) {
  const { immediate = false, initialValue = null, shallow = false } = options
  
  // shallowRef для больших массивов/объектов предотвращает глубокую реактивность
  const data = shallow ? shallowRef(initialValue) : ref(initialValue)
  const loading = ref(false)
  const error = ref(null)
  
  // AbortController для отмены текущего запроса
  let abortController = null

  const abort = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const execute = async (...args) => {
    // Отменяем предыдущий запрос если он ещё выполняется
    abort()
    
    abortController = new AbortController()
    const signal = abortController.signal
    
    loading.value = true
    error.value = null
    
    try {
      const result = await loader(...args, { signal })
      
      // Проверяем что запрос не был отменён
      if (signal.aborted) return data.value
      
      data.value = result
      return result
    } catch (err) {
      // Игнорируем ошибки отмены
      if (err?.name === 'AbortError') return data.value
      
      const msg = err?.message || 'Не удалось загрузить данные'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  // Отменяем запросы при размонтировании компонента
  onScopeDispose(abort)

  if (immediate) execute()

  return { data, loading, error, execute, abort }
}
