import { request } from './client.js'

// Функции API: пробуем старые конкретные пути, а при 404 фолбэчим на единый эндпойнт
function normalizeMonth(month) {
  if (!month) return month
  // Backend expects a full date/datetime. If caller provides only year-month
  // (e.g. "2025-11"), convert to first day of month "2025-11-01" so the
  // server can parse it as a valid date. If a full date is provided, keep it.
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) return month
  return month
}

function smetaKeyFromLabel(label) {
  if (!label) return label
  const map = { 'лето': 'leto', 'зима': 'zima', 'внерегламент': 'vnereglement', 'вне регламент': 'vnereglement' }
  if (map[label]) return map[label]
  // fallback: ascii-safe slug
  return label.toString().toLowerCase().replace(/[^a-z0-9]+/gi, '-')
}

export async function getMonthlySummary(month) {
  const m = normalizeMonth(month)

  function normalizeSummary(res) {
    if (!res) return res
    // If response already has expected shape, return as-is
    if (res.contract && res.kpi) return res

    const s = res.summary || res
    if (!s) return res

    const contract = {
      summa_contract: s.contract_amount ?? s.summa_contract ?? null,
      fact_total: s.contract_executed ?? s.fact_amount ?? null,
      contract_planfact_pct: s.contract_completion_pct ?? s.contract_planfact_pct ?? null
    }
    const kpi = {
      plan_total: s.planned_amount ?? s.plan_total ?? null,
      fact_total: s.fact_amount ?? s.fact_total ?? null,
      delta: s.delta_amount ?? s.delta ?? null,
      avg_daily_revenue: s.average_daily_revenue ?? s.avg_daily_revenue ?? null
    }

    return { month: res.month || m, contract, kpi }
  }

  try {
    const direct = await request(`/api/dashboard/monthly/summary?month=${encodeURIComponent(m)}`)
    return normalizeSummary(direct)
  } catch (err) {
    // fallback to combined endpoint
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      const res = await request(`/api/dashboard?month=${encodeURIComponent(m)}`)
      const normalized = normalizeSummary(res)
      return normalized || res
    }
    throw err
  }
}

export async function getLastLoaded(month) {
  try {
    return await request(`/api/dashboard/last-loaded`)
  } catch (err) {
    // if not present, combined endpoint may contain last_updated
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      // prefer to call combined endpoint with a month param to avoid 422 from servers
      const m = month ? normalizeMonth(month) : undefined
      const path = m ? `/api/dashboard?month=${encodeURIComponent(m)}` : `/api/dashboard`
      try {
        const res = await request(path)
        if (res && res.last_updated) return { loaded_at: res.last_updated }
      } catch (_){ /* ignore */ }
      return { loaded_at: null }
    }
    throw err
  }
}

export async function getBySmeta(month) {
  const m = normalizeMonth(month)
  try {
    return await request(`/api/dashboard/monthly/by-smeta?month=${encodeURIComponent(m)}`)
  } catch (err) {
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      const res = await request(`/api/dashboard?month=${encodeURIComponent(m)}`)
      // aggregate items by smeta label
      const items = (res && res.items) || []
      const grouped = {}
      for (const it of items) {
        const key = smetaKeyFromLabel(it.smeta)
        if (!grouped[key]) grouped[key] = { smeta_key: key, label: it.smeta, plan: 0, fact: 0 }
        grouped[key].plan += Number(it.planned_amount || it.planned || 0)
        grouped[key].fact += Number(it.fact_amount || it.fact || 0)
      }
      // Ensure vner (внерегламент) card exists per documentation.
      // plan_vnereglament = round((plan_leto + plan_zima) * 0.43)
      const plano = (v) => Math.round(Number(v || 0))
      const plan_leto = plano(grouped['leto'] && grouped['leto'].plan)
      const plan_zima = plano(grouped['zima'] && grouped['zima'].plan)
      const fact_vn = plano(grouped['vnereglement'] && grouped['vnereglement'].fact)
      if (!grouped['vnereglement']) {
        const plan_vnere = Math.round((plan_leto + plan_zima) * 0.43)
        grouped['vnereglement'] = { smeta_key: 'vnereglement', label: 'Внерегламент', plan: plan_vnere, fact: fact_vn, delta: (fact_vn - plan_vnere) }
      } else {
        // ensure delta exists for existing vner card
        const g = grouped['vnereglement']
        g.delta = (Number(g.fact || 0) - Number(g.plan || 0))
      }

      // compute progressPercent for consistency with main API
      for (const k of Object.keys(grouped)) {
        const c = grouped[k]
        const plan = Number(c.plan || 0)
        const fact = Number(c.fact || 0)
        c.progressPercent = c.progressPercent ?? (plan ? Math.round((fact / plan) * 100) : 0)
      }

      return { cards: Object.values(grouped) }
    }
    throw err
  }
}

export async function getSmetaDetails(month, smeta_key) {
  const m = normalizeMonth(month)
  try {
    return await request(`/api/dashboard/monthly/smeta-details?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}`)
  } catch (err) {
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      const res = await request(`/api/dashboard?month=${encodeURIComponent(m)}`)
      const items = (res && res.items) || []
      // group by description/work_name and sum plan/fact
      const grouped = {}
      for (const it of items) {
        const key = smetaKeyFromLabel(it.smeta)
        if (key !== smeta_key) continue
        const desc = (it.work_name || it.description || '').toString()
        if (!grouped[desc]) grouped[desc] = { title: desc, plan: 0, fact: 0 }
        grouped[desc].plan += Number(it.planned_amount || it.planned || 0)
        grouped[desc].fact += Number(it.fact_amount || it.fact || 0)
      }

      const isVnereg = (smeta_key || '').toString().toLowerCase().includes('vne') || smeta_key === 'vnereg' || smeta_key === 'vner1' || smeta_key === 'vner2'

      const rows = Object.values(grouped)
        .map(r => {
          const plan = isVnereg ? 0 : r.plan
          const fact = r.fact
          const delta = fact - plan
          const pct = plan ? Math.round((fact / plan) * 100) : 0
          return { title: r.title, plan, fact, delta, progressPercent: pct }
        })
        // show only rows where plan>1 or fact>1
        .filter(r => (Number(r.plan || 0) > 1) || (Number(r.fact || 0) > 1))

      return { rows }
    }
    throw err
  }
}

export async function getMonthlyDailyRevenue(month) {
  const m = normalizeMonth(month)
  try {
    return await request(`/api/dashboard/monthly/daily-revenue?month=${encodeURIComponent(m)}`)
  } catch (err) {
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      // not available in combined endpoint
      return { rows: [] }
    }
    throw err
  }
}

// Try to fetch list of months available on server (returns array of YYYY-MM or objects)
export async function getAvailableMonths() {
  try {
    return await request(`/api/dashboard/months`)
  } catch (err) {
    // fallback: try combined endpoint for a possible `months` field
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      try {
        const res = await request(`/api/dashboard`)
        if (res && (res.months || res.available_months)) return res.months || res.available_months
      } catch (_){ /* ignore */ }
      return null
    }
    throw err
  }
}

// Try to fetch list of available daily dates for a given month.
// Expected to return an array of `YYYY-MM-DD` strings or an object with `dates: []`.
export async function getAvailableDates(month) {
  const m = normalizeMonth(month)
  try {
    const res = await request(`/api/dashboard/monthly/dates?month=${encodeURIComponent(m)}`)
    if (!res) return []
    if (Array.isArray(res)) return res.map(d => String(d).slice(0, 10))
    if (res.dates && Array.isArray(res.dates)) return res.dates.map(d => String(d).slice(0, 10))
    return []
  } catch (err) {
    // fallback: try combined endpoint and extract dates from items/rows
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      try {
        const res = await request(`/api/dashboard?month=${encodeURIComponent(m)}`)
        const items = (res && (res.items || res.rows)) || []
        const set = new Set()
        for (const it of items) {
          const d = it && (it.date || it.day || it.work_date || it.logged_at)
          if (d) set.add(String(d).slice(0, 10))
        }
        return Array.from(set).sort()
      } catch (_){
        return []
      }
    }
    throw err
  }
}

export async function getDaily(date) {
  return await request(`/api/dashboard/daily?date=${encodeURIComponent(date)}`)
}

export async function getSmetaDescriptionDaily(month, smeta_key, description) {
  const m = normalizeMonth(month)
  try {
    return await request(`/api/dashboard/monthly/smeta-description-daily?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}&description=${encodeURIComponent(description)}`)
  } catch (err) {
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      // try to emulate using combined endpoint (not available) — return empty
      return { rows: [] }
    }
    throw err
  }
}

/**
 * Get fact amounts aggregated by type of work for the given month.
 * Used for the "По типу работ" modal on Fact card.
 */
export async function getFactByTypeOfWork(month) {
  const m = normalizeMonth(month)
  try {
    return await request(`/api/dashboard/monthly/fact-by-type-of-work?month=${encodeURIComponent(m)}`)
  } catch (err) {
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      return { rows: [], total: 0 }
    }
    throw err
  }
}

/**
 * Get smeta details with type_of_work grouping for hierarchical display (desktop only).
 */
export async function getSmetaDetailsWithTypes(month, smeta_key) {
  const m = normalizeMonth(month)
  try {
    return await request(`/api/dashboard/monthly/smeta-details-with-types?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}`)
  } catch (err) {
    if (err && (err.status === 404 || (err.message && err.message.includes('Not Found')))) {
      // Fallback to regular smeta details
      return null
    }
    throw err
  }
}
