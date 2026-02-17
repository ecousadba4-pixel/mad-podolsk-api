import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as fuelApi from '@/api/fuel'
import type {
  FuelGeneralResponse,
  FuelByDriverResponse,
  FuelDriverItem,
} from '@/api/fuel'

export const useFuelStore = defineStore('fuel', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // State — Reference Data
  // ─────────────────────────────────────────────────────────────────────────
  const drivers = ref<FuelDriverItem[]>([])
  const isLoadingReferences = ref(false)

  // ─────────────────────────────────────────────────────────────────────────
  // State — General Data
  // ─────────────────────────────────────────────────────────────────────────
  const generalData = ref<FuelGeneralResponse | null>(null)
  const isLoadingGeneral = ref(false)
  const generalError = ref<string | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // State — By Driver
  // ─────────────────────────────────────────────────────────────────────────
  const byDriverData = ref<FuelByDriverResponse | null>(null)
  const isLoadingByDriver = ref(false)
  const byDriverError = ref<string | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // State — UI
  // ─────────────────────────────────────────────────────────────────────────
  const activeSubsection = ref<'general' | 'by-driver'>('general')

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  async function fetchReferences() {
    isLoadingReferences.value = true
    try {
      const res = await fuelApi.getFuelDrivers()
      drivers.value = res.items
    } catch (e) {
      console.error('Failed to fetch fuel references:', e)
    } finally {
      isLoadingReferences.value = false
    }
  }

  async function fetchFuelGeneral(params: {
    date?: string
    dateFrom?: string
    dateTo?: string
  }) {
    isLoadingGeneral.value = true
    generalError.value = null
    try {
      const result = await fuelApi.getFuelGeneral({
        date: params.date,
        date_from: params.dateFrom,
        date_to: params.dateTo,
      })
      generalData.value = result
    } catch (e) {
      generalError.value = e instanceof Error ? e.message : 'Ошибка загрузки данных'
    } finally {
      isLoadingGeneral.value = false
    }
  }

  async function fetchFuelByDriver(
    employeeId: number,
    dateFrom: string,
    dateTo: string,
  ) {
    isLoadingByDriver.value = true
    byDriverError.value = null
    try {
      const result = await fuelApi.getFuelByDriver({
        employee_id: employeeId,
        date_from: dateFrom,
        date_to: dateTo,
      })
      byDriverData.value = result
    } catch (e) {
      byDriverError.value = e instanceof Error ? e.message : 'Ошибка загрузки данных'
    } finally {
      isLoadingByDriver.value = false
    }
  }

  return {
    drivers,
    isLoadingReferences,
    generalData,
    isLoadingGeneral,
    generalError,
    byDriverData,
    isLoadingByDriver,
    byDriverError,
    activeSubsection,
    fetchReferences,
    fetchFuelGeneral,
    fetchFuelByDriver,
  }
})
