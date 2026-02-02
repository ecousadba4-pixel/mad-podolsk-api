<script setup lang="ts">
/**
 * ResourcesView — главная страница раздела "Учет техники и людей"
 */
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { SubsectionToggle } from '@/components/resources'
import ResourcesDataEntry from './resources/ResourcesDataEntry.vue'
import ResourcesSummary from './resources/ResourcesSummary.vue'

const store = useResourcesStore()
const { activeSubsection, isLoadingReferences } = storeToRefs(store)

// Load reference data on mount
onMounted(async () => {
  await store.fetchReferences()
})
</script>

<template>
  <div class="resources-view">
    <header class="resources-view__header">
      <h1 class="resources-view__title">Учет техники и людей</h1>
      <SubsectionToggle v-model="activeSubsection" />
    </header>

    <div v-if="isLoadingReferences" class="resources-view__loading">
      <div class="resources-view__spinner"></div>
      <span>Загрузка справочников...</span>
    </div>

    <template v-else>
      <Transition name="fade" mode="out-in">
        <ResourcesSummary v-if="activeSubsection === 'summary'" key="summary" />
        <ResourcesDataEntry v-else key="data-entry" />
      </Transition>
    </template>
  </div>
</template>

<style scoped lang="scss">
.resources-view {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
  min-height: 100%;
}

.resources-view__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-md) var(--gap-lg);
}

.resources-view__title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-main);
}

.resources-view__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-md);
  padding: var(--gap-xl);
  color: var(--text-muted);
}

.resources-view__spinner {
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
  .resources-view__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
