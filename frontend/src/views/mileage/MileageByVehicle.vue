<script setup lang="ts">
/**
 * MileageByVehicle — подраздел "По машине"
 * 
 * Отображает пробег конкретной машины за выбранный диапазон дат.
 */
import { storeToRefs } from 'pinia'
import { useMileageStore } from '@/store/mileageStore'
import { MileageByVehicleFilters, MileageByVehicleTable } from '@/components/mileage'

const store = useMileageStore()
const { equipmentTypes, vehicles, byVehicleData, isLoadingByVehicle } = storeToRefs(store)

async function handleApplyFilters(filters: { vehiclesId: number; dateFrom: string; dateTo: string; byHours: boolean }) {
  await store.fetchMileageByVehicle(filters.vehiclesId, filters.dateFrom, filters.dateTo, filters.byHours)
}

function handleTypeChange(typeId: number) {
  store.fetchVehiclesByType(typeId)
}
</script>

<template>
  <div class="mileage-by-vehicle">
    <MileageByVehicleFilters 
      :equipmentTypes="equipmentTypes"
      :vehicles="vehicles"
      :isLoading="isLoadingByVehicle"
      @apply="handleApplyFilters"
      @typeChange="handleTypeChange"
    />
    
    <MileageByVehicleTable 
      :data="byVehicleData"
      :isLoading="isLoadingByVehicle"
    />
  </div>
</template>

<style scoped lang="scss">
.mileage-by-vehicle {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}
</style>
