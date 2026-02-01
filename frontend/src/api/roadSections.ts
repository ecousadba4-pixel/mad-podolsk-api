/**
 * API functions for road sections (участки дороги) section
 */

import { request, API_VERSION } from './client'

const API_BASE = `/api/${API_VERSION}/road-sections`

// --- Types ---

export interface RoadSectionRow {
  road_section_id: number
  road_section_name: string | null
  length_km: number | null
  passport_volume: number | null
  sidewalk_passport_volume: number | null
}

export interface RoadSectionsListResponse {
  rows: RoadSectionRow[]
  total: number
}

// --- API Functions ---

/**
 * Get list of road sections with optional search
 */
export async function getRoadSections(search?: string): Promise<RoadSectionsListResponse> {
  const queryParams = new URLSearchParams()
  if (search) queryParams.set('search', search)
  
  const queryString = queryParams.toString()
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE
  
  return await request<RoadSectionsListResponse>(url)
}
