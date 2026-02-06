<script setup lang="ts">
/**
 * MileageView — главная страница раздела "Пробег машин"
 */
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMileageStore } from '@/store/mileageStore'
import { MileageSubsectionToggle } from '@/components/mileage'
import MileageByDate from './mileage/MileageByDate.vue'
import MileageByVehicle from './mileage/MileageByVehicle.vue'

const store = useMileageStore()
const { activeSubsection, isLoadingReferences } = storeToRefs(store)

// Load reference data on mount
onMounted(async () => {
  await store.fetchReferences()
})
</script>

<template>
  <div class="mileage-view">
    <header class="mileage-view__header">
      <h1 class="mileage-view__title">Пробег машин</h1>
      <MileageSubsectionToggle v-model="activeSubsection" />
    </header>

    <div v-if="isLoadingReferences" class="mileage-view__loading">
      <div class="mileage-view__spinner"></div>
      <span>Загрузка справочников...</span>
    </div>

    <template v-else>
      <Transition name="fade" mode="out-in">
        <MileageByDate v-if="activeSubsection === 'by-date'" key="by-date" />
        <MileageByVehicle v-else key="by-vehicle" />
      </Transition>
    </template>
  </div>
</template>

<style scoped lang="scss">
.mileage-view {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
  min-height: 100%;
}

.mileage-view__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-md) var(--gap-lg);
}

.mileage-view__title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-main);
}

.mileage-view__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-md);
  padding: var(--gap-xl);
  color: var(--text-muted);
}

.mileage-view__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .mileage-view {
    gap: var(--gap-md);
  }

  .mileage-view__header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--gap-sm);
  }

  .mileage-view__title {
    font-size: var(--font-size-h2);
  }
}
</style>
