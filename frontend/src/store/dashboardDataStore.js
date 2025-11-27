import { computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useInvalidateQueries } from '../composables/useQueryClient.js'
import { getAvailableDates, getAvailableMonths, getBySmeta, getDaily, getLastLoaded, getMonthlySummary, getSmetaDetails } from '../api/dashboard.js'
import { useDashboardUiStore } from './dashboardUiStore.js'

function fallbackMonths() {
  const list = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(d.toISOString().slice(0, 7))
  }
  return list
}

export const useDashboardDataStore = defineStore('dashboard-data', () => {
  const ui = useDashboardUiStore()
  const invalidateQueries = useInvalidateQueries()

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
    staleTime: 60 * 60 * 1000,
  })

  const monthlySummaryQuery = useQuery({
    queryKey: () => ['monthly-summary', ui.selectedMonth.value],
    queryFn: () => getMonthlySummary(ui.selectedMonth.value),
    enabled: computed(() => Boolean(ui.selectedMonth.value)),
    staleTime: 5 * 60 * 1000,
  })

  const lastLoadedQuery = useQuery({
    queryKey: () => ['last-loaded', ui.selectedMonth.value],
    queryFn: () => getLastLoaded(ui.selectedMonth.value),
    enabled: computed(() => Boolean(ui.selectedMonth.value)),
    staleTime: 60 * 1000,
  })

  const smetaCardsQuery = useQuery({
    queryKey: () => ['smeta-cards', ui.selectedMonth.value],
    queryFn: async () => {
      const res = await getBySmeta(ui.selectedMonth.value)
      const raw = (res && res.cards) || []
      const mapped = raw.map(c => {
        const plan = Number(c.plan) || 0
        const fact = Number(c.fact) || 0
        const pct = plan ? Math.round((fact / plan) * 100) : 0
        const delta = Number(c.delta ?? (fact - plan))
        return { ...c, delta, progressPercent: c.progressPercent ?? pct }
      })
      mapped.sort((a, b) => (Number(b.fact) || 0) - (Number(a.fact) || 0))
      return mapped
    },
    enabled: computed(() => Boolean(ui.selectedMonth.value)),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const smetaDetailsQuery = useQuery({
    queryKey: () => ['smeta-details', ui.selectedMonth.value, ui.selectedSmeta.value],
    queryFn: async () => {
      const res = await getSmetaDetails(ui.selectedMonth.value, ui.selectedSmeta.value)
      const raw = (res && res.rows) || []
      return raw.map(r => {
        const title = r.title || r.description || r.work_name || r.name || ''
        const plan = Number(r.plan ?? r.planned_amount ?? r.planned ?? r.planned_amount_month ?? 0)
        const fact = Number(r.fact ?? r.fact_amount ?? r.fact_amount_done ?? r.fact_amount_month ?? 0)
        const delta = Number(r.delta ?? (fact - plan))
        const progressPercent = r.progressPercent ?? (plan ? Math.round((fact / plan) * 100) : 0)
        return { ...r, title, plan, fact, delta, progressPercent }
      })
    },
    enabled: computed(() => Boolean(ui.selectedSmeta.value) && Boolean(ui.selectedMonth.value)),
    staleTime: 2 * 60 * 1000,
  })

  const availableDatesQuery = useQuery({
    queryKey: () => ['available-dates', ui.selectedMonth.value],
    queryFn: () => getAvailableDates(ui.selectedMonth.value),
    enabled: computed(() => Boolean(ui.selectedMonth.value)),
    staleTime: 60 * 1000,
  })

  const dailyQuery = useQuery({
    queryKey: () => ['daily', ui.selectedDate.value],
    queryFn: async () => {
      const res = await getDaily(ui.selectedDate.value)
      const rawRows = (res && res.rows) || []
      const dateValue = res?.date || ui.selectedDate.value
      const rows = rawRows.map(r => {
        const unit = r.unit || ''
        const volumeNumber = Number(r.volume || 0)
        const amount = Number(r.amount || 0)
        return {
          date: dateValue,
          name: r.description || r.name || r.work_name || '',
          unit,
          volume: `${volumeNumber}${unit ? ` (${unit})` : ''}`,
          amount,
        }
      })
      const totalFromApi = res?.total?.amount
      const total = Number(totalFromApi !== undefined ? totalFromApi : rows.reduce((s, r) => s + (Number(r.amount) || 0), 0))
      return { rows, total, date: dateValue }
    },
    enabled: computed(() => Boolean(ui.selectedDate.value)),
    staleTime: 2 * 60 * 1000,
  })

  watch(smetaCardsQuery.data, (cards) => {
    const list = cards || []
    const hasSelected = list.some(c => c && c.smeta_key === ui.selectedSmeta.value)
    if (!hasSelected) {
      ui.setSelectedSmeta(list.length ? list[0].smeta_key : null)
    }
  }, { immediate: true })

  watch(() => ui.selectedMonth.value, () => {
    ui.setSelectedDescription(null)
    invalidateQueries(['smeta-details'])
  })

  const monthlySummary = computed(() => monthlySummaryQuery.data.value)
  const monthlyLoading = computed(() => monthlySummaryQuery.isLoading.value || monthlySummaryQuery.isFetching.value)
  const monthlyError = computed(() => monthlySummaryQuery.error.value ? (monthlySummaryQuery.error.value.message || 'Не удалось загрузить summary') : null)

  const availableMonths = computed(() => availableMonthsQuery.data.value || [])
  const smetaCards = computed(() => smetaCardsQuery.data.value || [])
  const smetaCardsLoading = computed(() => smetaCardsQuery.isLoading.value || smetaCardsQuery.isFetching.value)

  const smetaDetails = computed(() => smetaDetailsQuery.data.value || [])
  const smetaDetailsLoading = computed(() => smetaDetailsQuery.isLoading.value || smetaDetailsQuery.isFetching.value)

  const loadedAt = computed(() => {
    const fromLastLoaded = lastLoadedQuery.data.value && lastLoadedQuery.data.value.loaded_at
    const fromSummary = monthlySummary.value || {}
    return fromLastLoaded || fromSummary.loaded_at || fromSummary.last_updated || fromSummary.updated_at || null
  })

  const dailyRows = computed(() => (dailyQuery.data.value && dailyQuery.data.value.rows) || [])
  const dailyTotal = computed(() => (dailyQuery.data.value && dailyQuery.data.value.total) || 0)
  const dailyLoading = computed(() => dailyQuery.isLoading.value || dailyQuery.isFetching.value)

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
        ui.setSelectedDate(nearest)
        await dailyQuery.refetch()
        return nearest
      }
    }

    for (let d = new Date(today); d >= start; d.setDate(d.getDate() - 1)) {
      const iso = d.toISOString().slice(0, 10)
      try {
        const res = await getDaily(iso)
        const rows = (res && res.rows) || []
        if (rows.length) {
          ui.setSelectedDate(iso)
          await dailyQuery.refetch()
          return iso
        }
      } catch (_) {
        /* continue */
      }
    }

    const td = new Date().toISOString().slice(0, 10)
    ui.setSelectedDate(td)
    await dailyQuery.refetch()
    return td
  }

  function setLoadedAt(ts) { if (ts) invalidateQueries(['last-loaded']); return ts }

  return {
    availableMonths,
    monthlySummary,
    monthlyLoading,
    monthlyError,
    loadedAt,
    smetaCards,
    smetaCardsLoading,
    smetaDetails,
    smetaDetailsLoading,
    dailyRows,
    dailyTotal,
    dailyLoading,
    findNearestDateWithData,
    setLoadedAt,
    refetchMonthlySummary: () => monthlySummaryQuery.refetch(),
    refetchSmetaCards: () => smetaCardsQuery.refetch(),
    refetchSmetaDetails: () => smetaDetailsQuery.refetch(),
    refetchDaily: () => dailyQuery.refetch(),
    refetchAvailableMonths: () => availableMonthsQuery.refetch(),
  }
})
