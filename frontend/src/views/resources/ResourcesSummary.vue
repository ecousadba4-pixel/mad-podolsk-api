<script setup lang="ts">
/**
 * ResourcesSummary — подраздел "Сводка"
 * 
 * Отображает сводную информацию о технике и людях на выбранную дату/время.
 */
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { 
  SummaryFilters, 
  SummaryEquipmentTable, 
  SummaryPeopleTable 
} from '@/components/resources'

const store = useResourcesStore()
const { summary, isLoadingSummary } = storeToRefs(store)

async function handleApplyFilters(filters: { date: string; timeFrom?: string; timeTo?: string }) {
  await store.fetchSummary(filters.date, filters.timeFrom, filters.timeTo)
}
</script>

<template>
  <div class="summary">
    <SummaryFilters 
      :isLoading="isLoadingSummary"
      @apply="handleApplyFilters" 
    />
    
    <div class="summary__tables">
      <SummaryEquipmentTable 
        :data="summary?.equipment ?? null"
        :isLoading="isLoadingSummary"
      />
      <SummaryPeopleTable 
        :data="summary?.people ?? null"
        :isLoading="isLoadingSummary"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}

.summary__tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--card-frame-gap);
}

@media (max-width: 768px) {
  .summary__tables {
    grid-template-columns: 1fr;
  }
}
</style>
