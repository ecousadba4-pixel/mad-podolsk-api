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
        this.monthlySummary = res
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
        const raw = (res && res.cards) || []
        // ensure progressPercent exists and is computed as fact/plan*100 (rounded)
        const mapped = raw.map(c => {
          const plan = Number(c.plan) || 0
          const fact = Number(c.fact) || 0
          const pct = plan ? Math.round((fact / plan) * 100) : 0
          return { ...c, progressPercent: c.progressPercent ?? pct }
        })

        // sort by fact descending so the largest fact appears first
        mapped.sort((a, b) => (Number(b.fact) || 0) - (Number(a.fact) || 0))
        this.smetaCards = mapped

        // if no smeta selected yet, pick the first (largest fact) and load its details
        if (!this.selectedSmeta && this.smetaCards.length) {
          const firstKey = this.smetaCards[0].smeta_key
          this.setSelectedSmeta(firstKey)
          // fire and forget details load (await to ensure UI has details if needed)
          await this.fetchSmetaDetails(firstKey)
        }
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
      try {
        const res = await api.getSmetaDetails(this.selectedMonth, smetaKey)
        const raw = (res && res.rows) || []
        // Normalize row shape so UI always has title/plan/fact/delta
        const norm = raw.map(r => {
          const title = r.title || r.description || r.work_name || r.name || r.label || ''
          const plan = Number(r.plan ?? r.planned_amount ?? r.planned ?? r.planned_amount_month ?? 0)
          const fact = Number(r.fact ?? r.fact_amount ?? r.fact_amount_done ?? r.fact_amount_month ?? 0)
          const delta = Number(r.delta ?? (fact - plan))
          const progressPercent = r.progressPercent ?? (plan ? Math.round((fact / plan) * 100) : 0)
          return { ...r, title, plan, fact, delta, progressPercent }
        })
        this.smetaDetails = norm
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
        this.dailyRows = (res && res.rows) || []
      } catch (err) {
        this.dailyRows = []
      } finally {
        this.dailyLoading = false
      }
    }
  }
})

