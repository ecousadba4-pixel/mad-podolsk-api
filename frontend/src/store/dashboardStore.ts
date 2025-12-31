import { computed, ref, watch, type Ref, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useInvalidateQueries } from '../composables/useQueryClient'
import {
  getAvailableDates,
  getAvailableMonths,
  getBySmeta,
  getDaily,
  getLastLoaded,
  getMonthlySummary,
  getSmetaDetails,
  getSmetaDetailsWithTypes
} from '../api/dashboard'
import type {
  MonthlySummary,
  SmetaCard,
  SmetaDetailRow
} from '@/types/dashboard'

// ============================================================================
// TYPES
// ============================================================================

export type DashboardMode = 'monthly' | 'daily'

export interface NormalizedDailyRow {
  date: string
  name: string
  unit: string
  volume: string
  amount: number
}

export interface DailyData {
  rows: NormalizedDailyRow[]
  total: number
  date: string
}

export interface SmetaDetailsWithTypesRow {
  type_of_work: string | null
  description: string
  description_id: string
  plan: number
  fact: number
  delta: number
}

// ============================================================================
// HELPERS
// ============================================================================

function fallbackMonths(): string[] {
  const list: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(d.toISOString().slice(0, 7))
  }
  return list
}

/**
 * Проверяет, является ли ключ сметы "внерегламентом"
 */
export function isVneregKey(key: string | null | undefined): boolean {
  if (!key) return false
  const k = String(key).toLowerCase()
  return k.includes('vne') || k === 'vnereg' || k === 'vner1' || k === 'vner2' || k === 'vnereglement'
}

/**
 * Маппинг ключей смет на человекочитаемые названия
 */
const SMETA_LABELS: Record<string, string> = {
  leto: 'Лето',
  zima: 'Зима',
  vnereg: 'Внерегламент',
  vner1: 'Внерегламент',
  vner2: 'Внерегламент',
  vnereglement: 'Внерегламент'
}

/**
 * Нормализует данные сметных карточек
 */
function normalizeSmetaCards(raw: SmetaCard[]): SmetaCard[] {
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

interface RawSmetaDetailRow {
  title?: string
  description?: string
  description_id?: string
  work_name?: string
  name?: string
  plan?: number
  planned_amount?: number
  planned?: number
  planned_amount_month?: number
  fact?: number
  fact_amount?: number
  fact_amount_done?: number
  fact_amount_month?: number
  delta?: number
  progressPercent?: number
  type_of_work?: string | null
}

/**
 * Нормализует данные деталей сметы
 */
function normalizeSmetaDetails(raw: RawSmetaDetailRow[]): SmetaDetailRow[] {
  return raw.map(r => {
    const title = r.title || r.description || r.work_name || r.name || ''
    const plan = Number(r.plan ?? r.planned_amount ?? r.planned ?? r.planned_amount_month ?? 0)
    const fact = Number(r.fact ?? r.fact_amount ?? r.fact_amount_done ?? r.fact_amount_month ?? 0)
    const delta = Number(r.delta ?? (fact - plan))
    const progressPercent = r.progressPercent ?? (plan ? Math.round((fact / plan) * 100) : 0)
    return {
      title,
      description: r.description,
      description_id: r.description_id,
      plan,
      fact,
      delta,
      progressPercent,
      type_of_work: r.type_of_work
    }
  })
}

interface RawDailyRow {
  description?: string
  name?: string
  work_name?: string
  unit?: string
  volume?: number | string
  amount?: number | string
}

/**
 * Нормализует данные дневной таблицы
 */
function normalizeDailyRows(rawRows: RawDailyRow[], dateValue: string): NormalizedDailyRow[] {
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
  const mode: Ref<DashboardMode> = ref('monthly')
  const selectedMonth = ref(new Date().toISOString().slice(0, 7))
  const selectedDate = ref(new Date().toISOString().slice(0, 10))
  const selectedSmeta: Ref<string | null> = ref(null)
  const selectedDescription: Ref<string | null> = ref(null)
  const selectedDescriptionId: Ref<string | null> = ref(null)

  // --------------------------------------------------------------------------
  // MONTHLY QUERIES (summary, smeta cards, smeta details)
  // --------------------------------------------------------------------------
  const availableMonthsQuery = useQuery<string[]>({
    queryKey: ['available-months'],
    queryFn: async () => {
      const res = await getAvailableMonths()
      if (!res) return fallbackMonths()
      if (Array.isArray(res)) {
        const mapped = res.map((r): string | null => {
          if (!r) return null
          if (typeof r === 'string') return r.slice(0, 7)
          // Handle object responses
          const obj = r as { month?: string; value?: string }
          if (obj.month) return String(obj.month).slice(0, 7)
          if (obj.value) return String(obj.value).slice(0, 7)
          const s = JSON.stringify(r)
          const m = s.match(/\d{4}-\d{2}/)
          return m ? m[0] : null
        }).filter((x): x is string => Boolean(x))
        return mapped
      }
      return []
    },
    staleTime: 60 * 60 * 1000
  })

  const monthlySummaryQuery = useQuery<MonthlySummary>({
    queryKey: () => ['monthly-summary', selectedMonth.value],
    queryFn: () => getMonthlySummary(selectedMonth.value),
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 5 * 60 * 1000
  })

  const lastLoadedQuery = useQuery<{ loaded_at: string | null }>({
    queryKey: () => ['last-loaded'],
    queryFn: () => getLastLoaded(),
    staleTime: 60 * 1000
  })

  const smetaCardsQuery = useQuery<SmetaCard[]>({
    queryKey: () => ['smeta-cards', selectedMonth.value],
    queryFn: async () => {
      const res = await getBySmeta(selectedMonth.value)
      const raw = res?.cards || []
      return normalizeSmetaCards(raw)
    },
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  const smetaDetailsQuery = useQuery<SmetaDetailRow[]>({
    queryKey: () => ['smeta-details', selectedMonth.value, selectedSmeta.value ?? ''],
    queryFn: async () => {
      if (!selectedSmeta.value) return []
      const res = await getSmetaDetails(selectedMonth.value, selectedSmeta.value)
      const raw = res?.rows || []
      return normalizeSmetaDetails(raw)
    },
    enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(selectedMonth.value)),
    staleTime: 2 * 60 * 1000
  })

  const smetaDetailsWithTypesQuery = useQuery<SmetaDetailsWithTypesRow[] | null>({
    queryKey: () => ['smeta-details-with-types', selectedMonth.value, selectedSmeta.value ?? ''],
    queryFn: async () => {
      if (!selectedSmeta.value) return null
      const res = await getSmetaDetailsWithTypes(selectedMonth.value, selectedSmeta.value)
      
      // API now returns flat rows with type_of_work field, not groups
      // Support both old (groups) and new (rows) format
      let resultRows: SmetaDetailsWithTypesRow[] = []
      
      if (res?.rows && Array.isArray(res.rows)) {
        // API v1: flat rows array with type_of_work field
        for (const r of res.rows) {
          resultRows.push({
            type_of_work: r.type_of_work || null,
            description: r.description || r.title || '',
            description_id: r.description_id || '',
            plan: Number(r.plan || 0),
            fact: Number(r.fact || 0),
            delta: Number(r.delta ?? (Number(r.fact || 0) - Number(r.plan || 0)))
          })
        }
      }
      
      return resultRows.length ? resultRows : null
    },
    enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(selectedMonth.value)),
    staleTime: 2 * 60 * 1000
  })

  // --------------------------------------------------------------------------
  // DAILY QUERIES (dates, daily data)
  // --------------------------------------------------------------------------
  const availableDatesQuery = useQuery<string[]>({
    queryKey: () => ['available-dates', selectedMonth.value],
    queryFn: () => getAvailableDates(selectedMonth.value),
    enabled: computed(() => Boolean(selectedMonth.value)),
    staleTime: 60 * 1000
  })

  interface RawDailyResponse {
    rows?: RawDailyRow[]
    date?: string
    total?: { amount?: number } | number
  }

  const dailyQuery = useQuery<DailyData>({
    queryKey: () => ['daily', selectedDate.value],
    queryFn: async () => {
      const res = await getDaily(selectedDate.value) as RawDailyResponse
      const rawRows = res?.rows || []
      const dateValue = res?.date || selectedDate.value
      const rows = normalizeDailyRows(rawRows, dateValue)
      const totalFromApi = typeof res?.total === 'object' ? res.total?.amount : res?.total
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
      const first = list[0]
      selectedSmeta.value = first ? first.smeta_key : null
    }
  }, { immediate: true })

  watch(selectedMonth, () => {
    selectedDescription.value = null
    selectedDescriptionId.value = null
    invalidateQueries(['smeta-details'])
  })

  // --------------------------------------------------------------------------
  // COMPUTED GETTERS (derived state)
  // --------------------------------------------------------------------------
  
  // Monthly
  const monthlySummary: ComputedRef<MonthlySummary | null> = computed(() => monthlySummaryQuery.data.value)
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

  // Centralized smeta label - derives label from cards or SMETA_LABELS
  const selectedSmetaLabel = computed(() => {
    const key = selectedSmeta.value
    if (!key) return ''
    if (SMETA_LABELS[key]) return SMETA_LABELS[key]
    const found = (smetaCards.value || []).find(c => c.smeta_key === key)
    return found?.label || key
  })

  // Check if selected smeta is vnereg type
  const isSelectedSmetaVnereg = computed(() => isVneregKey(selectedSmeta.value))

  // Default sort key based on smeta type (plan for regular, fact for vnereg)
  const defaultSmetaSortKey = computed(() => isSelectedSmetaVnereg.value ? 'fact' : 'plan')

  // Available dates for daily mode
  const availableDates = computed(() => availableDatesQuery.data.value || [])

  // Meta
  const loadedAt = computed(() => {
    const fromLastLoaded = lastLoadedQuery.data.value?.loaded_at
    const fromSummary = monthlySummary.value || {} as Partial<MonthlySummary>
    return fromLastLoaded || fromSummary.loaded_at || fromSummary.last_updated || fromSummary.updated_at || null
  })

  // Daily
  const dailyRows = computed(() => dailyQuery.data.value?.rows || [])
  const dailyTotal = computed(() => dailyQuery.data.value?.total || 0)
  const dailyLoading = computed(() => dailyQuery.isLoading.value || dailyQuery.isFetching.value)

  // --------------------------------------------------------------------------
  // ACTIONS (setters и методы)
  // --------------------------------------------------------------------------
  
  // UI setters
  function setMode(m: DashboardMode): void { mode.value = m }
  function setSelectedMonth(month: string): void { if (month) selectedMonth.value = month }
  function setSelectedDate(date: string): void { if (date) selectedDate.value = date }
  function setSelectedSmeta(key: string | null): void { selectedSmeta.value = key }
  function setSelectedDescription(desc: string | null, descId: string | null = null): void {
    selectedDescription.value = desc
    selectedDescriptionId.value = descId
  }
  function setLoadedAt(ts: string | null): string | null { if (ts) invalidateQueries(['last-loaded']); return ts }

  // Data fetchers
  const fetchMonthlySummary = () => monthlySummaryQuery.refetch()
  const fetchSmetaCards = () => smetaCardsQuery.refetch()
  const fetchSmetaDetails = (key?: string) => {
    if (key) selectedSmeta.value = key
    return smetaDetailsQuery.refetch()
  }
  const fetchDaily = (date?: string) => {
    if (date) selectedDate.value = date
    return dailyQuery.refetch()
  }
  const fetchAvailableMonths = () => availableMonthsQuery.refetch()

  /**
   * Находит ближайшую дату с данными в текущем месяце
   */
  async function findNearestDateWithData(): Promise<string> {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    let available = availableDatesQuery.data.value
    
    if (!available || !available.length) {
      try { await availableDatesQuery.refetch() } catch { /* ignore */ }
      available = availableDatesQuery.data.value
    }
    
    if (available && available.length) {
      const startIso = start.toISOString().slice(0, 10)
      const todayIso = today.toISOString().slice(0, 10)
      const candidates = available
        .map(d => String(d).slice(0, 10))
        .filter(d => d >= startIso && d <= todayIso)
        .sort()
      const nearest = candidates[candidates.length - 1]
      if (nearest) {
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
        const rows = res?.rows || []
        if (rows.length) {
          selectedDate.value = iso
          await dailyQuery.refetch()
          return iso
        }
      } catch {
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
    selectedDescriptionId,
    
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
    selectedSmetaLabel,
    isSelectedSmetaVnereg,
    defaultSmetaSortKey,
    
    // Daily data
    availableDates,
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
    findNearestDateWithData,
    
    // Utilities (re-export for convenience)
    isVneregKey
  }
})
