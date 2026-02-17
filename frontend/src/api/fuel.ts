import { request, API_VERSION } from './client'

const API_BASE = `/api/${API_VERSION}/fuel`

// =============================================================================
// Types — General Data (Общие данные)
// =============================================================================

export interface FuelGeneralItem {
  employee_name: string
  vehicle_type_name: string
  plate_number: string
  mileage_km: number
  liters_total: number
  type_of_gas: string | null
  amount_for_fuel: number
}

export interface FuelGeneralResponse {
  date?: string | null
  date_from?: string | null
  date_to?: string | null
  items: FuelGeneralItem[]
  total_amount: number
}

// =============================================================================
// Types — By Driver (По водителям)
// =============================================================================

export interface FuelByDriverItem {
  date: string
  mileage_km: number
  liters_total: number
  type_of_gas: string | null
  amount_for_fuel: number
}

export interface FuelByDriverResponse {
  employee_name: string | null
  date_from: string
  date_to: string
  items: FuelByDriverItem[]
  total_mileage: number
  total_liters: number
  total_amount: number
}

// =============================================================================
// Types — Drivers List (Список водителей)
// =============================================================================

export interface FuelDriverItem {
  employee_id: number
  employee_name: string
}

export interface FuelDriversResponse {
  items: FuelDriverItem[]
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get fuel consumption general data.
 * Supports single date or date range.
 */
export async function getFuelGeneral(params: {
  date?: string
  date_from?: string
  date_to?: string
}): Promise<FuelGeneralResponse> {
  const queryParams = new URLSearchParams()
  if (params.date_from && params.date_to) {
    queryParams.set('date_from', params.date_from)
    queryParams.set('date_to', params.date_to)
  } else if (params.date) {
    queryParams.set('date', params.date)
  }
  return await request<FuelGeneralResponse>(`${API_BASE}/general?${queryParams.toString()}`)
}

/**
 * Get daily fuel consumption for a specific driver within a date range.
 */
export async function getFuelByDriver(params: {
  employee_id: number
  date_from: string
  date_to: string
}): Promise<FuelByDriverResponse> {
  const queryParams = new URLSearchParams()
  queryParams.set('employee_id', String(params.employee_id))
  queryParams.set('date_from', params.date_from)
  queryParams.set('date_to', params.date_to)
  return await request<FuelByDriverResponse>(`${API_BASE}/by-driver?${queryParams.toString()}`)
}

/**
 * Get list of drivers that have fuel card assignments (for filter dropdown).
 */
export async function getFuelDrivers(): Promise<FuelDriversResponse> {
  return await request<FuelDriversResponse>(`${API_BASE}/drivers`)
}
