/**
 * Pinia store for road sections (участки дороги) section
 * 
 * Отвечает за:
 * - Список участков дорог с поиском
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRoadSections, type RoadSectionRow } from '@/api/roadSections'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'

export const useRoadSectionsStore = defineStore('roadSections', () => {
  // ==========================================================================
  // State
  // ==========================================================================

  const isLoading = ref(false)
  const rows = ref<RoadSectionRow[]>([])
  const total = ref(0)

  // Debounced search
  const { query: searchQuery } = useDebouncedSearch(fetchRoadSections)

  // ==========================================================================
  // Actions
  // ==========================================================================

  async function fetchRoadSections() {
    isLoading.value = true
    try {
      const search = searchQuery.value.length >= 3 ? searchQuery.value : undefined
      const response = await getRoadSections(search)
      rows.value = response.rows
      total.value = response.total
    } catch (e) {
      console.error('Failed to fetch road sections:', e)
      rows.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Инициализация — загрузить данные
   */
  async function init() {
    await fetchRoadSections()
  }

  // ==========================================================================
  // Public API
  // ==========================================================================
  return {
    // State
    searchQuery,
    isLoading,
    rows,
    total,

    // Actions
    fetchRoadSections,
    init
  }
})
