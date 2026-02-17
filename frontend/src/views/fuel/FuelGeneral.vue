<script setup lang="ts">
/**
 * FuelGeneral — подраздел "Общие данные"
 *
 * Отображает сводную таблицу потребления топлива за выбранную дату/период.
 * Паттерн: аналогичен views/mileage/MileageByDate.vue
 */
import { storeToRefs } from 'pinia'
import { useFuelStore } from '@/store/fuelStore'
import { FuelGeneralFilters, FuelGeneralTable } from '@/components/fuel'
import type { FuelGeneralFilterValues } from '@/components/fuel/FuelGeneralFilters.vue'

const store = useFuelStore()
const { generalData, isLoadingGeneral } = storeToRefs(store)

async function handleApplyFilters(filters: FuelGeneralFilterValues) {
  if (filters.dateMode === 'range') {
    await store.fetchFuelGeneral({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    })
  } else {
    await store.fetchFuelGeneral({
      date: filters.date,
    })
  }
}
</script>

<template>
  <div class="fuel-general">
    <FuelGeneralFilters 
      :isLoading="isLoadingGeneral"
      @apply="handleApplyFilters" 
    />
    
    <FuelGeneralTable 
      :data="generalData"
      :isLoading="isLoadingGeneral"
    />
  </div>
</template>

<style scoped lang="scss">
.fuel-general {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}
</style>
