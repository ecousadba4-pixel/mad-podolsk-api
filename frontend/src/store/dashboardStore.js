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
    // months available for picker (array of YYYY-MM strings)
    availableMonths: [],
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
    dailyTotal: 0,
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
      // Debug: log start to verify the action is called at runtime
      try { console.debug && console.debug('[store] fetchMonthlySummary:start', this.selectedMonth) } catch(e){}
      this.monthlyLoading = true
      this.monthlyError = null
      try {
        const res = await api.getMonthlySummary(this.selectedMonth)
        this.monthlySummary = res
        // try to fetch last loaded timestamp separately (backend may expose it)
        try{
          const l = await api.getLastLoaded(this.selectedMonth)
          this.loadedAt = l && l.loaded_at ? l.loaded_at : this.loadedAt
        }catch(_){ /* ignore */ }
        try { console.debug && console.debug('[store] fetchMonthlySummary:success', this.selectedMonth, res) } catch(e){}
      } catch (err) {
        try { console.error && console.error('[store] fetchMonthlySummary:error', err) } catch(e){}
        this.monthlyError = err?.message || 'Не удалось загрузить summary'
      } finally {
        this.monthlyLoading = false
        try { console.debug && console.debug('[store] fetchMonthlySummary:finished') } catch(e){}
      }
    },

    async fetchAvailableMonths(){
      try{
        const res = await api.getAvailableMonths()
        // res may be null, array of strings, or array of objects
        if (!res) {
          // fallback: generate recent 6 months
          const list = []
          const now = new Date()
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            list.push(d.toISOString().slice(0,7))
          }
          this.availableMonths = list
          return
        }
        if (Array.isArray(res)){
          // If objects, try to extract `month` or `value` fields
          const mapped = res.map(r => {
            if (!r) return null
            if (typeof r === 'string') return r.slice(0,7)
            if (r.month) return String(r.month).slice(0,7)
            if (r.value) return String(r.value).slice(0,7)
            // try to stringify and extract YYYY-MM
            const s = JSON.stringify(r)
            const m = s.match(/\d{4}-\d{2}/)
            return m ? m[0] : null
          }).filter(Boolean)
          this.availableMonths = mapped
        } else {
          this.availableMonths = []
        }
      } catch (err){
        this.availableMonths = []
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
        const rawRows = (res && res.rows) || []
        const dateValue = res?.date || date
        this.dailyRows = rawRows.map(r => {
          const unit = r.unit || ''
          const volumeNumber = Number(r.volume || 0)
          const amount = Number(r.amount || 0)
          return {
            date: dateValue,
            name: r.description || r.name || r.work_name || '',
            unit,
            volume: `${volumeNumber}${unit ? ` (${unit})` : ''}`,
            amount
          }
        })
        const totalFromApi = res?.total?.amount
        this.dailyTotal = Number(totalFromApi !== undefined ? totalFromApi : this.dailyRows.reduce((s, r) => s + (Number(r.amount) || 0), 0))
      } catch (err) {
        this.dailyRows = []
        this.dailyTotal = 0
      } finally {
        this.dailyLoading = false
      }
    },

    // Find nearest date (<= today) that has daily data, but only within the current calendar month.
    // This ensures the "По дням" секция показывает только даты текущего месяца.
    async findNearestDateWithData() {
      const today = new Date()
      // start of current calendar month
      const start = new Date(today.getFullYear(), today.getMonth(), 1)

      // iterate from today down to the first day of the month
      for (let d = new Date(today); d >= start; d.setDate(d.getDate() - 1)) {
        const iso = d.toISOString().slice(0, 10)
        try {
          const res = await (await import('../api/dashboard.js')).getDaily(iso)
          const rows = (res && res.rows) || []
          if (rows.length) {
            this.setSelectedDate(iso)
            // preload rows so UI doesn't flash empty
            this.dailyRows = rows.map(r => ({
              date: res.date || iso,
              name: r.description || r.name || r.work_name || '',
              unit: r.unit || '',
              volume: `${Number(r.volume || 0)}${r.unit ? ` (${r.unit})` : ''}`,
              amount: Number(r.amount || 0)
            }))
            const totalFromApi = res?.total?.amount
            this.dailyTotal = Number(totalFromApi !== undefined ? totalFromApi : this.dailyRows.reduce((s, r) => s + (Number(r.amount) || 0), 0))
            return iso
          }
        } catch (err) {
          // ignore and continue searching within month
        }
      }

      // fallback: set today and load (still UI will be limited to current month)
      const td = new Date().toISOString().slice(0,10)
      this.setSelectedDate(td)
      await this.fetchDaily(td)
      return td
    }
  }
})

