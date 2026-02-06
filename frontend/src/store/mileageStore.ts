/**
 * Pinia store for mileage (пробег машин) section
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as mileageApi from '@/api/mileage'
import * as resourcesApi from '@/api/resources'
import type { MileageByDateResponse, MileageByVehicleResponse } from '@/api/mileage'
import type { EquipmentType, Vehicle } from '@/api/resources'

export const useMileageStore = defineStore('mileage', () => {
  // ==========================================================================
  // State - Reference Data
  // ==========================================================================

  const equipmentTypes = ref<EquipmentType[]>([])
  const vehicles = ref<Vehicle[]>([])
  const isLoadingReferences = ref(false)

  // ==========================================================================
  // State - By Date
  // ==========================================================================

  const byDateData = ref<MileageByDateResponse | null>(null)
  const isLoadingByDate = ref(false)
  const byDateError = ref<string | null>(null)

  // ==========================================================================
  // State - By Vehicle
  // ==========================================================================

  const byVehicleData = ref<MileageByVehicleResponse | null>(null)
  const isLoadingByVehicle = ref(false)
  const byVehicleError = ref<string | null>(null)

  // ==========================================================================
  // State - UI
  // ==========================================================================

  const activeSubsection = ref<'by-date' | 'by-vehicle'>('by-date')

  // ==========================================================================
  // Actions - Reference Data
  // ==========================================================================

  async function fetchReferences() {
    isLoadingReferences.value = true

    try {
      const [typesRes, vehiclesRes] = await Promise.all([
        resourcesApi.getEquipmentTypes(),
        resourcesApi.getVehicles(),
      ])

      equipmentTypes.value = typesRes.items
      vehicles.value = vehiclesRes.items
    } catch (e) {
      console.error('Failed to fetch mileage references:', e)
    } finally {
      isLoadingReferences.value = false
    }
  }

  async function fetchVehiclesByType(equipmentTypeId: number) {
    try {
      const res = await resourcesApi.getVehicles(equipmentTypeId)
      const otherVehicles = vehicles.value.filter(v => v.equipment_type_id !== equipmentTypeId)
      vehicles.value = [...otherVehicles, ...res.items]
    } catch (e) {
      console.error('Failed to fetch vehicles by type:', e)
    }
  }

  // ==========================================================================
  // Actions - By Date
  // ==========================================================================

  async function fetchMileageByDate(date: string, timeFrom?: string, timeTo?: string) {
    isLoadingByDate.value = true
    byDateError.value = null

    try {
      const result = await mileageApi.getMileageByDate({
        date,
        time_from: timeFrom,
        time_to: timeTo,
      })
      byDateData.value = result
    } catch (e) {
      byDateError.value = e instanceof Error ? e.message : 'Ошибка загрузки данных'
      console.error('Failed to fetch mileage by date:', e)
    } finally {
      isLoadingByDate.value = false
    }
  }

  // ==========================================================================
  // Actions - By Vehicle
  // ==========================================================================

  async function fetchMileageByVehicle(vehiclesId: number, dateFrom: string, dateTo: string) {
    isLoadingByVehicle.value = true
    byVehicleError.value = null

    try {
      const result = await mileageApi.getMileageByVehicle({
        vehicles_id: vehiclesId,
        date_from: dateFrom,
        date_to: dateTo,
      })
      byVehicleData.value = result
    } catch (e) {
      byVehicleError.value = e instanceof Error ? e.message : 'Ошибка загрузки данных'
      console.error('Failed to fetch mileage by vehicle:', e)
    } finally {
      isLoadingByVehicle.value = false
    }
  }

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State - References
    equipmentTypes,
    vehicles,
    isLoadingReferences,

    // State - By Date
    byDateData,
    isLoadingByDate,
    byDateError,

    // State - By Vehicle
    byVehicleData,
    isLoadingByVehicle,
    byVehicleError,

    // State - UI
    activeSubsection,

    // Actions
    fetchReferences,
    fetchVehiclesByType,
    fetchMileageByDate,
    fetchMileageByVehicle,
  }
})
