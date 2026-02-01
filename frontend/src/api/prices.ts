/**
 * API functions for prices (расценки) section
 */

import { request, API_VERSION } from './client'

const API_BASE = `/api/${API_VERSION}/prices`

// --- Types ---

export interface PriceRow {
  price_id: number
  estimate_name: string | null
  estimate_section_name: string | null
  work_type_name: string | null
  work_name: string | null
  unit_name: string | null
  unit_price: number | null
}

export interface PricesListResponse {
  rows: PriceRow[]
  total: number
}

export interface EstimateOption {
  estimate_id: number
  estimate_name: string
}

export interface WorkTypeOption {
  work_type_id: number
  work_type_name: string
}

export interface PricesFiltersResponse {
  estimates: EstimateOption[]
  work_types: WorkTypeOption[]
}

// --- API Functions ---

/**
 * Get list of prices with optional filters
 */
export async function getPrices(params?: {
  search?: string
  estimate_id?: number
  work_type_id?: number
}): Promise<PricesListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.set('search', params.search)
  if (params?.estimate_id !== undefined) queryParams.set('estimate_id', String(params.estimate_id))
  if (params?.work_type_id !== undefined) queryParams.set('work_type_id', String(params.work_type_id))
  
  const queryString = queryParams.toString()
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE
  
  return await request<PricesListResponse>(url)
}

/**
 * Get available filter options
 */
export async function getPricesFilters(): Promise<PricesFiltersResponse> {
  return await request<PricesFiltersResponse>(`${API_BASE}/filters`)
}
