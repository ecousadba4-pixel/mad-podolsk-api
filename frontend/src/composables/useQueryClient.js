import { computed, inject, onScopeDispose, provide, reactive, ref, unref, watch } from 'vue'

const QUERY_CLIENT_KEY = Symbol('query-client')

const now = () => Date.now()
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function normalizeKey(key) {
  if (typeof key === 'function') return normalizeKey(key())
  if (Array.isArray(key)) return JSON.stringify(key)
  return String(key)
}

function createQueryClient(defaultOptions = {}) {
  const cache = reactive(new Map())
  const defaults = {
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attempt => 500 * (attempt + 1),
    refetchOnWindowFocus: true,
    ...defaultOptions
  }

  function getEntry(key) {
    const id = normalizeKey(key)
    if (!cache.has(id)) {
      cache.set(id, {
        data: ref(null),
        error: ref(null),
        status: ref('idle'),
        updatedAt: ref(0),
        promise: null
      })
    }
    return cache.get(id)
  }

  async function execute(entry, key, queryFn, options) {
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
        entry.error.value = err
        if (attempt >= retry) {
          entry.status.value = 'error'
          throw err
        }
        const delay = typeof retryDelay === 'function' ? retryDelay(attempt) : retryDelay
        await wait(delay || 0)
      }
    }
    return entry.data.value
  }

  function invalidateQueries(matcher) {
    const match = (key) => {
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

  function useQuery({ queryKey, queryFn, enabled = true, staleTime, refetchOnWindowFocus }) {
    const resolvedEnabled = computed(() => Boolean(unref(enabled)))
    const keyRef = computed(() => normalizeKey(unref(queryKey)))
    const entry = computed(() => getEntry(keyRef.value))
    const staleFor = computed(() => (staleTime ?? defaults.staleTime))

    const isStale = computed(() => (now() - entry.value.updatedAt.value) > staleFor.value)

    const triggerFetch = () => {
      if (!resolvedEnabled.value) return Promise.resolve(entry.value.data.value)
      if (entry.value.promise && !isStale.value) return entry.value.promise
      entry.value.promise = execute(entry.value, keyRef.value, queryFn, { staleTime, refetchOnWindowFocus })
      return entry.value.promise
    }

    if (resolvedEnabled.value) triggerFetch()

    watch([keyRef, resolvedEnabled], () => {
      triggerFetch()
    })

    if (refetchOnWindowFocus ?? defaults.refetchOnWindowFocus) {
      const handler = () => {
        if (document.visibilityState === 'visible') triggerFetch()
      }
      window.addEventListener('visibilitychange', handler)
      onScopeDispose(() => window.removeEventListener('visibilitychange', handler))
    }

    const data = computed(() => entry.value.data.value)
    const error = computed(() => entry.value.error.value)
    const isLoading = computed(() => entry.value.status.value === 'loading' || entry.value.status.value === 'idle')
    const isFetching = computed(() => entry.value.status.value === 'loading' || entry.value.status.value === 'refetching')

    const refetch = () => execute(entry.value, keyRef.value, queryFn, { staleTime, refetchOnWindowFocus })

    return { data, error, isLoading, isFetching, status: computed(() => entry.value.status.value), refetch }
  }

  return { cache, useQuery, invalidateQueries }
}

export function installQueryClient(app, options = {}) {
  const client = createQueryClient(options)
  app.provide(QUERY_CLIENT_KEY, client)
  provide(QUERY_CLIENT_KEY, client)
  return client
}

export function useQueryClient() {
  const client = inject(QUERY_CLIENT_KEY)
  if (!client) throw new Error('Query client not found. Make sure installQueryClient() is used in main.js')
  return client
}

export function useQuery(opts) {
  return useQueryClient().useQuery(opts)
}

export function useInvalidateQueries() {
  return useQueryClient().invalidateQueries
}

