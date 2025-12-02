import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useInvalidateQueries } from '../composables/useQueryClient.js'
import { getAvailableDates, getAvailableMonths, getBySmeta, getDaily, getLastLoaded, getMonthlySummary, getSmetaDetails, getSmetaDetailsWithTypes } from '../api/dashboard.js'

// ============================================================================
// HELPERS
// ============================================================================

function fallbackMonths() {
  const list = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(d.toISOString().slice(0, 7))
  }
  return list
}

/**
 * Нормализует данные сметных карточек
 */
function normalizeSmetaCards(raw) {
  const mapped = raw.map(c => {
    const plan = Number(c.plan) || 0
    const fact = Number(c.fact) || 0
    const pct = plan ? Math.round((fact / plan) * 100) : 0
    const delta = Number(c.delta ?? (fact - plan))
    return { ...c, delta, progressPercent: c.progressPercent ?? pct }
  })
  mapped.sort((a, b) => (Number(b.fact) || 0) - (Number(a.fact) || 0))
  return mapped
}

/**
 * Нормализует данные деталей сметы
 */
function normalizeSmetaDetails(raw) {
  return raw.map(r => {
    const title = r.title || r.description || r.work_name || r.name || ''
    const plan = Number(r.plan ?? r.planned_amount ?? r.planned ?? r.planned_amount_month ?? 0)
    const fact = Number(r.fact ?? r.fact_amount ?? r.fact_amount_done ?? r.fact_amount_month ?? 0)
    const delta = Number(r.delta ?? (fact - plan))
    const progressPercent = r.progressPercent ?? (plan ? Math.round((fact / plan) * 100) : 0)
    return { ...r, title, plan, fact, delta, progressPercent }
  })
}

/**
 * Нормализует данные дневной таблицы
 */
function normalizeDailyRows(rawRows, dateValue) {
  return rawRows.map(r => {
    const unit = r.unit || ''
    const volumeNumber = Number(r.volume || 0)
    const amount = Number(r.amount || 0)
    return {
      date: dateValue,
      name: r.description || r.name || r.work_name || '',
      unit,
      volume: `${volumeNumber}${unit ? ` (${unit})` : ''}`,
      amount
    }
  })
}

// ============================================================================
// STORE
// ============================================================================

export const useDashboardStore = defineStore('dashboard', () => {
  const invalidateQueries = useInvalidateQueries()

  // --------------------------------------------------------------------------
  // UI STATE (режим, выбранные значения)
  // --------------------------------------------------------------------------
  const mode = ref('monthly')
  const selectedMonth = ref(new Date().toISOString().slice(0, 7))
  const selectedDate = ref(new Date().toISOString().slice(0, 10))
  const selectedSmeta = ref(null)
  const selectedDescription = ref(null)

  // --------------------------------------------------------------------------
  // MONTHLY QUERIES (summary, smeta cards, smeta details)
  // --------------------------------------------------------------------------
  const availableMonthsQuery = useQuery({
    queryKey: ['available-months'],
    queryFn: async () => {
      const res = await getAvailableMonths()
      if (!res) return fallbackMonths()
      if (Array.isArray(res)) {
        const mapped = res.map(r => {
          if (!r) return null
          if (typeof r === 'string') return r.slice(0, 7)
          if (r.month) return String(r.month).slice(0, 7)
          if (r.value) return String(r.value).slice(0, 7)
          const s = JSON.stringify(r)
          const m = s.match(/\d{4}-\d{2}/)
          return m ? m[0] : null
        }).filter(Boolean)
        return mapped
      }
      return []
    },
    staleTime: 60 * 60 * 1000
  })

  const monthlySummaryQuery = useQuery({
    queryKey: () => ['monthly-summary', selectedMonth.value],
    queryFn: () => getMonthlySummary(selectedMonth.value),
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 5 * 60 * 1000
  })

  const lastLoadedQuery = useQuery({
    queryKey: () => ['last-loaded', selectedMonth.value],
    queryFn: () => getLastLoaded(selectedMonth.value),
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 60 * 1000
  })

  const smetaCardsQuery = useQuery({
    queryKey: () => ['smeta-cards', selectedMonth.value],
    queryFn: async () => {
      const res = await getBySmeta(selectedMonth.value)
      const raw = (res && res.cards) || []
      return normalizeSmetaCards(raw)
    },
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  const smetaDetailsQuery = useQuery({
    queryKey: () => ['smeta-details', selectedMonth.value, selectedSmeta.value],
    queryFn: async () => {
      const res = await getSmetaDetails(selectedMonth.value, selectedSmeta.value)
      const raw = (res && res.rows) || []
      return normalizeSmetaDetails(raw)
    },
    enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(selectedMonth.value)),
    staleTime: 2 * 60 * 1000
  })

  const smetaDetailsWithTypesQuery = useQuery({
    queryKey: () => ['smeta-details-with-types', selectedMonth.value, selectedSmeta.value],
    queryFn: async () => {
      const res = await getSmetaDetailsWithTypes(selectedMonth.value, selectedSmeta.value)
      if (!res || !res.rows) return null
      // Normalize rows
      return res.rows.map(r => ({
        type_of_work: r.type_of_work || 'Прочее',
        description: r.description || '',
        plan: Number(r.plan || 0),
        fact: Number(r.fact || 0),
        delta: Number(r.delta ?? (r.fact - r.plan))
      }))
    },
    enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(selectedMonth.value)),
    staleTime: 2 * 60 * 1000
  })

  // --------------------------------------------------------------------------
  // DAILY QUERIES (dates, daily data)
  // --------------------------------------------------------------------------
  const availableDatesQuery = useQuery({
    queryKey: () => ['available-dates', selectedMonth.value],
    queryFn: () => getAvailableDates(selectedMonth.value),
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 60 * 1000
  })

  const dailyQuery = useQuery({
    queryKey: () => ['daily', selectedDate.value],
    queryFn: async () => {
      const res = await getDaily(selectedDate.value)
      const rawRows = (res && res.rows) || []
      const dateValue = res?.date || selectedDate.value
      const rows = normalizeDailyRows(rawRows, dateValue)
      const totalFromApi = res?.total?.amount
      const total = Number(totalFromApi !== undefined ? totalFromApi : rows.reduce((s, r) => s + (Number(r.amount) || 0), 0))
      return { rows, total, date: dateValue }
    },
    enabled: computed(() => Boolean(selectedDate.value)),
    staleTime: 2 * 60 * 1000
  })

  // --------------------------------------------------------------------------
  // WATCHERS (автоматические реакции на изменения)
  // --------------------------------------------------------------------------
  watch(smetaCardsQuery.data, (cards) => {
    const list = cards || []
    const hasSelected = list.some(c => c && c.smeta_key === selectedSmeta.value)
    if (!hasSelected) {
      selectedSmeta.value = list.length ? list[0].smeta_key : null
    }
  }, { immediate: true })

  watch(selectedMonth, () => {
    selectedDescription.value = null
    invalidateQueries(['smeta-details'])
  })

  // --------------------------------------------------------------------------
  // COMPUTED GETTERS (derived state)
  // --------------------------------------------------------------------------
  
  // Monthly
  const monthlySummary = computed(() => monthlySummaryQuery.data.value)
  const monthlyLoading = computed(() => monthlySummaryQuery.isLoading.value || monthlySummaryQuery.isFetching.value)
  const monthlyError = computed(() => monthlySummaryQuery.error.value ? (monthlySummaryQuery.error.value.message || 'Не удалось загрузить summary') : null)
  const availableMonths = computed(() => availableMonthsQuery.data.value || [])
  
  // Smeta
  const smetaCards = computed(() => smetaCardsQuery.data.value || [])
  const smetaCardsLoading = computed(() => smetaCardsQuery.isLoading.value || smetaCardsQuery.isFetching.value)
  const smetaDetails = computed(() => smetaDetailsQuery.data.value || [])
  const smetaDetailsLoading = computed(() => smetaDetailsQuery.isLoading.value || smetaDetailsQuery.isFetching.value)
  const smetaDetailsWithTypes = computed(() => smetaDetailsWithTypesQuery.data.value || null)
  const smetaDetailsWithTypesLoading = computed(() => smetaDetailsWithTypesQuery.isLoading.value || smetaDetailsWithTypesQuery.isFetching.value)

  // Meta
  const loadedAt = computed(() => {
    const fromLastLoaded = lastLoadedQuery.data.value && lastLoadedQuery.data.value.loaded_at
    const fromSummary = monthlySummary.value || {}
    return fromLastLoaded || fromSummary.loaded_at || fromSummary.last_updated || fromSummary.updated_at || null
  })

  // Daily
  const dailyRows = computed(() => (dailyQuery.data.value && dailyQuery.data.value.rows) || [])
  const dailyTotal = computed(() => (dailyQuery.data.value && dailyQuery.data.value.total) || 0)
  const dailyLoading = computed(() => dailyQuery.isLoading.value || dailyQuery.isFetching.value)

  // --------------------------------------------------------------------------
  // ACTIONS (setters и методы)
  // --------------------------------------------------------------------------
  
  // UI setters
  function setMode(m) { mode.value = m }
  function setSelectedMonth(month) { if (month) selectedMonth.value = month }
  function setSelectedDate(date) { if (date) selectedDate.value = date }
  function setSelectedSmeta(key) { selectedSmeta.value = key }
  function setSelectedDescription(desc) { selectedDescription.value = desc }
  function setLoadedAt(ts) { if (ts) invalidateQueries(['last-loaded']); return ts }

  // Data fetchers
  const fetchMonthlySummary = () => monthlySummaryQuery.refetch()
  const fetchSmetaCards = () => smetaCardsQuery.refetch()
  const fetchSmetaDetails = (key) => {
    if (key) selectedSmeta.value = key
    return smetaDetailsQuery.refetch()
  }
  const fetchDaily = (date) => {
    if (date) selectedDate.value = date
    return dailyQuery.refetch()
  }
  const fetchAvailableMonths = () => availableMonthsQuery.refetch()

  /**
   * Находит ближайшую дату с данными в текущем месяце
   */
  async function findNearestDateWithData() {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    let available = availableDatesQuery.data.value
    
    if (!available || !available.length) {
      try { await availableDatesQuery.refetch() } catch (_) { /* ignore */ }
      available = availableDatesQuery.data.value
    }
    
    if (available && available.length) {
      const startIso = start.toISOString().slice(0, 10)
      const todayIso = today.toISOString().slice(0, 10)
      const candidates = available
        .map(d => String(d).slice(0, 10))
        .filter(d => d >= startIso && d <= todayIso)
        .sort()
      if (candidates.length) {
        const nearest = candidates[candidates.length - 1]
        selectedDate.value = nearest
        await dailyQuery.refetch()
        return nearest
      }
    }

    // Fallback: перебор дат
    for (let d = new Date(today); d >= start; d.setDate(d.getDate() - 1)) {
      const iso = d.toISOString().slice(0, 10)
      try {
        const res = await getDaily(iso)
        const rows = (res && res.rows) || []
        if (rows.length) {
          selectedDate.value = iso
          await dailyQuery.refetch()
          return iso
        }
      } catch (_) {
        /* continue */
      }
    }

    const td = new Date().toISOString().slice(0, 10)
    selectedDate.value = td
    await dailyQuery.refetch()
    return td
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    // UI State
    mode,
    selectedMonth,
    selectedDate,
    selectedSmeta,
    selectedDescription,
    
    // Monthly data
    availableMonths,
    monthlySummary,
    monthlyLoading,
    monthlyError,
    loadedAt,
    
    // Smeta data
    smetaCards,
    smetaCardsLoading,
    smetaDetails,
    smetaDetailsLoading,
    smetaDetailsWithTypes,
    smetaDetailsWithTypesLoading,
    
    // Daily data
    dailyRows,
    dailyTotal,
    dailyLoading,
    
    // Actions: setters
    setMode,
    setSelectedMonth,
    setSelectedDate,
    setSelectedSmeta,
    setSelectedDescription,
    setLoadedAt,
    
    // Actions: fetchers
    fetchMonthlySummary,
    fetchSmetaCards,
    fetchSmetaDetails,
    fetchDaily,
    fetchAvailableMonths,
    findNearestDateWithData
  }
})
