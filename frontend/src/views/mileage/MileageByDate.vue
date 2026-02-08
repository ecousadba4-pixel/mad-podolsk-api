<script setup lang="ts">
/**
 * MileageByDate — подраздел "По дате"
 * 
 * Отображает агрегированный пробег всех машин за выбранную дату/время.
 * Поддерживает выбор одной даты или периода (с/по).
 */
import { storeToRefs } from 'pinia'
import { useMileageStore } from '@/store/mileageStore'
import { MileageByDateFilters, MileageByDateTable } from '@/components/mileage'
import type { MileageByDateFilterValues } from '@/components/mileage/MileageByDateFilters.vue'

const store = useMileageStore()
const { byDateData, isLoadingByDate } = storeToRefs(store)

async function handleApplyFilters(filters: MileageByDateFilterValues) {
  if (filters.dateMode === 'range') {
    await store.fetchMileageByDate({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      timeFrom: filters.timeFrom,
      timeTo: filters.timeTo,
    })
  } else {
    await store.fetchMileageByDate({
      date: filters.date,
      timeFrom: filters.timeFrom,
      timeTo: filters.timeTo,
    })
  }
}
</script>

<template>
  <div class="mileage-by-date">
    <MileageByDateFilters 
      :isLoading="isLoadingByDate"
      @apply="handleApplyFilters" 
    />
    
    <MileageByDateTable 
      :data="byDateData"
      :isLoading="isLoadingByDate"
    />
  </div>
</template>

<style scoped lang="scss">
.mileage-by-date {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}
</style>
