/**
 * Pinia store for resources (учет техники и людей) section
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as resourcesApi from '@/api/resources'
import type {
  EquipmentType,
  Vehicle,
  Driver,
  Master,
  RentedPlateNumber,
  EquipmentShiftResponse,
  MasterShiftResponse,
  SummaryResponse,
  EquipmentShiftCreate,
  EquipmentShiftUpdate,
  MasterShiftCreate,
  MasterShiftUpdate,
} from '@/api/resources'

export const useResourcesStore = defineStore('resources', () => {
  // ==========================================================================
  // State - Reference Data
  // ==========================================================================
  
  const equipmentTypes = ref<EquipmentType[]>([])
  const vehicles = ref<Vehicle[]>([])
  const drivers = ref<Driver[]>([])
  const masters = ref<Master[]>([])
  const rentedPlateNumbers = ref<RentedPlateNumber[]>([])
  
  const isLoadingReferences = ref(false)
  const referencesError = ref<string | null>(null)
  
  // ==========================================================================
  // State - Current Operation
  // ==========================================================================
  
  const currentEquipmentShift = ref<EquipmentShiftResponse | null>(null)
  const currentMasterShift = ref<MasterShiftResponse | null>(null)
  
  const isOperationLoading = ref(false)
  const operationError = ref<string | null>(null)
  
  // ==========================================================================
  // State - Summary
  // ==========================================================================
  
  const summary = ref<SummaryResponse | null>(null)
  const isLoadingSummary = ref(false)
  const summaryError = ref<string | null>(null)
  
  // ==========================================================================
  // State - UI
  // ==========================================================================
  
  const activeSubsection = ref<'summary' | 'data-entry'>('summary')
  
  // ==========================================================================
  // Getters
  // ==========================================================================
  
  const vehiclesByType = computed(() => {
    return (typeId: number) => vehicles.value.filter(v => v.equipment_type_id === typeId)
  })
  
  const rentedPlateNumbersByType = computed(() => {
    return (typeId: number) => rentedPlateNumbers.value.filter(p => p.equipment_type_id === typeId)
  })
  
  const activeEquipmentTypes = computed(() => {
    return equipmentTypes.value.filter(t => t.is_active)
  })
  
  const activeDrivers = computed(() => {
    return drivers.value.filter(d => d.is_active)
  })
  
  const activeMasters = computed(() => {
    return masters.value.filter(m => m.is_active)
  })
  
  // ==========================================================================
  // Actions - Reference Data
  // ==========================================================================
  
  async function fetchReferences() {
    isLoadingReferences.value = true
    referencesError.value = null
    
    try {
      const [typesRes, vehiclesRes, driversRes, mastersRes] = await Promise.all([
        resourcesApi.getEquipmentTypes(),
        resourcesApi.getVehicles(),
        resourcesApi.getDrivers(),
        resourcesApi.getMasters(),
      ])
      
      equipmentTypes.value = typesRes.items
      vehicles.value = vehiclesRes.items
      drivers.value = driversRes.items
      masters.value = mastersRes.items
    } catch (e) {
      referencesError.value = e instanceof Error ? e.message : 'Ошибка загрузки справочников'
      console.error('Failed to fetch references:', e)
    } finally {
      isLoadingReferences.value = false
    }
  }
  
  async function fetchVehiclesByType(equipmentTypeId: number) {
    try {
      const res = await resourcesApi.getVehicles(equipmentTypeId)
      // Update only vehicles of this type in the store
      const otherVehicles = vehicles.value.filter(v => v.equipment_type_id !== equipmentTypeId)
      vehicles.value = [...otherVehicles, ...res.items]
    } catch (e) {
      console.error('Failed to fetch vehicles by type:', e)
    }
  }
  
  async function fetchRentedPlateNumbers(equipmentTypeId?: number) {
    try {
      const res = await resourcesApi.getRentedPlateNumbers(equipmentTypeId)
      if (equipmentTypeId !== undefined) {
        // Update only plate numbers of this type in the store
        const otherPlateNumbers = rentedPlateNumbers.value.filter(p => p.equipment_type_id !== equipmentTypeId)
        rentedPlateNumbers.value = [...otherPlateNumbers, ...res.items]
      } else {
        rentedPlateNumbers.value = res.items
      }
    } catch (e) {
      console.error('Failed to fetch rented plate numbers:', e)
    }
  }
  
  // ==========================================================================
  // Actions - Equipment Shifts
  // ==========================================================================
  
  async function createEquipmentShift(data: EquipmentShiftCreate): Promise<EquipmentShiftResponse | null> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      const result = await resourcesApi.createEquipmentShift(data)
      currentEquipmentShift.value = result
      return result
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Ошибка создания записи'
      console.error('Failed to create equipment shift:', e)
      return null
    } finally {
      isOperationLoading.value = false
    }
  }
  
  async function searchEquipmentShift(plateNumber: string, shiftStartDate: string): Promise<EquipmentShiftResponse | null> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      const result = await resourcesApi.searchEquipmentShift({
        plate_number: plateNumber,
        shift_start_date: shiftStartDate,
      })
      currentEquipmentShift.value = result
      return result
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Запись не найдена'
      currentEquipmentShift.value = null
      return null
    } finally {
      isOperationLoading.value = false
    }
  }
  
  async function updateEquipmentShift(shiftId: number, data: EquipmentShiftUpdate): Promise<EquipmentShiftResponse | null> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      const result = await resourcesApi.updateEquipmentShift(shiftId, data)
      currentEquipmentShift.value = result
      return result
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Ошибка обновления записи'
      console.error('Failed to update equipment shift:', e)
      return null
    } finally {
      isOperationLoading.value = false
    }
  }
  
  async function deleteEquipmentShift(shiftId: number, deleteReason: string): Promise<boolean> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      await resourcesApi.deleteEquipmentShift(shiftId, { delete_reason: deleteReason })
      currentEquipmentShift.value = null
      return true
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Ошибка удаления записи'
      console.error('Failed to delete equipment shift:', e)
      return false
    } finally {
      isOperationLoading.value = false
    }
  }
  
  // ==========================================================================
  // Actions - Master Shifts
  // ==========================================================================
  
  async function createMasterShift(data: MasterShiftCreate): Promise<MasterShiftResponse | null> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      const result = await resourcesApi.createMasterShift(data)
      currentMasterShift.value = result
      return result
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Ошибка создания записи'
      console.error('Failed to create master shift:', e)
      return null
    } finally {
      isOperationLoading.value = false
    }
  }
  
  async function searchMasterShift(masterId: number, shiftStartDate: string): Promise<MasterShiftResponse | null> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      const result = await resourcesApi.searchMasterShift({
        master_id: masterId,
        shift_start_date: shiftStartDate,
      })
      currentMasterShift.value = result
      return result
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Запись не найдена'
      currentMasterShift.value = null
      return null
    } finally {
      isOperationLoading.value = false
    }
  }
  
  async function updateMasterShift(shiftId: number, data: MasterShiftUpdate): Promise<MasterShiftResponse | null> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      const result = await resourcesApi.updateMasterShift(shiftId, data)
      currentMasterShift.value = result
      return result
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Ошибка обновления записи'
      console.error('Failed to update master shift:', e)
      return null
    } finally {
      isOperationLoading.value = false
    }
  }
  
  async function deleteMasterShift(shiftId: number, deleteReason: string): Promise<boolean> {
    isOperationLoading.value = true
    operationError.value = null
    
    try {
      await resourcesApi.deleteMasterShift(shiftId, { delete_reason: deleteReason })
      currentMasterShift.value = null
      return true
    } catch (e) {
      operationError.value = e instanceof Error ? e.message : 'Ошибка удаления записи'
      console.error('Failed to delete master shift:', e)
      return false
    } finally {
      isOperationLoading.value = false
    }
  }
  
  // ==========================================================================
  // Actions - Summary
  // ==========================================================================
  
  async function fetchSummary(date: string, timeFrom?: string, timeTo?: string) {
    isLoadingSummary.value = true
    summaryError.value = null
    
    try {
      const result = await resourcesApi.getSummary({
        date,
        time_from: timeFrom,
        time_to: timeTo,
      })
      summary.value = result
    } catch (e) {
      summaryError.value = e instanceof Error ? e.message : 'Ошибка загрузки сводки'
      console.error('Failed to fetch summary:', e)
    } finally {
      isLoadingSummary.value = false
    }
  }
  
  // ==========================================================================
  // Actions - UI
  // ==========================================================================
  
  function setActiveSubsection(subsection: 'summary' | 'data-entry') {
    activeSubsection.value = subsection
  }
  
  function clearCurrentShifts() {
    currentEquipmentShift.value = null
    currentMasterShift.value = null
    operationError.value = null
  }
  
  function clearErrors() {
    referencesError.value = null
    operationError.value = null
    summaryError.value = null
  }
  
  // ==========================================================================
  // Return
  // ==========================================================================
  
  return {
    // State - Reference Data
    equipmentTypes,
    vehicles,
    drivers,
    masters,
    rentedPlateNumbers,
    isLoadingReferences,
    referencesError,
    
    // State - Current Operation
    currentEquipmentShift,
    currentMasterShift,
    isOperationLoading,
    operationError,
    
    // State - Summary
    summary,
    isLoadingSummary,
    summaryError,
    
    // State - UI
    activeSubsection,
    
    // Getters
    vehiclesByType,
    rentedPlateNumbersByType,
    activeEquipmentTypes,
    activeDrivers,
    activeMasters,
    
    // Actions - Reference Data
    fetchReferences,
    fetchVehiclesByType,
    fetchRentedPlateNumbers,
    
    // Actions - Equipment Shifts
    createEquipmentShift,
    searchEquipmentShift,
    updateEquipmentShift,
    deleteEquipmentShift,
    
    // Actions - Master Shifts
    createMasterShift,
    searchMasterShift,
    updateMasterShift,
    deleteMasterShift,
    
    // Actions - Summary
    fetchSummary,
    
    // Actions - UI
    setActiveSubsection,
    clearCurrentShifts,
    clearErrors,
  }
})
