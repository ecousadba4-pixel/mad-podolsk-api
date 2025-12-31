/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from: app/backend/schemas/dashboard.py
 * 
 * These types exactly match the backend Pydantic schemas.
 * To regenerate: python scripts/generate-api-types.py
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

// ─────────────────────────────────────────────────────────────────────────────
// Smeta Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiSmetaCard {
  readonly smeta_key: string
  readonly label: string
  readonly plan: number
  readonly fact: number
  readonly delta: number
  readonly progress_percent: number
}

export interface ApiMonthlyBySmetaResponse {
  readonly month: string
  readonly cards: readonly ApiSmetaCard[]
}

export interface ApiSmetaDetailRow {
  readonly description: string
  readonly description_id: string
  readonly plan: number
  readonly fact: number
  readonly delta: number
  readonly progress_percent: number
}

export interface ApiMonthlySmetaDetailsResponse {
  readonly month: string
  readonly smeta_key: string
  readonly rows: readonly ApiSmetaDetailRow[]
}

export interface ApiSmetaDetailWithTypeRow {
  readonly type_of_work: string | null
  readonly description: string
  readonly description_id: string
  readonly plan: number
  readonly fact: number
  readonly delta: number
  readonly progress_percent: number
}

export interface ApiSmetaDetailsWithTypesResponse {
  readonly month: string
  readonly smeta_key: string
  readonly rows: readonly ApiSmetaDetailWithTypeRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiContractSummary {
  readonly summa_contract: number
  readonly fact_total: number
  readonly contract_planfact_pct: number | null
}

export interface ApiKpiSummary {
  readonly plan_total: number
  readonly fact_total: number
  readonly delta: number
  readonly avg_daily_revenue: number
}

export interface ApiMonthlySummaryResponse {
  readonly month: string
  readonly contract: ApiContractSummary
  readonly kpi: ApiKpiSummary
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Revenue Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiMonthlyDailyRevenueRow {
  readonly date: string
  readonly amount: number
}

export interface ApiMonthlyDailyRevenueResponse {
  readonly month: string
  readonly rows: readonly ApiMonthlyDailyRevenueRow[]
}

export interface ApiSmetaDescriptionDailyRow {
  readonly date: string
  readonly volume: number
  readonly unit: string | null
  readonly amount: number
}

export interface ApiMonthlySmetaDescriptionDailyResponse {
  readonly month: string
  readonly smeta_key: string
  readonly description: string
  readonly rows: readonly ApiSmetaDescriptionDailyRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiDailyRow {
  readonly description: string
  readonly unit: string | null
  readonly volume: number
  readonly amount: number
}

export interface ApiDailyTotal {
  readonly amount: number
}

export interface ApiDailyResponse {
  readonly date: string
  readonly rows: readonly ApiDailyRow[]
  readonly total: ApiDailyTotal
}

// ─────────────────────────────────────────────────────────────────────────────
// Type of Work Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiTypeOfWorkRow {
  readonly type_of_work: string | null
  readonly amount: number
}

export interface ApiTypeOfWorkResponse {
  readonly month: string
  readonly rows: readonly ApiTypeOfWorkRow[]
  readonly total: number
}

// ─────────────────────────────────────────────────────────────────────────────
// System Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiLoadedAtResponse {
  readonly loaded_at: string | null
}

export interface ApiCacheInvalidationResponse {
  readonly success: boolean
  readonly message: string
}
