/**
 * API functions for mileage (пробег машин) section
 */

import { request, API_VERSION } from './client'

const API_BASE = `/api/${API_VERSION}/mileage`

// =============================================================================
// Types - Mileage By Date
// =============================================================================

export interface MileageByDateItem {
  vehicle_type_name: string
  plate_number: string
  mileage_km: number
}

export interface MileageByDateResponse {
  date: string
  date_from?: string | null
  date_to?: string | null
  time_from: string | null
  time_to: string | null
  items: MileageByDateItem[]
}

// =============================================================================
// Types - Mileage By Vehicle
// =============================================================================

export interface MileageByVehicleHourItem {
  hour_from: number
  hour_to: number
  mileage_km: number
}

export interface MileageByVehicleItem {
  date: string
  mileage_km: number
  hours?: MileageByVehicleHourItem[] | null
}

export interface MileageByVehicleResponse {
  vehicle_type_name: string | null
  plate_number: string | null
  date_from: string
  date_to: string
  items: MileageByVehicleItem[]
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get aggregated vehicle mileage for a given date (or date range) and optional time range.
 *
 * Supports two modes:
 *   - Single date: pass `date` (YYYY-MM-DD)
 *   - Date range:  pass `date_from` + `date_to` (YYYY-MM-DD)
 *
 * Time is in HH:MM format (typically HH:00 for hours-only selection).
 */
export async function getMileageByDate(params: {
  date?: string        // YYYY-MM-DD (single date mode)
  date_from?: string   // YYYY-MM-DD (range mode)
  date_to?: string     // YYYY-MM-DD (range mode)
  time_from?: string   // HH:MM
  time_to?: string     // HH:MM
}): Promise<MileageByDateResponse> {
  const queryParams = new URLSearchParams()

  if (params.date_from && params.date_to) {
    queryParams.set('date_from', params.date_from)
    queryParams.set('date_to', params.date_to)
  } else if (params.date) {
    queryParams.set('date', params.date)
  }

  if (params.time_from) queryParams.set('time_from', params.time_from)
  if (params.time_to) queryParams.set('time_to', params.time_to)

  return await request<MileageByDateResponse>(`${API_BASE}/by-date?${queryParams.toString()}`)
}

/**
 * Get daily mileage for a specific vehicle within a date range.
 * When by_hours is true, each day includes hourly breakdown.
 */
export async function getMileageByVehicle(params: {
  vehicles_id: number
  date_from: string   // YYYY-MM-DD
  date_to: string     // YYYY-MM-DD
  by_hours?: boolean
}): Promise<MileageByVehicleResponse> {
  const queryParams = new URLSearchParams()
  queryParams.set('vehicles_id', String(params.vehicles_id))
  queryParams.set('date_from', params.date_from)
  queryParams.set('date_to', params.date_to)
  if (params.by_hours) queryParams.set('by_hours', 'true')

  return await request<MileageByVehicleResponse>(`${API_BASE}/by-vehicle?${queryParams.toString()}`)
}
