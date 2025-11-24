import { request } from './client.js'

// Здесь указаны контракты как в документации docs/frontend-spec.md

export async function getMonthlySummary(month) {
  try {
    return await request(`/api/dashboard/monthly/summary?month=${encodeURIComponent(month)}`)
  } catch (err) {
    // fallback mock для разработки, если бэкенд недоступен
    return {
      month,
      contract: {
        summa_contract: 10000000,
        fact_total: 6500000,
        contract_planfact_pct: 0.65
      },
      kpi: {
        plan_total: 7000000,
        fact_total: 6500000,
        delta: -500000,
        avg_daily_revenue: 250000
      }
    }
  }
}

export async function getLastLoaded() {
  try {
    return await request(`/api/dashboard/last-loaded`)
  } catch (err) {
    return { loaded_at: new Date().toISOString() }
  }
}

export async function getBySmeta(month) {
  try {
    return await request(`/api/dashboard/monthly/by-smeta?month=${encodeURIComponent(month)}`)
  } catch (err) {
    return {
      month,
      cards: [
        { smeta_key: 'leto', label: 'Лето', plan: 3000000, fact: 2800000, delta: -200000 },
        { smeta_key: 'zima', label: 'Зима', plan: 2500000, fact: 2400000, delta: -100000 },
        { smeta_key: 'vnereglement', label: 'Внерегламент', plan: 1500000, fact: 1300000, delta: -200000 }
      ]
    }
  }
}

export async function getSmetaDetails(month, smeta_key) {
  try {
    return await request(`/api/dashboard/monthly/smeta-details?month=${encodeURIComponent(month)}&smeta_key=${encodeURIComponent(smeta_key)}`)
  } catch (err) {
    return {
      month,
      smeta_key,
      rows: [
        { description: 'Вывоз ТКО', plan: 500000, fact: 480000, delta: -20000 },
        { description: 'Уборка прилегающей территории', plan: 200000, fact: 190000, delta: -10000 }
      ]
    }
  }
}

export async function getMonthlyDailyRevenue(month) {
  try {
    return await request(`/api/dashboard/monthly/daily-revenue?month=${encodeURIComponent(month)}`)
  } catch (err) {
    return {
      month,
      rows: [
        { date: `${month}-01`, amount: 200000 },
        { date: `${month}-02`, amount: 180000 }
      ]
    }
  }
}

export async function getDaily(date) {
  try {
    // Backend expects query parameter `date` (YYYY-MM-DD)
    return await request(`/api/dashboard/daily?date=${encodeURIComponent(date)}`)
  } catch (err) {
    return {
      date,
      rows: [
        { description: 'Вывоз ТКО', unit: 'м³', volume: 120, amount: 60000 },
        { description: 'Уборка', unit: 'шт', volume: 5, amount: 40000 }
      ],
      total: { amount: 100000 }
    }
  }
}

export async function getSmetaDescriptionDaily(month, smeta_key, description) {
  try {
    return await request(`/api/dashboard/monthly/smeta-description-daily?month=${encodeURIComponent(month)}&smeta_key=${encodeURIComponent(smeta_key)}&description=${encodeURIComponent(description)}`)
  } catch (err) {
    return { month, smeta_key, description, rows: [] }
  }
}
