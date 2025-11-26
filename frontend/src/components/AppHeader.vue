<script setup>
import { useIsMobile } from '../composables/useIsMobile.js'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import LastUpdatedBadge from './LastUpdatedBadge.vue'
import MonthPicker from './MonthPicker.vue'
import DayPicker from './DayPicker.vue'

const { isMobile } = useIsMobile()

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
    <div class="app-header__inner">
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
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Minimal header used for step-by-step rebuild and width debugging */

.new-app-header { padding-left: 0; padding-right: 0; }
.app-header__inner { max-width: min(var(--page-max-width), 100%); margin-left: auto; margin-right: auto; padding-left: calc(var(--page-hpad) + var(--card-padding)); padding-right: calc(var(--page-hpad) + var(--card-padding)); box-sizing: border-box; }
.new-header-row { display:flex; align-items:center; }
.app-header__title { margin: 0; }

/* Debug outlines removed for final version */
.app-header__title { padding: 6px 0; }

/* Debug outlines to help visual QA (remove after review) */
.new-app-header { outline: 2px dashed rgba(46, 204, 113, 0.18); }
.app-header__title { outline: 1px dotted rgba(47,111,237,0.08); }

/* Desktop layout: single row — title (stacked) on the left, controls on the right */
@media (min-width: 641px) {
  .app-header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
  }

  .new-header-row--title { flex: 0 0 auto; }
  .new-header-row--title > div { display: flex; flex-direction: column; }

  .new-header-row--switch { display: flex; align-items: center; gap: 1rem; }

  .app-header__mode-switch { display: flex; gap: 0.5rem; }
  .app-header__mode-switch .mode-btn { padding: 8px 12px; }

  .new-header-row--controls { display: flex; align-items: center; gap: 0.75rem; }
  .new-header-row--controls > * { display: flex; align-items: center; min-width: 0; }

  /* Ensure pickers and badge match control height on desktop */
  .new-header-row--controls .app-header__picker.control :deep(.picker-toggle),
  .new-header-row--controls .app-header__picker.control :deep(.month-picker),
  .new-header-row--controls .app-header__picker.control :deep(.day-picker) {
    height: var(--control-height);
    min-width: var(--picker-min-width);
    width: auto;
  }

  .new-header-row--controls .app-header__updated.control :deep(.last-updated) {
    height: var(--control-height);
    justify-content: center;
  }
}

/* Mobile: make title occupy full available width so boundaries are obvious */
@media (max-width: 640px) {
  .app-header__inner {
    padding-left: 0; /* allow title to reach screen edge for visual debugging */
    padding-right: 0;
    max-width: 100vw; /* ensure inner spans full viewport on mobile */
    display: flex; /* stack title and switch vertically in this new header */
    flex-direction: column;
    gap: var(--gap-sm);
    align-items: stretch;
  }
  .app-header__title {
    display: block;
    width: 100%;
    /* keep title on single line on mobile, truncate if too long */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: clamp(1rem, 5vw, 1.6rem);
    line-height: 1.05;
    text-align: left;
    padding-left: 0; /* use container padding for alignment */
    padding-right: 0;
  }
  /* align subtitle with title by padding the title container */
  .new-header-row--title > div { padding-left: 12px; padding-right: 12px; }

  /* ensure subtitle starts at same baseline as title left edge */
  .app-header__subtitle { margin: 4px 0 0 0; }
  /* make the mode switch full-width under the title */
  .new-header-row--switch { width: 100%; padding: 8px 0 0 0; box-sizing: border-box; }
  /* stack switch and controls vertically */
  .new-header-row--switch { display: flex; flex-direction: column; gap: var(--gap-sm); }
  .app-header__mode-switch { width: 100%; display: flex; gap: 0.5rem; margin: 0; }
  .app-header__mode-switch { border-radius: 12px; }
  .app-header__mode-switch .mode-btn { flex: 1 1 0; min-width: 0; width: 100%; display:flex; align-items:center; justify-content:center; padding: 10px 0; }
  /* Controls row: two items in one row, equal height */
  .new-header-row--controls { display:flex; flex-direction:row; gap: 0.75rem; width: 100%; box-sizing: border-box; }
  .new-header-row--controls > * { flex: 1 1 0; min-width: 0; display:flex; align-items:center; height: var(--control-height-mobile); }
  /* ensure picker internals fill their wrapper */
  .new-header-row--controls .app-header__picker.control { padding: 0; }
  .new-header-row--controls .app-header__picker.control :deep(.picker-toggle),
  .new-header-row--controls .app-header__picker.control :deep(.month-picker),
  .new-header-row--controls .app-header__picker.control :deep(.day-picker) {
    width: 100%;
    height: 100%;
  }
  .new-header-row--controls .app-header__updated.control :deep(.last-updated) {
    width: 100%; height: 100%; justify-content: center;
  }
}
</style>
     `.app-header__inner` and `--page-hpad`. -->
