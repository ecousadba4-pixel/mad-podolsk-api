<script setup lang="ts">
/**
 * MileageByDate — подраздел "По дате"
 * 
 * Отображает агрегированный пробег всех машин за выбранную дату/время.
 */
import { storeToRefs } from 'pinia'
import { useMileageStore } from '@/store/mileageStore'
import { MileageByDateFilters, MileageByDateTable } from '@/components/mileage'

const store = useMileageStore()
const { byDateData, isLoadingByDate } = storeToRefs(store)

async function handleApplyFilters(filters: { date: string; timeFrom?: string; timeTo?: string }) {
  await store.fetchMileageByDate(filters.date, filters.timeFrom, filters.timeTo)
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
