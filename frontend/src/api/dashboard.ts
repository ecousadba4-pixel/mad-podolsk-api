import { request } from './client'
import type {
  MonthlySummary,
  ContractData,
  KpiData,
  SmetaCard,
  SmetaDetailRow,
  DailyRow
} from '@/types/dashboard'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Raw summary fields (legacy format) */
interface RawSummaryFields {
  contract_amount?: number | null
  contract_executed?: number | null
  contract_completion_pct?: number | null
  planned_amount?: number | null
  fact_amount?: number | null
  delta_amount?: number | null
  average_daily_revenue?: number | null
}

/** Raw summary response from backend */
interface RawSummaryResponse extends RawSummaryFields {
  month?: string
  summary?: RawSummaryFields
  contract?: ContractData
  kpi?: KpiData
  last_updated?: string
  items?: RawItem[]
}

interface RawItem {
  smeta?: string
  planned_amount?: number
  planned?: number
  fact_amount?: number
  fact?: number
  work_name?: string
  description?: string
  description_id?: string
  date?: string
  day?: string
  work_date?: string
  logged_at?: string
}

export interface LastLoadedResponse {
  loaded_at: string | null
}

export interface BySmetaResponse {
  cards: SmetaCard[]
}

export interface SmetaDetailsResponse {
  rows: SmetaDetailRow[]
}

export interface DailyRevenueRow {
  date: string
  revenue: number
  weekday?: string
}

export interface DailyRevenueResponse {
  rows: DailyRevenueRow[]
}

export interface DailyResponse {
  rows: DailyRow[]
  total: number
  date: string
}

export interface FactByTypeRow {
  type_of_work: string
  fact: number
  percentage?: number
}

export interface FactByTypeResponse {
  rows: FactByTypeRow[]
  total: number
}

export interface SmetaTypeGroup {
  type_of_work: string
  rows: SmetaDetailRow[]
  subtotal: {
    plan: number
    fact: number
    delta: number
  }
}

export interface SmetaDetailsWithTypesResponse {
  groups: SmetaTypeGroup[]
  total: {
    plan: number
    fact: number
    delta: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes month string to YYYY-MM-DD format for backend.
 * Backend expects a full date/datetime. If caller provides only year-month
 * (e.g. "2025-11"), converts to first day of month "2025-11-01".
 */
function normalizeMonth(month: string | undefined | null): string {
  if (!month) return month ?? ''
  
  // YYYY-MM → YYYY-MM-01
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`
  // YYYY-MM-DD → keep as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) return month
  
  return month
}

/** Map smeta labels (Russian) to URL-safe keys */
const SMETA_LABEL_MAP: Record<string, string> = {
  'Лето': 'leto',
  'Зима': 'zima',
  'Внерегламент': 'vnereglement',
  'Внерегламент ч.1': 'vnereglement',
  'Внерегламент ч.2': 'vnereglement',
  // Lowercase fallbacks
  'лето': 'leto',
  'зима': 'zima',
  'внерегламент': 'vnereglement',
  'вне регламент': 'vnereglement'
}

function smetaKeyFromLabel(label: string | undefined | null): string {
  if (!label) return label ?? ''
  
  if (SMETA_LABEL_MAP[label]) return SMETA_LABEL_MAP[label]
  
  // Fallback: ASCII-safe slug
  return label.toString().toLowerCase().replace(/[^a-z0-9]+/gi, '-')
}

function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { status?: number; message?: string }
  return e.status === 404 || (e.message?.includes('Not Found') ?? false)
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get monthly summary with contract and KPI data.
 * Attempts direct endpoint first, falls back to combined /api/dashboard.
 */
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const m = normalizeMonth(month)

  function normalizeSummary(res: RawSummaryResponse | null): MonthlySummary {
    if (!res) {
      return {
        month: m,
        contract: { summa_contract: null, fact_total: null, contract_planfact_pct: null },
        kpi: { plan_total: null, fact_total: null, delta: null, avg_daily_revenue: null }
      }
    }

    // If response already has expected shape, return as-is
    if (res.contract && res.kpi) {
      return {
        month: res.month || m,
        contract: res.contract,
        kpi: res.kpi,
        last_updated: res.last_updated
      }
    }

    const s = res.summary || res
    if (!s) {
      return {
        month: m,
        contract: { summa_contract: null, fact_total: null, contract_planfact_pct: null },
        kpi: { plan_total: null, fact_total: null, delta: null, avg_daily_revenue: null }
      }
    }

    const contract: ContractData = {
      summa_contract: s.contract_amount ?? (s as ContractData).summa_contract ?? null,
      fact_total: s.contract_executed ?? (s as ContractData).fact_total ?? null,
      contract_planfact_pct: s.contract_completion_pct ?? (s as ContractData).contract_planfact_pct ?? null
    }

    const kpi: KpiData = {
      plan_total: s.planned_amount ?? (s as KpiData).plan_total ?? null,
      fact_total: s.fact_amount ?? (s as KpiData).fact_total ?? null,
      delta: s.delta_amount ?? (s as KpiData).delta ?? null,
      avg_daily_revenue: s.average_daily_revenue ?? (s as KpiData).avg_daily_revenue ?? null
    }

    return { month: res.month || m, contract, kpi }
  }

  try {
    const direct = await request<RawSummaryResponse>(
      `/api/dashboard/monthly/summary?month=${encodeURIComponent(m)}`
    )
    return normalizeSummary(direct)
  } catch (err) {
    if (isNotFoundError(err)) {
      const res = await request<RawSummaryResponse>(
        `/api/dashboard?month=${encodeURIComponent(m)}`
      )
      return normalizeSummary(res)
    }
    throw err
  }
}

/**
 * Get last loaded timestamp.
 */
export async function getLastLoaded(month?: string): Promise<LastLoadedResponse> {
  try {
    return await request<LastLoadedResponse>(`/api/dashboard/last-loaded`)
  } catch (err) {
    if (isNotFoundError(err)) {
      // Try combined endpoint for last_updated field
      const m = month ? normalizeMonth(month) : undefined
      const path = m ? `/api/dashboard?month=${encodeURIComponent(m)}` : `/api/dashboard`
      try {
        const res = await request<RawSummaryResponse>(path)
        if (res?.last_updated) return { loaded_at: res.last_updated }
      } catch {
        /* ignore */
      }
      return { loaded_at: null }
    }
    throw err
  }
}

/**
 * Get smeta cards grouped by smeta type.
 */
export async function getBySmeta(month: string): Promise<BySmetaResponse> {
  const m = normalizeMonth(month)
  
  try {
    return await request<BySmetaResponse>(
      `/api/dashboard/monthly/by-smeta?month=${encodeURIComponent(m)}`
    )
  } catch (err) {
    if (isNotFoundError(err)) {
      const res = await request<RawSummaryResponse>(
        `/api/dashboard?month=${encodeURIComponent(m)}`
      )
      const items = res?.items ?? []
      
      // Group items by smeta label
      const grouped: Record<string, SmetaCard> = {}
      
      for (const it of items) {
        const key = smetaKeyFromLabel(it.smeta)
        if (!grouped[key]) {
          grouped[key] = {
            smeta_key: key,
            label: it.smeta ?? '',
            plan: 0,
            fact: 0,
            delta: 0,
            progressPercent: 0
          }
        }
        grouped[key].plan += Number(it.planned_amount || it.planned || 0)
        grouped[key].fact += Number(it.fact_amount || it.fact || 0)
      }

      // Ensure vnereglement card exists per documentation
      // plan_vnereglament = round((plan_leto + plan_zima) * 0.43)
      const planLeto = Math.round(Number(grouped['leto']?.plan || 0))
      const planZima = Math.round(Number(grouped['zima']?.plan || 0))
      const factVn = Math.round(Number(grouped['vnereglement']?.fact || 0))

      if (!grouped['vnereglement']) {
        const planVnere = Math.round((planLeto + planZima) * 0.43)
        grouped['vnereglement'] = {
          smeta_key: 'vnereglement',
          label: 'Внерегламент',
          plan: planVnere,
          fact: factVn,
          delta: factVn - planVnere,
          progressPercent: planVnere ? Math.round((factVn / planVnere) * 100) : 0
        }
      } else {
        // Ensure delta exists for existing vner card
        const g = grouped['vnereglement']
        g.delta = Number(g.fact || 0) - Number(g.plan || 0)
      }

      // Compute progressPercent for all cards
      for (const card of Object.values(grouped)) {
        const plan = Number(card.plan || 0)
        const fact = Number(card.fact || 0)
        card.progressPercent = card.progressPercent || (plan ? Math.round((fact / plan) * 100) : 0)
      }

      return { cards: Object.values(grouped) }
    }
    throw err
  }
}

/**
 * Get detailed rows for a specific smeta.
 */
export async function getSmetaDetails(
  month: string,
  smeta_key: string
): Promise<SmetaDetailsResponse> {
  const m = normalizeMonth(month)
  
  try {
    return await request<SmetaDetailsResponse>(
      `/api/dashboard/monthly/smeta-details?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}`
    )
  } catch (err) {
    if (isNotFoundError(err)) {
      const res = await request<RawSummaryResponse>(
        `/api/dashboard?month=${encodeURIComponent(m)}`
      )
      const items = res?.items ?? []
      
      // Group by description/work_name and sum plan/fact
      const grouped: Record<string, { title: string; plan: number; fact: number }> = {}
      
      for (const it of items) {
        const key = smetaKeyFromLabel(it.smeta)
        if (key !== smeta_key) continue
        
        const desc = (it.work_name || it.description || '').toString()
        if (!grouped[desc]) grouped[desc] = { title: desc, plan: 0, fact: 0 }
        grouped[desc].plan += Number(it.planned_amount || it.planned || 0)
        grouped[desc].fact += Number(it.fact_amount || it.fact || 0)
      }

      const isVnereg = (smeta_key || '').toString().toLowerCase().includes('vne') ||
        smeta_key === 'vnereg' || smeta_key === 'vner1' || smeta_key === 'vner2'

      const rows: SmetaDetailRow[] = Object.values(grouped)
        .map(r => {
          const plan = isVnereg ? 0 : r.plan
          const fact = r.fact
          const delta = fact - plan
          const pct = plan ? Math.round((fact / plan) * 100) : 0
          return { title: r.title, plan, fact, delta, progressPercent: pct }
        })
        // Show only rows where plan > 1 or fact > 1
        .filter(r => Number(r.plan || 0) > 1 || Number(r.fact || 0) > 1)

      return { rows }
    }
    throw err
  }
}

/**
 * Get daily revenue breakdown for a month.
 */
export async function getMonthlyDailyRevenue(month: string): Promise<DailyRevenueResponse> {
  const m = normalizeMonth(month)
  
  try {
    return await request<DailyRevenueResponse>(
      `/api/dashboard/monthly/daily-revenue?month=${encodeURIComponent(m)}`
    )
  } catch (err) {
    if (isNotFoundError(err)) {
      // Not available in combined endpoint
      return { rows: [] }
    }
    throw err
  }
}

/**
 * Get list of months available on server.
 */
export async function getAvailableMonths(): Promise<string[] | null> {
  try {
    return await request<string[]>(`/api/dashboard/months`)
  } catch (err) {
    if (isNotFoundError(err)) {
      try {
        const res = await request<{ months?: string[]; available_months?: string[] }>(`/api/dashboard`)
        if (res?.months || res?.available_months) {
          return res.months || res.available_months || null
        }
      } catch {
        /* ignore */
      }
      return null
    }
    throw err
  }
}

/**
 * Get available dates for daily dashboard in a given month.
 */
export async function getAvailableDates(month: string): Promise<string[]> {
  const m = normalizeMonth(month)
  
  try {
    const res = await request<string[] | { dates?: string[] }>(
      `/api/dashboard/monthly/dates?month=${encodeURIComponent(m)}`
    )
    if (!res) return []
    if (Array.isArray(res)) return res.map(d => String(d).slice(0, 10))
    if (res.dates && Array.isArray(res.dates)) {
      return res.dates.map(d => String(d).slice(0, 10))
    }
    return []
  } catch (err) {
    if (isNotFoundError(err)) {
      try {
        const res = await request<{ items?: RawItem[]; rows?: RawItem[] }>(
          `/api/dashboard?month=${encodeURIComponent(m)}`
        )
        const items = res?.items || res?.rows || []
        const set = new Set<string>()
        
        for (const it of items) {
          const d = it.date || it.day || it.work_date || it.logged_at
          if (d) set.add(String(d).slice(0, 10))
        }
        
        return Array.from(set).sort()
      } catch {
        return []
      }
    }
    throw err
  }
}

/**
 * Get daily dashboard data for a specific date.
 */
export async function getDaily(date: string): Promise<DailyResponse> {
  return await request<DailyResponse>(
    `/api/dashboard/daily?date=${encodeURIComponent(date)}`
  )
}

/**
 * Get daily breakdown for a specific smeta description.
 */
export async function getSmetaDescriptionDaily(
  month: string,
  smeta_key: string,
  description_id: string
): Promise<{ rows: DailyRow[] }> {
  const m = normalizeMonth(month)
  
  try {
    return await request<{ rows: DailyRow[] }>(
      `/api/dashboard/monthly/smeta-description-daily?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}&description_id=${encodeURIComponent(description_id)}`
    )
  } catch (err) {
    if (isNotFoundError(err)) {
      // Not available in combined endpoint — return empty
      return { rows: [] }
    }
    throw err
  }
}

/**
 * Get fact amounts aggregated by type of work for the given month.
 * Used for the "По типу работ" modal on Fact card.
 */
export async function getFactByTypeOfWork(month: string): Promise<FactByTypeResponse> {
  const m = normalizeMonth(month)
  
  try {
    return await request<FactByTypeResponse>(
      `/api/dashboard/monthly/fact-by-type-of-work?month=${encodeURIComponent(m)}`
    )
  } catch (err) {
    if (isNotFoundError(err)) {
      return { rows: [], total: 0 }
    }
    throw err
  }
}

/**
 * Get smeta details with type_of_work grouping for hierarchical display (desktop only).
 */
export async function getSmetaDetailsWithTypes(
  month: string,
  smeta_key: string
): Promise<SmetaDetailsWithTypesResponse | null> {
  const m = normalizeMonth(month)
  
  try {
    return await request<SmetaDetailsWithTypesResponse>(
      `/api/dashboard/monthly/smeta-details-with-types?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}`
    )
  } catch (err) {
    if (isNotFoundError(err)) {
      // Fallback to regular smeta details
      return null
    }
    throw err
  }
}
