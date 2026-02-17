<script setup lang="ts">
/**
 * FuelView — главная страница раздела "Потребление топлива"
 *
 * Паттерн: аналогичен MileageView.vue
 */
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFuelStore } from '@/store/fuelStore'
import { FuelSubsectionToggle } from '@/components/fuel'
import FuelGeneral from './fuel/FuelGeneral.vue'
import FuelByDriver from './fuel/FuelByDriver.vue'

const store = useFuelStore()
const { activeSubsection, isLoadingReferences } = storeToRefs(store)

// Load reference data on mount
onMounted(async () => {
  await store.fetchReferences()
})
</script>

<template>
  <div class="fuel-view">
    <header class="fuel-view__header">
      <h1 class="fuel-view__title">Потребление топлива</h1>
      <FuelSubsectionToggle v-model="activeSubsection" />
    </header>

    <div v-if="isLoadingReferences" class="fuel-view__loading">
      <div class="fuel-view__spinner"></div>
      <span>Загрузка справочников...</span>
    </div>

    <template v-else>
      <Transition name="fade" mode="out-in">
        <FuelGeneral v-if="activeSubsection === 'general'" key="general" />
        <FuelByDriver v-else key="by-driver" />
      </Transition>
    </template>
  </div>
</template>

<style scoped lang="scss">
.fuel-view {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
  min-height: 100%;
}

.fuel-view__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-md) var(--gap-lg);
}

.fuel-view__title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-main);
}

.fuel-view__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-md);
  padding: var(--gap-xl);
  color: var(--text-muted);
}

.fuel-view__spinner {
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
  .fuel-view {
    gap: var(--gap-md);
  }

  .fuel-view__header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--gap-sm);
  }

  .fuel-view__title {
    font-size: var(--font-size-h2);
  }
}
</style>
