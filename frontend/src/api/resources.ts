/**
 * API functions for resources (учет техники и людей) section
 */

import { request, API_VERSION } from './client'

const API_BASE = `/api/${API_VERSION}/resources`

// =============================================================================
// Types - Reference Data
// =============================================================================

export interface EquipmentType {
  id: number
  name: string
  is_active: boolean
}

export interface Vehicle {
  id: number
  equipment_type_id: number
  equipment_type_name: string | null
  plate_number: string
  is_active: boolean
}

export interface Driver {
  id: number
  full_name: string
  phone: string | null
  is_active: boolean
}

export interface Master {
  id: number
  full_name: string
  phone: string | null
  is_active: boolean
}

export interface EquipmentTypesResponse {
  items: EquipmentType[]
}

export interface VehiclesResponse {
  items: Vehicle[]
}

export interface DriversResponse {
  items: Driver[]
}

export interface MastersResponse {
  items: Master[]
}

// =============================================================================
// Types - Equipment Shifts
// =============================================================================

export interface EquipmentShiftCreate {
  is_own: boolean
  vehicle_id?: number | null
  driver_id?: number | null
  equipment_type_id: number
  plate_number: string
  driver_name?: string | null
  shift_start_date: string  // YYYY-MM-DD
  shift_start_time: string  // HH:MM or HH:MM:SS
  shift_duration_hours: number
}

export interface EquipmentShiftUpdate {
  equipment_type_id?: number | null
  driver_id?: number | null
  driver_name?: string | null
  shift_start_time?: string | null
  shift_duration_hours?: number | null
}

export interface EquipmentShiftResponse {
  id: number
  is_own: boolean
  vehicle_id: number | null
  equipment_type_id: number
  equipment_type_name: string | null
  plate_number: string
  driver_id: number | null
  driver_name: string | null
  shift_start_date: string
  shift_start_time: string
  shift_start_at: string | null
  shift_duration_hours: number
  created_at: string | null
  updated_at: string | null
  is_deleted: boolean
}

export interface EquipmentShiftSearchRequest {
  plate_number: string
  shift_start_date: string  // YYYY-MM-DD
}

export interface EquipmentShiftDeleteRequest {
  delete_reason: string
}

// =============================================================================
// Types - Master Shifts
// =============================================================================

export interface MasterShiftCreate {
  master_id: number
  workers_count: number
  shift_start_date: string  // YYYY-MM-DD
  shift_start_time: string  // HH:MM or HH:MM:SS
  shift_duration_hours: number
}

export interface MasterShiftUpdate {
  workers_count?: number | null
  shift_start_time?: string | null
  shift_duration_hours?: number | null
}

export interface MasterShiftResponse {
  id: number
  master_id: number
  master_full_name: string | null
  workers_count: number
  shift_start_date: string
  shift_start_time: string
  shift_start_at: string | null
  shift_duration_hours: number
  created_at: string | null
  updated_at: string | null
  is_deleted: boolean
}

export interface MasterShiftSearchRequest {
  master_id: number
  shift_start_date: string  // YYYY-MM-DD
}

export interface MasterShiftDeleteRequest {
  delete_reason: string
}

// =============================================================================
// Types - Summary
// =============================================================================

export interface SummaryEquipmentItem {
  equipment_type_id: number
  equipment_type_name: string
  count: number
}

export interface SummaryEquipmentGroup {
  is_own: boolean
  label: string
  items: SummaryEquipmentItem[]
  total: number
}

export interface SummaryEquipment {
  groups: SummaryEquipmentGroup[]
  grand_total: number
}

export interface SummaryMasterItem {
  master_id: number
  master_full_name: string
  workers_count: number
}

export interface SummaryPeople {
  masters: SummaryMasterItem[]
  total_masters: number
  total_workers: number
  grand_total: number
}

export interface SummaryResponse {
  date: string
  time_from: string | null
  time_to: string | null
  equipment: SummaryEquipment
  people: SummaryPeople
}

// =============================================================================
// Types - Generic
// =============================================================================

export interface MessageResponse {
  message: string
  success: boolean
}

// =============================================================================
// API Functions - Reference Data
// =============================================================================

/**
 * Get list of active equipment types
 */
export async function getEquipmentTypes(): Promise<EquipmentTypesResponse> {
  return await request<EquipmentTypesResponse>(`${API_BASE}/references/equipment-types`)
}

/**
 * Get list of active vehicles, optionally filtered by equipment type
 */
export async function getVehicles(equipmentTypeId?: number): Promise<VehiclesResponse> {
  const params = new URLSearchParams()
  if (equipmentTypeId !== undefined) {
    params.set('equipment_type_id', String(equipmentTypeId))
  }
  const queryString = params.toString()
  const url = queryString ? `${API_BASE}/references/vehicles?${queryString}` : `${API_BASE}/references/vehicles`
  return await request<VehiclesResponse>(url)
}

/**
 * Get list of active drivers
 */
export async function getDrivers(): Promise<DriversResponse> {
  return await request<DriversResponse>(`${API_BASE}/references/drivers`)
}

/**
 * Get list of active masters
 */
export async function getMasters(): Promise<MastersResponse> {
  return await request<MastersResponse>(`${API_BASE}/references/masters`)
}

// =============================================================================
// API Functions - Equipment Shifts
// =============================================================================

/**
 * Create a new equipment shift
 */
export async function createEquipmentShift(data: EquipmentShiftCreate): Promise<EquipmentShiftResponse> {
  return await request<EquipmentShiftResponse>(`${API_BASE}/equipment-shifts`, {
    method: 'POST',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Search for equipment shift by plate number and date
 */
export async function searchEquipmentShift(data: EquipmentShiftSearchRequest): Promise<EquipmentShiftResponse> {
  return await request<EquipmentShiftResponse>(`${API_BASE}/equipment-shifts/search`, {
    method: 'POST',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Update equipment shift
 */
export async function updateEquipmentShift(shiftId: number, data: EquipmentShiftUpdate): Promise<EquipmentShiftResponse> {
  return await request<EquipmentShiftResponse>(`${API_BASE}/equipment-shifts/${shiftId}`, {
    method: 'PUT',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Delete (soft) equipment shift
 */
export async function deleteEquipmentShift(shiftId: number, data: EquipmentShiftDeleteRequest): Promise<MessageResponse> {
  return await request<MessageResponse>(`${API_BASE}/equipment-shifts/${shiftId}`, {
    method: 'DELETE',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

// =============================================================================
// API Functions - Master Shifts
// =============================================================================

/**
 * Create a new master shift
 */
export async function createMasterShift(data: MasterShiftCreate): Promise<MasterShiftResponse> {
  return await request<MasterShiftResponse>(`${API_BASE}/master-shifts`, {
    method: 'POST',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Search for master shift by master_id and date
 */
export async function searchMasterShift(data: MasterShiftSearchRequest): Promise<MasterShiftResponse> {
  return await request<MasterShiftResponse>(`${API_BASE}/master-shifts/search`, {
    method: 'POST',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Update master shift
 */
export async function updateMasterShift(shiftId: number, data: MasterShiftUpdate): Promise<MasterShiftResponse> {
  return await request<MasterShiftResponse>(`${API_BASE}/master-shifts/${shiftId}`, {
    method: 'PUT',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Delete (soft) master shift
 */
export async function deleteMasterShift(shiftId: number, data: MasterShiftDeleteRequest): Promise<MessageResponse> {
  return await request<MessageResponse>(`${API_BASE}/master-shifts/${shiftId}`, {
    method: 'DELETE',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

// =============================================================================
// API Functions - Summary
// =============================================================================

/**
 * Get summary of equipment and people for a given date/time range
 */
export async function getSummary(params: {
  date: string  // YYYY-MM-DD
  time_from?: string  // HH:MM
  time_to?: string  // HH:MM
}): Promise<SummaryResponse> {
  const queryParams = new URLSearchParams()
  queryParams.set('date', params.date)
  if (params.time_from) queryParams.set('time_from', params.time_from)
  if (params.time_to) queryParams.set('time_to', params.time_to)
  
  return await request<SummaryResponse>(`${API_BASE}/summary?${queryParams.toString()}`)
}
