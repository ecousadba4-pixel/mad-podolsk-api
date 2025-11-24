// src/store/dashboardStore.js
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // базовое состояние, потом расширим по спецификации
    mode: 'monthly', // 'monthly' | 'daily'
    selectedMonth: null,
    selectedDate: null,
  }),
  actions: {
    setMode(mode) {
      this.mode = mode
    },
    setSelectedMonth(month) {
      this.selectedMonth = month
    },
    setSelectedDate(date) {
      this.selectedDate = date
    },
  },
})

