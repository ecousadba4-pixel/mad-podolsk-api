<template>
  <main class="page">
    <section class="page-content">
      <!-- Состояние загрузки -->
      <div v-if="dailyLoading && !dailyRows.length" class="loading-state">
        Загрузка...
      </div>
      
      <!-- Пустое состояние -->
      <EmptyState 
        v-else-if="!dailyRows.length && !dailyLoading"
        variant="default"
        title="Нет данных за эту дату"
        description="Выберите другую дату или дождитесь загрузки данных"
      />
      
      <!-- Данные -->
      <template v-else>
        <div :class="{ 'is-loading': dailyLoading }">
          <MobileDailyFull 
            v-if="showMobile" 
            :rows="dailyRows" 
            :total-amount="dailyTotal" 
            :date="selectedDate" 
          />
          <DailyTable 
            v-else 
            :rows="dailyRows" 
            :total-amount="dailyTotal" 
            :date="selectedDate" 
          />
        </div>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDashboardUiStore } from '@/store/dashboardUiStore'
import { useDailyStore } from '@/store/dailyStore'
import { storeToRefs } from 'pinia'
import { DailyTable, MobileDailyFull } from '@/components/dashboard'
import { EmptyState } from '@/components/common'
import { useBodyClass, useIsMobile } from '@/composables'

const uiStore = useDashboardUiStore()
const dailyStore = useDailyStore()
const { dailyLoading, dailyRows, dailyTotal, selectedDate } = storeToRefs(dailyStore)

// Body class для стилизации страницы
useBodyClass('page-daily-bg')

const { isMobile } = useIsMobile()

// URL параметр для тестирования мобильной версии
const forceMobile = computed(() => {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('mobile') === '1'
  } catch {
    return false
  }
})

// Показывать мобильную версию
const showMobile = computed(() => isMobile.value || forceMobile.value)

onMounted(() => {
  uiStore.setMode('daily')
  dailyStore.fetchDaily(selectedDate.value)
})
</script>

<style scoped>
.loading-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.is-loading {
  opacity: 0.7;
  filter: saturate(0.85);
  pointer-events: none;
  transition: opacity 200ms ease, filter 200ms ease;
}
</style>
