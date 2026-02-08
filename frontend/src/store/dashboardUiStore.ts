/**
 * Dashboard UI Store - чистый UI state
 * 
 * Содержит только:
 * - Текущий режим отображения (monthly/daily)
 * - Выбранный месяц
 * 
 * Все данные живут в feature-сторах (monthlyStore, dailyStore, smetaStore),
 * которые импортируют этот стор для получения selectedMonth.
 */

import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

export type DashboardMode = 'monthly' | 'daily'

export const useDashboardUiStore = defineStore('dashboardUi', () => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const mode: Ref<DashboardMode> = ref('monthly')
  const selectedMonth = ref(new Date().toISOString().slice(0, 7))

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  function setMode(m: DashboardMode): void {
    mode.value = m
  }

  function setSelectedMonth(month: string): void {
    if (month) selectedMonth.value = month
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    mode,
    selectedMonth,
    setMode,
    setSelectedMonth
  }
})
