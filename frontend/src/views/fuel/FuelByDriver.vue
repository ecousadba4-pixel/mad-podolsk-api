<script setup lang="ts">
/**
 * FuelByDriver — подраздел "По водителям"
 *
 * Отображает потребление топлива конкретного водителя за выбранный диапазон дат.
 * Паттерн: аналогичен views/mileage/MileageByVehicle.vue
 */
import { storeToRefs } from 'pinia'
import { useFuelStore } from '@/store/fuelStore'
import { FuelByDriverFilters, FuelByDriverTable } from '@/components/fuel'

const store = useFuelStore()
const { drivers, byDriverData, isLoadingByDriver } = storeToRefs(store)

async function handleApplyFilters(filters: { employeeId: number; dateFrom: string; dateTo: string }) {
  await store.fetchFuelByDriver(filters.employeeId, filters.dateFrom, filters.dateTo)
}
</script>

<template>
  <div class="fuel-by-driver">
    <FuelByDriverFilters 
      :drivers="drivers"
      :isLoading="isLoadingByDriver"
      @apply="handleApplyFilters"
    />
    
    <FuelByDriverTable 
      :data="byDriverData"
      :isLoading="isLoadingByDriver"
    />
  </div>
</template>

<style scoped lang="scss">
.fuel-by-driver {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}
</style>
