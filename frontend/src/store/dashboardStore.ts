/**
 * Dashboard Store - координатор модулей и UI state
 * 
 * Этот store:
 * - Координирует работу monthlyStore, dailyStore, smetaStore
 * - Управляет общим UI state (режим, выбранный месяц)
 * - Предоставляет единый API для компонентов (обратная совместимость)
 * 
 * Модульная архитектура:
 * - monthlyStore: данные месячного дашборда (summary, months)
 * - dailyStore: данные дневного дашборда (daily rows, dates)
 * - smetaStore: данные смет (cards, details)
 */

import { computed, ref, watch, type Ref, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import type { MonthlySummary } from '@/types/dashboard'

// Import sub-stores
import { useMonthlyStore } from './monthlyStore'
import { useDailyStore } from './dailyStore'
import { useSmetaStore, isVneregKey } from './smetaStore'
import type { NormalizedDailyRow, DailyData, SmetaDetailsWithTypesRow } from './helpers'

// Re-export types for convenience
export type { NormalizedDailyRow, DailyData, SmetaDetailsWithTypesRow }
export { isVneregKey }

export type DashboardMode = 'monthly' | 'daily'

// ============================================================================
// MAIN STORE
// ============================================================================

export const useDashboardStore = defineStore('dashboard', () => {
  // --------------------------------------------------------------------------
  // SUB-STORES
  // --------------------------------------------------------------------------
  const monthlyStore = useMonthlyStore()
  const dailyStore = useDailyStore()
  const smetaStore = useSmetaStore()

  // --------------------------------------------------------------------------
  // UI STATE (режим, выбранный месяц)
  // --------------------------------------------------------------------------
  const mode: Ref<DashboardMode> = ref('monthly')
  const selectedMonth = ref(new Date().toISOString().slice(0, 7))

  // --------------------------------------------------------------------------
  // INITIALIZE QUERIES (с привязкой к selectedMonth)
  // --------------------------------------------------------------------------
  const monthlySummaryQuery = monthlyStore.createSummaryQuery(() => selectedMonth.value)
  const availableDatesQuery = dailyStore.createAvailableDatesQuery(() => selectedMonth.value)
  const smetaCardsQuery = smetaStore.createSmetaCardsQuery(() => selectedMonth.value)
  const smetaDetailsQuery = smetaStore.createSmetaDetailsQuery(() => selectedMonth.value)
  const smetaDetailsWithTypesQuery = smetaStore.createSmetaDetailsWithTypesQuery(() => selectedMonth.value)

  // --------------------------------------------------------------------------
  // WATCHERS (автоматические реакции на изменения)
  // --------------------------------------------------------------------------
  
  // Auto-select first smeta when cards change
  watch(smetaCardsQuery.data, (cards) => {
    const list = cards || []
    const hasSelected = list.some(c => c && c.smeta_key === smetaStore.selectedSmeta)
    if (!hasSelected) {
      const first = list[0]
      smetaStore.setSelectedSmeta(first ? first.smeta_key : null)
    }
  }, { immediate: true })

  // Clear description when month changes
  watch(selectedMonth, () => {
    smetaStore.clearDescription()
    smetaStore.invalidateSmetaDetails()
  })

  // --------------------------------------------------------------------------
  // COMPUTED GETTERS (объединяем данные из под-сторов)
  // --------------------------------------------------------------------------
  
  // Monthly
  const monthlySummary: ComputedRef<MonthlySummary | null> = computed(() => monthlySummaryQuery.data.value)
  const monthlyLoading = computed(() => monthlySummaryQuery.isLoading.value || monthlySummaryQuery.isFetching.value)
  const monthlyError = computed(() => monthlySummaryQuery.error.value ? (monthlySummaryQuery.error.value.message || 'Не удалось загрузить summary') : null)
  const availableMonths = computed(() => monthlyStore.availableMonths)
  
  // Smeta
  const smetaCards = computed(() => smetaCardsQuery.data.value || [])
  const smetaCardsLoading = computed(() => smetaCardsQuery.isLoading.value || smetaCardsQuery.isFetching.value)
  const smetaDetails = computed(() => smetaDetailsQuery.data.value || [])
  const smetaDetailsLoading = computed(() => smetaDetailsQuery.isLoading.value || smetaDetailsQuery.isFetching.value)
  const smetaDetailsWithTypes = computed(() => smetaDetailsWithTypesQuery.data.value || null)
  const smetaDetailsWithTypesLoading = computed(() => smetaDetailsWithTypesQuery.isLoading.value || smetaDetailsWithTypesQuery.isFetching.value)

  // Proxy refs from smetaStore
  const selectedSmeta = computed({
    get: () => smetaStore.selectedSmeta,
    set: (v) => smetaStore.setSelectedSmeta(v)
  })
  const selectedDescription = computed({
    get: () => smetaStore.selectedDescription,
    set: (v) => smetaStore.setSelectedDescription(v)
  })
  const selectedDescriptionId = computed({
    get: () => smetaStore.selectedDescriptionId,
    set: (v) => smetaStore.setSelectedDescription(smetaStore.selectedDescription, v)
  })

  // Centralized smeta label - derives label from cards or SMETA_LABELS
  const selectedSmetaLabel = computed(() => 
    smetaStore.getSmetaLabel(smetaStore.selectedSmeta, smetaCards.value)
  )

  // Check if selected smeta is vnereg type
  const isSelectedSmetaVnereg = computed(() => smetaStore.isSelectedSmetaVnereg)

  // Default sort key based on smeta type (plan for regular, fact for vnereg)
  const defaultSmetaSortKey = computed(() => smetaStore.defaultSmetaSortKey)

  // Daily - proxy from dailyStore
  const selectedDate = computed({
    get: () => dailyStore.selectedDate,
    set: (v) => dailyStore.setSelectedDate(v)
  })
  const availableDates = computed(() => availableDatesQuery.data.value || [])
  const dailyRows = computed(() => dailyStore.dailyRows)
  const dailyTotal = computed(() => dailyStore.dailyTotal)
  const dailyLoading = computed(() => dailyStore.dailyLoading)

  // Meta
  const loadedAt = computed(() => {
    const fromLastLoaded = monthlyStore.lastLoadedAt
    const fromSummary = monthlySummary.value || {} as Partial<MonthlySummary>
    return fromLastLoaded || fromSummary.loaded_at || fromSummary.last_updated || fromSummary.updated_at || null
  })

  // --------------------------------------------------------------------------
  // ACTIONS (setters и методы)
  // --------------------------------------------------------------------------
  
  // UI setters
  function setMode(m: DashboardMode): void { mode.value = m }
  function setSelectedMonth(month: string): void { if (month) selectedMonth.value = month }
  function setSelectedDate(date: string): void { dailyStore.setSelectedDate(date) }
  function setSelectedSmeta(key: string | null): void { smetaStore.setSelectedSmeta(key) }
  function setSelectedDescription(desc: string | null, descId: string | null = null): void {
    smetaStore.setSelectedDescription(desc, descId)
  }
  function setLoadedAt(ts: string | null): string | null { 
    if (ts) monthlyStore.invalidateLastLoaded()
    return ts 
  }

  // Data fetchers
  const fetchMonthlySummary = () => monthlySummaryQuery.refetch()
  const fetchSmetaCards = () => smetaCardsQuery.refetch()
  const fetchSmetaDetails = (key?: string) => {
    if (key) smetaStore.setSelectedSmeta(key)
    return smetaDetailsQuery.refetch()
  }
  const fetchDaily = (date?: string) => dailyStore.fetchDaily(date)
  const fetchAvailableMonths = () => monthlyStore.fetchAvailableMonths()

  /**
   * Находит ближайшую дату с данными в текущем месяце
   */
  async function findNearestDateWithData(): Promise<string> {
    let available = availableDatesQuery.data.value
    
    if (!available || !available.length) {
      try { await availableDatesQuery.refetch() } catch { /* ignore */ }
      available = availableDatesQuery.data.value
    }
    
    return dailyStore.findNearestDateWithData(available)
  }

  // --------------------------------------------------------------------------
  // PUBLIC API (сохраняем обратную совместимость)
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
    isVneregKey,
    
    // Sub-stores (для прямого доступа при необходимости)
    $monthlyStore: monthlyStore,
    $dailyStore: dailyStore,
    $smetaStore: smetaStore
  }
})
