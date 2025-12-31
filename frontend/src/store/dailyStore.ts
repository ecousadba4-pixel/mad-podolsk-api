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

interface RawDailyResponse {
  rows?: RawDailyRow[]
  date?: string
  total?: { amount?: number } | number
}

export const useDailyStore = defineStore('daily', () => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const selectedDate: Ref<string> = ref(new Date().toISOString().slice(0, 10))

  // --------------------------------------------------------------------------
  // QUERY FACTORIES
  // --------------------------------------------------------------------------
  
  function createAvailableDatesQuery(selectedMonth: () => string) {
    return useQuery<string[]>({
      queryKey: () => ['available-dates', selectedMonth()],
      queryFn: () => getAvailableDates(selectedMonth()),
      enabled: computed(() => Boolean(selectedMonth())),
      staleTime: 60 * 1000
    })
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
  // COMPUTED GETTERS
  // --------------------------------------------------------------------------
  
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
  async function findNearestDateWithData(availableDatesData: string[] | null | undefined): Promise<string> {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    
    if (availableDatesData && availableDatesData.length) {
      const startIso = start.toISOString().slice(0, 10)
      const todayIso = today.toISOString().slice(0, 10)
      const candidates = availableDatesData
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
    
    // Query factories
    createAvailableDatesQuery,
    
    // Computed
    dailyRows,
    dailyTotal,
    dailyLoading,
    
    // Actions
    setSelectedDate,
    fetchDaily,
    findNearestDateWithData
  }
})
