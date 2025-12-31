/**
 * Monthly Store - управление данными месячного дашборда
 * 
 * Отвечает за:
 * - Monthly summary (KPI показатели)
 * - Список доступных месяцев
 * - Время последнего обновления данных
 */

import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useInvalidateQueries } from '../composables/useQueryClient'
import { getAvailableMonths, getLastLoaded, getMonthlySummary } from '../api/dashboard'
import type { MonthlySummary } from '@/types/dashboard'
import { fallbackMonths } from './helpers'

export const useMonthlyStore = defineStore('monthly', () => {
  const invalidateQueries = useInvalidateQueries()

  // --------------------------------------------------------------------------
  // QUERIES
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

  // Функция для создания query summary с переданным месяцем
  function createSummaryQuery(selectedMonth: () => string) {
    return useQuery<MonthlySummary>({
      queryKey: () => ['monthly-summary', selectedMonth()],
      queryFn: () => getMonthlySummary(selectedMonth()),
      enabled: computed(() => Boolean(selectedMonth())),
      staleTime: 5 * 60 * 1000
    })
  }

  const lastLoadedQuery = useQuery<{ loaded_at: string | null }>({
    queryKey: () => ['last-loaded'],
    queryFn: () => getLastLoaded(),
    staleTime: 60 * 1000
  })

  // --------------------------------------------------------------------------
  // COMPUTED GETTERS
  // --------------------------------------------------------------------------
  
  const availableMonths = computed(() => availableMonthsQuery.data.value || [])
  const availableMonthsLoading = computed(() => availableMonthsQuery.isLoading.value)
  const lastLoadedAt = computed(() => lastLoadedQuery.data.value?.loaded_at ?? null)

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  
  const fetchAvailableMonths = () => availableMonthsQuery.refetch()
  
  function invalidateLastLoaded() {
    invalidateQueries(['last-loaded'])
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    // Query factories (для использования в главном store)
    createSummaryQuery,
    
    // Computed
    availableMonths,
    availableMonthsLoading,
    lastLoadedAt,
    
    // Actions
    fetchAvailableMonths,
    invalidateLastLoaded
  }
})
