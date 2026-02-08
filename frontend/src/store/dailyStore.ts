/**
 * Daily Store - управление данными дневного дашборда
 * 
 * Отвечает за:
 * - Дневные данные по работам
 * - Список доступных дат
 * - Поиск ближайшей даты с данными
 */

import { computed, ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { useQuery } from '../composables/useQueryClient'
import { getAvailableDates, getDaily } from '../api/dashboard'
import { normalizeDailyRows, type DailyData, type RawDailyRow } from './helpers'
import { useDashboardUiStore } from './dashboardUiStore'

interface RawDailyResponse {
  rows?: RawDailyRow[]
  date?: string
  total?: { amount?: number } | number
}

export const useDailyStore = defineStore('daily', () => {
  const uiStore = useDashboardUiStore()

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const selectedDate: Ref<string> = ref(new Date().toISOString().slice(0, 10))

  // --------------------------------------------------------------------------
  // QUERIES (use selectedMonth from UI store)
  // --------------------------------------------------------------------------

  const availableDatesQuery = useQuery<string[]>({
    queryKey: () => ['available-dates', uiStore.selectedMonth],
    queryFn: () => getAvailableDates(uiStore.selectedMonth),
    enabled: computed(() => Boolean(uiStore.selectedMonth)),
    staleTime: 60 * 1000
  })

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
  // COMPUTED GETTERS
  // --------------------------------------------------------------------------
  
  const availableDates = computed(() => availableDatesQuery.data.value || [])
  const dailyRows = computed(() => dailyQuery.data.value?.rows || [])
  const dailyTotal = computed(() => dailyQuery.data.value?.total || 0)
  const dailyLoading = computed(() => dailyQuery.isLoading.value || dailyQuery.isFetching.value)

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  
  function setSelectedDate(date: string): void {
    if (date) selectedDate.value = date
  }

  const fetchDaily = (date?: string) => {
    if (date) selectedDate.value = date
    return dailyQuery.refetch()
  }

  /**
   * Находит ближайшую дату с данными в текущем месяце
   */
  async function findNearestDateWithData(): Promise<string> {
    let available = availableDatesQuery.data.value
    
    if (!available || !available.length) {
      try { await availableDatesQuery.refetch() } catch { /* ignore */ }
      available = availableDatesQuery.data.value
    }

    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    
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
    // State
    selectedDate,
    
    // Computed
    availableDates,
    dailyRows,
    dailyTotal,
    dailyLoading,
    
    // Actions
    setSelectedDate,
    fetchDaily,
    findNearestDateWithData
  }
})
