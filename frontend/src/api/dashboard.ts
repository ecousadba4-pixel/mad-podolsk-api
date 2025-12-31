import { request, API_VERSION } from './client'
import type {
  MonthlySummary,
  SmetaCard,
  SmetaDetailRow,
  DailyRow
} from '@/types/dashboard'

// ─────────────────────────────────────────────────────────────────────────────
// API v1 Types - Фиксированный контракт
// ─────────────────────────────────────────────────────────────────────────────

export interface LastLoadedResponse {
  loaded_at: string | null
}

export interface BySmetaResponse {
  month: string
  cards: SmetaCard[]
}

export interface SmetaDetailsResponse {
  month: string
  smeta_key: string
  rows: SmetaDetailRow[]
}

export interface DailyRevenueRow {
  date: string
  amount: number
}

export interface DailyRevenueResponse {
  month: string
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

/** Row with type_of_work field from smeta-details-with-types endpoint */
export interface SmetaDetailWithTypeRow {
  type_of_work: string | null
  description: string
  title?: string
  description_id: string
  plan: number
  fact: number
  delta: number
  progress_percent: number
}

/** Response from smeta-details-with-types endpoint */
export interface SmetaDetailsWithTypesResponse {
  month: string
  smeta_key: string
  rows: SmetaDetailWithTypeRow[]
  total?: {
    plan: number
    fact: number
    delta: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Base Path
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = `/api/${API_VERSION}/dashboard`

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes month string to YYYY-MM format for backend.
 * Strips day part if provided.
 */
function normalizeMonth(month: string | undefined | null): string {
  if (!month) return ''
  
  // YYYY-MM-DD → YYYY-MM
  if (/^\d{4}-\d{2}-\d{2}/.test(month)) return month.slice(0, 7)
  // YYYY-MM → keep as-is
  if (/^\d{4}-\d{2}$/.test(month)) return month
  
  return month
}

// ─────────────────────────────────────────────────────────────────────────────
// API v1 Functions - Строгий контракт без fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get monthly summary with contract and KPI data.
 * @throws ApiError on network/server errors
 */
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const m = normalizeMonth(month)
  return await request<MonthlySummary>(
    `${API_BASE}/monthly/summary?month=${encodeURIComponent(m)}`
  )
}

/**
 * Get last data load timestamp.
 * @throws ApiError on network/server errors
 */
export async function getLastLoaded(): Promise<LastLoadedResponse> {
  return await request<LastLoadedResponse>(`${API_BASE}/last-loaded`)
}

/**
 * Get smeta cards grouped by smeta type.
 * @throws ApiError on network/server errors
 */
export async function getBySmeta(month: string): Promise<BySmetaResponse> {
  const m = normalizeMonth(month)
  return await request<BySmetaResponse>(
    `${API_BASE}/monthly/by-smeta?month=${encodeURIComponent(m)}`
  )
}

/**
 * Get detailed rows for a specific smeta.
 * @throws ApiError on network/server errors
 */
export async function getSmetaDetails(
  month: string,
  smeta_key: string
): Promise<SmetaDetailsResponse> {
  const m = normalizeMonth(month)
  return await request<SmetaDetailsResponse>(
    `${API_BASE}/monthly/smeta-details?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}`
  )
}

/**
 * Get daily revenue breakdown for a month.
 * @throws ApiError on network/server errors
 */
export async function getMonthlyDailyRevenue(month: string): Promise<DailyRevenueResponse> {
  const m = normalizeMonth(month)
  return await request<DailyRevenueResponse>(
    `${API_BASE}/monthly/daily-revenue?month=${encodeURIComponent(m)}`
  )
}

/**
 * Get list of months available on server.
 * @throws ApiError on network/server errors
 */
export async function getAvailableMonths(limit?: number): Promise<string[]> {
  const params = limit ? `?limit=${limit}` : ''
  return await request<string[]>(`${API_BASE}/months${params}`)
}

/**
 * Get available dates for daily dashboard in a given month.
 * @throws ApiError on network/server errors
 */
export async function getAvailableDates(month: string): Promise<string[]> {
  const m = normalizeMonth(month)
  return await request<string[]>(
    `${API_BASE}/monthly/dates?month=${encodeURIComponent(m)}`
  )
}

/**
 * Get daily dashboard data for a specific date.
 * @throws ApiError on network/server errors
 */
export async function getDaily(date: string): Promise<DailyResponse> {
  return await request<DailyResponse>(
    `${API_BASE}/daily?date=${encodeURIComponent(date)}`
  )
}

/**
 * Get daily breakdown for a specific smeta description.
 * @throws ApiError on network/server errors
 */
export async function getSmetaDescriptionDaily(
  month: string,
  smeta_key: string,
  description_id: string
): Promise<{ rows: DailyRow[] }> {
  const m = normalizeMonth(month)
  return await request<{ rows: DailyRow[] }>(
    `${API_BASE}/monthly/smeta-description-daily?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}&description_id=${encodeURIComponent(description_id)}`
  )
}

/**
 * Get fact amounts aggregated by type of work for the given month.
 * @throws ApiError on network/server errors
 */
export async function getFactByTypeOfWork(month: string): Promise<FactByTypeResponse> {
  const m = normalizeMonth(month)
  return await request<FactByTypeResponse>(
    `${API_BASE}/monthly/fact-by-type-of-work?month=${encodeURIComponent(m)}`
  )
}

/**
 * Get smeta details with type_of_work grouping for hierarchical display.
 * @throws ApiError on network/server errors
 */
export async function getSmetaDetailsWithTypes(
  month: string,
  smeta_key: string
): Promise<SmetaDetailsWithTypesResponse> {
  const m = normalizeMonth(month)
  return await request<SmetaDetailsWithTypesResponse>(
    `${API_BASE}/monthly/smeta-details-with-types?month=${encodeURIComponent(m)}&smeta_key=${encodeURIComponent(smeta_key)}`
  )
}
