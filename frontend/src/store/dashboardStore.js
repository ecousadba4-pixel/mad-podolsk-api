// frontend/src/store/dashboardStore.js
import { defineStore } from 'pinia'
import * as api from '../api/dashboard.js'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // фильтры / режимы
    mode: 'monthly', // 'monthly' | 'daily'
    selectedMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    selectedDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    selectedSmeta: null, // 'leto' | 'zima' | 'vnereglement'
    selectedDescription: null,

    // monthly summary
    monthlySummary: null,
    monthlyLoading: false,
    monthlyError: null,

    // by-smeta cards
    smetaCards: [],
    smetaCardsLoading: false,

    // details for selected smeta
    smetaDetails: [],
    smetaDetailsLoading: false,

    // daily data
    dailyRows: [],
    dailyLoading: false
  }),

  actions: {
    setMode(m) {
      this.mode = m
    },

    setSelectedMonth(month) {
      this.selectedMonth = month
    },

    setSelectedDate(date) {
      this.selectedDate = date
    },

    setSelectedSmeta(smetaKey) {
      this.selectedSmeta = smetaKey
    },

    setSelectedDescription(desc) {
      this.selectedDescription = desc
    },

    async fetchMonthlySummary() {
      this.monthlyLoading = true
      this.monthlyError = null
      try {
        const res = await api.getMonthlySummary(this.selectedMonth)
        this.monthlySummary = res
      } catch (err) {
        this.monthlyError = err?.message || 'Не удалось загрузить summary'
      } finally {
        this.monthlyLoading = false
      }
    },

    async fetchSmetaCards() {
      this.smetaCardsLoading = true
      try {
        const res = await api.getBySmeta(this.selectedMonth)
        this.smetaCards = res.cards || []
      } catch (err) {
        this.smetaCards = []
      } finally {
        this.smetaCardsLoading = false
      }
    },

    async fetchSmetaDetails(smetaKey) {
      this.smetaDetailsLoading = true
      this.smetaDetails = []
      try {
        const res = await api.getSmetaDetails(this.selectedMonth, smetaKey)
        this.smetaDetails = res.rows || []
      } catch (err) {
        this.smetaDetails = []
      } finally {
        this.smetaDetailsLoading = false
      }
    },

    async fetchDaily(date) {
      this.dailyLoading = true
      try {
        const res = await api.getDaily(date)
        this.dailyRows = res.rows || []
      } catch (err) {
        this.dailyRows = []
      } finally {
        this.dailyLoading = false
      }
    }
  }
})

