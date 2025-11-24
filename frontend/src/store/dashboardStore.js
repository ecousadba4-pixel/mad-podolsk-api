// frontend/src/store/dashboardStore.js
import { defineStore } from 'pinia'
import * as api from '../api/dashboard.js'

// Простые mock-данные для демо в фронтенде (используются как fallback)
const MOCK_MONTHLY_SUMMARY = {
  kpi: { plan_total: 1200000, fact_total: 980000 },
  contract: { contract_planfact_pct: 0.82 }
}

const MOCK_SMETA_CARDS = {
  cards: [
    { smeta_key: 'leto', label: 'Лето', type: 'Лето', plan: 400000, fact: 380000, delta: -20000, progressPercent: 95 },
    { smeta_key: 'zima', label: 'Зима', type: 'Зима', plan: 300000, fact: 250000, delta: -50000, progressPercent: 83 },
    { smeta_key: 'vnereg', label: 'Внерегламент', type: 'Внерегламент', plan: 500000, fact: 350000, delta: -150000, progressPercent: 70 }
  ]
}

const MOCK_SMETA_DETAILS = {
  rows: [
    { id: 1, title: 'Работа A', plan: 100000, fact: 95000, delta: -5000, progressPercent: 95, type: 'Лето' },
    { id: 2, title: 'Работа B', plan: 200000, fact: 180000, delta: -20000, progressPercent: 90, type: 'Лето' }
  ]
}

const MOCK_DAILY_ROWS = {
  rows: [
    { id: 'd1', date: '2025-11-01', name: 'Работа A', unit: 'шт', volume: 10, amount: 25000 },
    { id: 'd2', date: '2025-11-02', name: 'Работа B', unit: 'м2', volume: 5, amount: 12500 }
  ]
}

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
    // last loaded timestamp from DB
    loadedAt: null,

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
        this.monthlySummary = res || MOCK_MONTHLY_SUMMARY
        // try to fetch last loaded timestamp separately (backend may expose it)
        try{
          const l = await api.getLastLoaded()
          this.loadedAt = l && l.loaded_at ? l.loaded_at : this.loadedAt
        }catch(_){ /* ignore */ }
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
        this.smetaCards = (res && res.cards) || MOCK_SMETA_CARDS.cards || []
      } catch (err) {
        this.smetaCards = []
      } finally {
        this.smetaCardsLoading = false
      }
    },

    setLoadedAt(ts){
      this.loadedAt = ts
    },

    async fetchSmetaDetails(smetaKey) {
      this.smetaDetailsLoading = true
      this.smetaDetails = []
      try {
        const res = await api.getSmetaDetails(this.selectedMonth, smetaKey)
        this.smetaDetails = (res && res.rows) || MOCK_SMETA_DETAILS.rows || []
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
        this.dailyRows = (res && res.rows) || MOCK_DAILY_ROWS.rows || []
      } catch (err) {
        this.dailyRows = []
      } finally {
        this.dailyLoading = false
      }
    }
  }
})

