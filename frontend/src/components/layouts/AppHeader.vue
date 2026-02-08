<script setup lang="ts">
import { useIsMobile } from '../../composables/useIsMobile'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardUiStore } from '../../store/dashboardUiStore'
import { useMonthlyStore } from '../../store/monthlyStore'
import { useDailyStore } from '../../store/dailyStore'
import { useSmetaStore } from '../../store/smetaStore'
import { storeToRefs } from 'pinia'
import { LastUpdatedBadge, NavMenu } from '../common'
import { MonthPicker, DayPicker } from '../pickers'

const { isMobile } = useIsMobile()
const innerRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
})

onUnmounted(() => {
  // nothing to cleanup for header overlays
})

const router = useRouter()
const route = useRoute()
const uiStore = useDashboardUiStore()
const monthlyStore = useMonthlyStore()
const dailyStore = useDailyStore()
const smetaStore = useSmetaStore()

const { selectedMonth: selectedMonthRef } = storeToRefs(uiStore)
const { monthlySummary, loadedAt } = storeToRefs(monthlyStore)
const { selectedDate } = storeToRefs(dailyStore)

// Определяем текущий раздел
const isRevenueSection = computed(() => {
  const path = route.path
  return path === '/' || path === '/daily' || path.startsWith('/smeta') || route.name === 'monthly'
})

// выбор режима (локально + навигация)
const isMonthlyActive = computed(() => route.path === '/' || route.name === 'monthly')

function setMonthly() {
  if (!isMonthlyActive.value) {
    router.push({ path: '/' })
    uiStore.setMode('monthly')
    monthlyStore.fetchMonthlySummary()
    smetaStore.fetchSmetaCards()
  }
}

function setDaily() {
  if (isMonthlyActive.value) {
    router.push({ path: '/daily' })
    uiStore.setMode('daily')
    ;(async () => {
      try { await monthlyStore.fetchMonthlySummary() } catch(e) { /* ignore */ }
      await dailyStore.findNearestDateWithData()
      await dailyStore.fetchDaily(selectedDate.value)
    })()
  }
}

const selectedMonth = computed({
  get: () => selectedMonthRef.value,
  set: (value: string) => {
    if (!value) return
    uiStore.setSelectedMonth(value)
    smetaStore.setSelectedSmeta(null)
    monthlyStore.fetchMonthlySummary()
    smetaStore.fetchSmetaCards()
  }
})
</script>

<template>
  <header class="app-header new-app-header">
    <div class="app-header__inner" ref="innerRef">
      <div class="new-header-row new-header-row--title">
        <NavMenu />
        <div class="app-header__title-block">
          <h1 class="app-header__title">МАД · Подольск</h1>
          <p v-if="isRevenueSection" class="app-header__subtitle text-body-sm">Работы в статусе «Рассмотрено»</p>
        </div>
      </div>
      <!-- Контролы отображаются только в разделе Выручка -->
      <div v-if="isRevenueSection" class="new-header-row new-header-row--switch">
        <div class="app-header__mode-switch control mode-switch--mobile" role="tablist" aria-label="Режим просмотра">
          <button
            type="button"
            class="mode-btn"
            :class="{ 'mode-btn--active': isMonthlyActive }"
            @click="setMonthly"
            :aria-pressed="isMonthlyActive"
          >
            <span class="mode-btn-text">По месяцам</span>
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'mode-btn--active': !isMonthlyActive }"
            @click="setDaily"
            :aria-pressed="!isMonthlyActive"
          >
            <span class="mode-btn-text">По дням</span>
          </button>
        </div>

        <div class="new-header-row--controls">
          <div class="app-header__picker control">
            <MonthPicker v-if="isMonthlyActive" v-model="selectedMonth" />
            <DayPicker v-else />
          </div>

          <div class="app-header__updated control">
            <LastUpdatedBadge :loadedAt="monthlySummary?.value?.loaded_at || loadedAt" />
          </div>
          <div class="app-header__export control" v-if="false">
            <!-- ExportPdfButton temporarily disabled while report is being refined -->
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<!-- Header styles migrated to `frontend/src/styles/modules/_header-controls.scss` -->
     `.app-header__inner` and `--page-hpad`. -->

/* Temporary debug vertical guide lines showing AppHeader inner edges
   Extend full viewport height; remove after alignment verified. */
/* Removed pseudo-element approach — using JS-driven fixed overlays instead for
   reliable positioning across scoped CSS and layout constraints. */
