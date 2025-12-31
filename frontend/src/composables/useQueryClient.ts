import { computed, inject, onScopeDispose, ref, unref, watch, type App, type ComputedRef, type Ref } from 'vue'
import { handleError } from './useErrorHandler'

const QUERY_CLIENT_KEY = Symbol('query-client')

const now = () => Date.now()
const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

type QueryKey = string | string[] | (() => string | string[])
type QueryStatus = 'idle' | 'loading' | 'success' | 'error' | 'refetching'

function normalizeKey(key: QueryKey): string {
  if (typeof key === 'function') return normalizeKey(key())
  if (Array.isArray(key)) return JSON.stringify(key)
  return String(key)
}

interface CacheEntry<T = unknown> {
  data: Ref<T | null>
  error: Ref<Error | null>
  status: Ref<QueryStatus>
  updatedAt: Ref<number>
  promise: Promise<T> | null
}

export interface QueryClientOptions {
  staleTime?: number
  retry?: number
  retryDelay?: number | ((attempt: number) => number)
  refetchOnWindowFocus?: boolean
  /** Показывать toast при ошибках запросов */
  showErrorToasts?: boolean
}

export interface UseQueryOptions<T = unknown> {
  queryKey: QueryKey
  queryFn: () => Promise<T>
  enabled?: boolean | Ref<boolean> | ComputedRef<boolean>
  staleTime?: number
  refetchOnWindowFocus?: boolean
  keepPreviousData?: boolean
  /** Показывать toast при ошибке (переопределяет глобальную настройку) */
  showErrorToast?: boolean
  /** Callback при ошибке */
  onError?: (error: Error) => void
}

export interface UseQueryReturn<T = unknown> {
  data: ComputedRef<T | null>
  error: ComputedRef<Error | null>
  isLoading: ComputedRef<boolean>
  isFetching: ComputedRef<boolean>
  isPreviousData: ComputedRef<boolean>
  status: ComputedRef<QueryStatus>
  refetch: () => Promise<T>
}

interface QueryClient {
  cache: Map<string, CacheEntry>
  useQuery: <T>(opts: UseQueryOptions<T>) => UseQueryReturn<T>
  invalidateQueries: (matcher?: string | string[] | ((key: string) => boolean)) => void
}

function createQueryClient(defaultOptions: QueryClientOptions = {}): QueryClient {
  // Use a plain Map here. Using `reactive(new Map())` makes Vue unwrap
  // nested refs inside stored values, turning `status: ref('idle')`
  // into the raw string `'idle'`. Storing refs inside a plain Map preserves them correctly.
  const cache = new Map<string, CacheEntry>()
  
  const defaults: Required<Omit<QueryClientOptions, 'showErrorToasts'>> & { showErrorToasts: boolean } = {
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt: number) => 500 * (attempt + 1),
    refetchOnWindowFocus: true,
    showErrorToasts: true,
    ...defaultOptions
  }

  function getEntry<T>(key: string): CacheEntry<T> {
    const id = normalizeKey(key)
    if (!cache.has(id)) {
      cache.set(id, {
        data: ref(null),
        error: ref(null),
        status: ref<QueryStatus>('idle'),
        updatedAt: ref(0),
        promise: null
      })
    }
    return cache.get(id) as CacheEntry<T>
  }

  async function execute<T>(
    entry: CacheEntry<T>, 
    _key: string, 
    queryFn: () => Promise<T>, 
    options: Partial<QueryClientOptions>
  ): Promise<T> {
    const retry = options.retry ?? defaults.retry
    const retryDelay = options.retryDelay ?? defaults.retryDelay
    entry.status.value = entry.status.value === 'success' ? 'refetching' : 'loading'
    entry.error.value = null

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const result = await queryFn()
        entry.data.value = result
        entry.status.value = 'success'
        entry.updatedAt.value = now()
        return result
      } catch (err) {
        entry.error.value = err as Error
        if (attempt >= retry) {
          entry.status.value = 'error'
          throw err
        }
        const delay = typeof retryDelay === 'function' ? retryDelay(attempt) : retryDelay
        await wait(delay || 0)
      }
    }
    return entry.data.value as T
  }

  function invalidateQueries(matcher?: string | string[] | ((key: string) => boolean)): void {
    const match = (key: string): boolean => {
      if (!matcher) return true
      if (typeof matcher === 'string') return normalizeKey(key).startsWith(normalizeKey(matcher))
      if (Array.isArray(matcher)) return normalizeKey(key).startsWith(normalizeKey(matcher))
      if (typeof matcher === 'function') return matcher(key)
      return false
    }
    for (const key of Array.from(cache.keys())) {
      if (match(key)) cache.delete(key)
    }
  }

  function useQuery<T>(opts: UseQueryOptions<T>): UseQueryReturn<T> {
    const { 
      queryKey, 
      queryFn, 
      enabled = true, 
      staleTime, 
      refetchOnWindowFocus, 
      keepPreviousData = true,
      showErrorToast,
      onError 
    } = opts
    
    const resolvedEnabled = computed(() => Boolean(unref(enabled)))
    const keyRef = computed(() => normalizeKey(unref(queryKey)))
    const entry = computed(() => getEntry<T>(keyRef.value))
    const staleFor = computed(() => staleTime ?? defaults.staleTime)
    
    // Определяем показывать ли toast (опция запроса имеет приоритет)
    const shouldShowToast = showErrorToast ?? defaults.showErrorToasts

    // Сохраняем предыдущие данные для плавного перехода между ключами
    const previousData = ref<T | null>(null)
    const previousKey = ref<string | null>(null)

    const isStale = computed(() => (now() - entry.value.updatedAt.value) > staleFor.value)

    const triggerFetch = (): Promise<T | null> => {
      if (!resolvedEnabled.value) return Promise.resolve(entry.value.data.value)
      if (entry.value.promise && !isStale.value) return entry.value.promise
      entry.value.promise = execute(entry.value, keyRef.value, queryFn, { staleTime, refetchOnWindowFocus })
        .catch((err: Error) => {
          // Вызываем callback если задан
          onError?.(err)
          // Показываем toast если включено
          if (shouldShowToast) {
            handleError(err, { showToast: true, logToConsole: false })
          }
          return null as T
        })
      return entry.value.promise
    }

    if (resolvedEnabled.value) triggerFetch()

    watch([keyRef, resolvedEnabled], ([newKey], [oldKey]) => {
      // Сохраняем предыдущие данные перед переключением на новый ключ
      if (keepPreviousData && oldKey && newKey !== oldKey) {
        const oldEntry = cache.get(oldKey as string)
        if (oldEntry && oldEntry.data.value !== null) {
          previousData.value = oldEntry.data.value as T
          previousKey.value = oldKey as string
        }
      }
      triggerFetch()
    })

    if (refetchOnWindowFocus ?? defaults.refetchOnWindowFocus) {
      const handler = (): void => {
        if (document.visibilityState === 'visible') triggerFetch()
      }
      window.addEventListener('visibilitychange', handler)
      onScopeDispose(() => window.removeEventListener('visibilitychange', handler))
    }

    // Возвращаем актуальные данные или предыдущие (если текущие ещё загружаются)
    const data = computed<T | null>(() => {
      const current = entry.value.data.value
      if (current !== null) {
        // Сбрасываем предыдущие данные, когда текущие загрузились
        if (previousData.value !== null) {
          previousData.value = null
          previousKey.value = null
        }
        return current
      }
      // Показываем предыдущие данные пока загружаются новые
      if (keepPreviousData && previousData.value !== null) {
        return previousData.value
      }
      return null
    })
    
    // isPreviousData - показывает, что сейчас отображаются старые данные
    const isPreviousData = computed(() => {
      return entry.value.data.value === null && previousData.value !== null
    })
    
    const error = computed(() => entry.value.error.value)
    const isLoading = computed(() => entry.value.status.value === 'loading' || entry.value.status.value === 'idle')
    const isFetching = computed(() => entry.value.status.value === 'loading' || entry.value.status.value === 'refetching')

    const refetch = (): Promise<T> => execute(entry.value, keyRef.value, queryFn, { staleTime, refetchOnWindowFocus })

    return { 
      data, 
      error, 
      isLoading, 
      isFetching, 
      isPreviousData, 
      status: computed(() => entry.value.status.value), 
      refetch 
    }
  }

  return { cache, useQuery, invalidateQueries }
}

export function installQueryClient(app: App, options: QueryClientOptions = {}): QueryClient {
  const client = createQueryClient(options)
  app.provide(QUERY_CLIENT_KEY, client)
  return client
}

export function useQueryClient(): QueryClient {
  const client = inject<QueryClient>(QUERY_CLIENT_KEY)
  if (!client) throw new Error('Query client not found. Make sure installQueryClient() is used in main.js')
  return client
}

export function useQuery<T = unknown>(opts: UseQueryOptions<T>): UseQueryReturn<T> {
  return useQueryClient().useQuery(opts)
}

export function useInvalidateQueries(): QueryClient['invalidateQueries'] {
  return useQueryClient().invalidateQueries
}
