/**
 * Pinia store for prices (расценки) section
 * 
 * Отвечает за:
 * - Список расценок с фильтрацией и поиском
 * - Доступные фильтры (сметы, типы работ)
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getPrices, getPricesFilters, type PriceRow, type EstimateOption, type WorkTypeOption } from '@/api/prices'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'

export const usePricesStore = defineStore('prices', () => {
  // ==========================================================================
  // State
  // ==========================================================================
  
  const selectedEstimate = ref<number | null>(null)
  const selectedWorkType = ref<number | null>(null)
  const isLoading = ref(false)
  const rows = ref<PriceRow[]>([])
  const total = ref(0)

  // Filters
  const estimates = ref<EstimateOption[]>([])
  const workTypes = ref<WorkTypeOption[]>([])

  // Debounced search
  const { query: searchQuery } = useDebouncedSearch(fetchPrices)

  // ==========================================================================
  // Actions
  // ==========================================================================

  async function fetchFilters() {
    try {
      const response = await getPricesFilters()
      estimates.value = response.estimates
      workTypes.value = response.work_types
    } catch (e) {
      console.error('Failed to fetch filters:', e)
    }
  }

  async function fetchPrices() {
    isLoading.value = true
    try {
      const params: { search?: string; estimate_id?: number; work_type_id?: number } = {}
      if (searchQuery.value.length >= 3) {
        params.search = searchQuery.value
      }
      if (selectedEstimate.value !== null) {
        params.estimate_id = selectedEstimate.value
      }
      if (selectedWorkType.value !== null) {
        params.work_type_id = selectedWorkType.value
      }
      
      const response = await getPrices(params)
      rows.value = response.rows
      total.value = response.total
    } catch (e) {
      console.error('Failed to fetch prices:', e)
      rows.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  function resetFilters() {
    searchQuery.value = ''
    selectedEstimate.value = null
    selectedWorkType.value = null
  }

  /**
   * Инициализация — загрузить фильтры и данные
   */
  async function init() {
    await fetchFilters()
    await fetchPrices()
  }

  // Watch for filter changes
  watch([selectedEstimate, selectedWorkType], () => {
    fetchPrices()
  })

  // ==========================================================================
  // Computed
  // ==========================================================================

  const hasActiveFilters = computed(() => {
    return searchQuery.value !== '' || selectedEstimate.value !== null || selectedWorkType.value !== null
  })

  // ==========================================================================
  // Public API
  // ==========================================================================
  return {
    // State
    searchQuery,
    selectedEstimate,
    selectedWorkType,
    isLoading,
    rows,
    total,
    estimates,
    workTypes,

    // Computed
    hasActiveFilters,

    // Actions
    fetchFilters,
    fetchPrices,
    resetFilters,
    init
  }
})
