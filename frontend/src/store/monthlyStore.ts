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
import { useDashboardUiStore } from './dashboardUiStore'

export const useMonthlyStore = defineStore('monthly', () => {
  const invalidateQueries = useInvalidateQueries()
  const uiStore = useDashboardUiStore()

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

  // Monthly summary query - uses selectedMonth from UI store
  const monthlySummaryQuery = useQuery<MonthlySummary>({
    queryKey: () => ['monthly-summary', uiStore.selectedMonth],
    queryFn: () => getMonthlySummary(uiStore.selectedMonth),
    enabled: computed(() => Boolean(uiStore.selectedMonth)),
    staleTime: 5 * 60 * 1000
  })

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

  const monthlySummary = computed(() => monthlySummaryQuery.data.value)
  const monthlyLoading = computed(() => monthlySummaryQuery.isLoading.value || monthlySummaryQuery.isFetching.value)
  const monthlyError = computed(() => monthlySummaryQuery.error.value ? (monthlySummaryQuery.error.value.message || 'Не удалось загрузить summary') : null)

  const loadedAt = computed(() => {
    const fromLastLoaded = lastLoadedAt.value
    const fromSummary = monthlySummary.value || {} as Partial<MonthlySummary>
    return fromLastLoaded || fromSummary.loaded_at || fromSummary.last_updated || fromSummary.updated_at || null
  })

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  
  const fetchAvailableMonths = () => availableMonthsQuery.refetch()
  const fetchMonthlySummary = () => monthlySummaryQuery.refetch()
  
  function invalidateLastLoaded() {
    invalidateQueries(['last-loaded'])
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    // Computed
    availableMonths,
    availableMonthsLoading,
    lastLoadedAt,
    monthlySummary,
    monthlyLoading,
    monthlyError,
    loadedAt,
    
    // Actions
    fetchAvailableMonths,
    fetchMonthlySummary,
    invalidateLastLoaded
  }
})
