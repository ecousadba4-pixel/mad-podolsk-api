// frontend/src/store/dashboardStore.js
import { defineStore } from 'pinia'

// ===============================
// MOCK ДЛЯ monthly summary
// ===============================
const MOCK_MONTHLY_SUMMARY = {
  plan_total: 5_000_000,
  fact_total: 4_200_000,
  contract_planfact_pct: 84
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // выбранный месяц
    selectedMonth: new Date().toISOString().slice(0, 7), // YYYY-MM

    // данные по месяцу
    monthlySummary: null,
    monthlyLoading: false,
    monthlyError: null
  }),

  actions: {
    // обновление выбранного месяца
    setSelectedMonth(month) {
      this.selectedMonth = month
    },

    // загрузка данных по месяцу (пока MOCK)
    async fetchMonthlySummary() {
      this.monthlyLoading = true
      this.monthlyError = null

      try {
        // имитируем задержку запроса
        await new Promise(resolve => setTimeout(resolve, 400))

        // подставляем мок-данные
        this.monthlySummary = {
          ...MOCK_MONTHLY_SUMMARY,
          month: this.selectedMonth
        }
      } catch (error) {
        this.monthlyError = 'Не удалось загрузить данные'
      } finally {
        this.monthlyLoading = false
      }
    }
  }
})

