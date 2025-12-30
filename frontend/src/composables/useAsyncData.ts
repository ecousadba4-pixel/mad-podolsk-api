import { ref, shallowRef, onScopeDispose, type Ref, type ShallowRef } from 'vue'

export interface UseAsyncDataOptions<T> {
  /** Выполнить загрузку сразу */
  immediate?: boolean
  /** Начальное значение */
  initialValue?: T | null
  /** Использовать shallowRef для больших объектов */
  shallow?: boolean
}

export interface UseAsyncDataReturn<T> {
  data: Ref<T | null> | ShallowRef<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (...args: unknown[]) => Promise<T>
  abort: () => void
}

/**
 * Унифицированный helper для загрузки данных с поддержкой отмены
 */
export function useAsyncData<T>(
  loader: (...args: unknown[]) => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const { immediate = false, initialValue = null, shallow = false } = options
  
  // Используем any для обхода сложных типов Vue ref
  const data = (shallow 
    ? shallowRef(initialValue) 
    : ref(initialValue)) as Ref<T | null>
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // AbortController для отмены текущего запроса
  let abortController: AbortController | null = null

  const abort = (): void => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const execute = async (...args: unknown[]): Promise<T> => {
    // Отменяем предыдущий запрос если он ещё выполняется
    abort()
    
    abortController = new AbortController()
    const signal = abortController.signal
    
    loading.value = true
    error.value = null
    
    try {
      const result = await loader(...args, { signal })
      
      // Проверяем что запрос не был отменён
      if (signal.aborted) return data.value as T
      
      data.value = result
      return result
    } catch (err) {
      // Игнорируем ошибки отмены
      if ((err as Error)?.name === 'AbortError') return data.value as T
      
      const msg = (err as Error)?.message || 'Не удалось загрузить данные'
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
