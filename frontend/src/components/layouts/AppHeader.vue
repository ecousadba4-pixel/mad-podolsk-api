<script setup>
import { useIsMobile } from '../../composables/useIsMobile.js'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import { LastUpdatedBadge } from '../common'
import { MonthPicker, DayPicker } from '../pickers'
// ExportPdfButton temporarily disabled in header during report work-in-progress

const { isMobile } = useIsMobile()
const innerRef = ref(null)


onMounted(async () => {
  await nextTick()
  // No debug guides in production: overlays removed.
})

onUnmounted(() => {
  // nothing to cleanup for header overlays
})

const router = useRouter()
const route = useRoute()
const store = useDashboardStore()
const { selectedMonth: selectedMonthRef, monthlySummary, selectedDate, loadedAt } = storeToRefs(store)

// выбор режима (локально + навигация)
const isMonthlyActive = computed(() => route.path === '/' || route.name === 'monthly')

function setMonthly() {
  if (!isMonthlyActive.value) {
    router.push({ path: '/' })
    store.setMode('monthly')
    store.fetchMonthlySummary()
    store.fetchSmetaCards()
  }
}

function setDaily() {
  if (isMonthlyActive.value) {
    router.push({ path: '/daily' })
    store.setMode('daily')
    ;(async () => {
      try { await store.fetchMonthlySummary() } catch(e) { /* ignore */ }
      await store.findNearestDateWithData()
      await store.fetchDaily(selectedDate.value)
    })()
  }
}

const selectedMonth = computed({
  get: () => selectedMonthRef.value,
  set: (value) => {
    if (!value) return
    store.setSelectedMonth(value)
    store.setSelectedSmeta(null)
    store.fetchMonthlySummary()
    store.fetchSmetaCards()
  }
})
</script>

<template>
  <header class="app-header new-app-header">
    <div class="app-header__inner" ref="innerRef">
      <div class="new-header-row new-header-row--title">
        <div>
          <h1 class="app-header__title">СКПДИ · МАД · Подольск</h1>
          <p class="app-header__subtitle text-body-sm">Работы в статусе «Рассмотрено»</p>
        </div>
      </div>
      <div class="new-header-row new-header-row--switch">
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
