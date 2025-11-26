<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import LastUpdatedBadge from './LastUpdatedBadge.vue'
import MonthPicker from './MonthPicker.vue'
import DayPicker from './DayPicker.vue'
import { useIsMobile } from '../composables/useIsMobile.js'

const router = useRouter()
const route = useRoute()
const store = useDashboardStore()
const { selectedMonth: selectedMonthRef, monthlySummary, selectedDate, loadedAt } = storeToRefs(store)

const { isMobile } = useIsMobile()

// выбор режима (для подсветки активной кнопки)
const isMonthly = computed(() => route.path === '/' || route.name === 'monthly')
const isDaily = computed(() => route.path === '/daily' || route.name === 'daily')

// навигация по режимам
function goToMonthly() {
  if (!isMonthly.value) {
    router.push({ path: '/' })
    store.setMode('monthly')
    store.fetchMonthlySummary()
  }
}

function goToDaily() {
  if (!isDaily.value) {
    router.push({ path: '/daily' })
    // set mode and select nearest available date, then load daily data
    store.setMode('daily')
    // also fetch monthly summary metadata (loadedAt) so badge shows in header
    ;(async () => {
      // fetch the last-loaded timestamp in background
      try { await store.fetchMonthlySummary() } catch(e) { /* ignore */ }
      await store.findNearestDateWithData()
      await store.fetchDaily(selectedDate.value)
    })()
  }
}

// выбор месяца — тот же, что был в MonthlyDashboard
const monthInput = ref(null)

function openMonthPicker(){
  const el = monthInput && monthInput.value ? monthInput.value : monthInput
  if (!el) return
  // Prefer programmatic showPicker when available (Chrome, Edge)
  try{
    if (typeof el.showPicker === 'function') {
      el.showPicker()
      return
    }
  }catch(e){ /* ignore */ }
  // Fallback to focus which triggers native picker on some browsers
  try{ el.focus() }catch(e){}
}

const selectedMonth = computed({
  get: () => selectedMonthRef.value,
  set: (value) => {
    if (!value) return
    store.setSelectedMonth(value)
    store.fetchMonthlySummary()
  }
})
</script>

<template>
  <header class="app-header p-md">
    <div class="app-header__inner">
      <div v-if="isMobile" class="app-header__mobile">
        <div class="app-header__line app-header__line--title">
          <h1 class="app-header__title text-h1">СКПДИ · МАД · Подольск</h1>
        </div>
        <div class="app-header__line app-header__line--subtitle">
          <p class="app-header__subtitle text-body-sm">Работа в статусе «Рассмотрена»</p>
        </div>

        <div class="app-header__line app-header__line--switch">
          <div class="app-header__mode-switch control mode-switch--mobile">
            <button
              type="button"
              class="mode-btn"
              :class="{ 'mode-btn--active': isMonthly }"
              @click="goToMonthly"
            >
              <span class="mode-btn-text">По месяцам</span>
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ 'mode-btn--active': isDaily }"
              @click="goToDaily"
            >
              <span class="mode-btn-text">По дням</span>
            </button>
          </div>
        </div>

        <div class="app-header__line app-header__line--controls">
          <div class="app-header__picker control">
            <MonthPicker v-if="isMonthly" v-model="selectedMonth" />
            <DayPicker v-else />
          </div>

          <div class="app-header__updated control">
            <LastUpdatedBadge :loadedAt="monthlySummary?.value?.loaded_at || loadedAt" />
          </div>
        </div>
      </div>

      <div v-else class="app-header__desktop">
        <div class="app-header__left">
          <h1 class="app-header__title text-h1">СКПДИ · МАД · Подольск</h1>
          <p class="app-header__subtitle text-body-sm">Работа в статусе «Рассмотрена»</p>
        </div>
        <div class="app-header__right items-center">
          <!-- Переключатель режимов -->
          <div class="app-header__mode-switch control">
            <button
              type="button"
              class="mode-btn"
              :class="{ 'mode-btn--active': isMonthly }"
              @click="goToMonthly"
            >
              <span class="mode-btn-text">По месяцам</span>
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ 'mode-btn--active': isDaily }"
              @click="goToDaily"
            >
              <span class="mode-btn-text">По дням</span>
            </button>
          </div>

          <!-- Выбор месяца / даты (костомный) -->
          <div class="app-header__month control">
            <MonthPicker v-if="isMonthly" v-model="selectedMonth" />
            <DayPicker v-else />
          </div>

          <LastUpdatedBadge class="control" :loadedAt="monthlySummary?.value?.loaded_at || loadedAt" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Mobile specific layout adjustments */
.app-header__mobile {
  display: block;
}
.app-header__line { width: 100%; }
.app-header__line--controls {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  align-items: stretch;
}
.app-header__line--controls .control {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: stretch;
  min-height: var(--control-height);
}
.app-header__picker :deep(.month-picker),
.app-header__picker :deep(.day-picker) {
  width: 100%;
}
.app-header__picker :deep(.picker-toggle) {
  width: 100%;
  height: 100%;
}
.app-header__updated :deep(.last-updated) {
  width: 100%;
  height: 100%;
  justify-content: center;
}
.mode-switch--mobile {
  display: flex;
  width: 100%;
  gap: 0.5rem;
  margin: 0.5rem 0;
}
.mode-switch--mobile .mode-btn {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-header__picker.control,
.app-header__updated.control {
  width: 100%;
  margin: 0.25rem 0;
}

/* Small spacing tweaks for mobile */
.app-header__mobile .app-header__title { margin: 0; }
.app-header__mobile .app-header__subtitle { margin: 0.25rem 0 0.5rem 0; }

/* Ensure desktop layout unchanged but scoped rules won't leak */
.app-header__desktop { display: flex; width: 100%; }
.app-header__desktop .app-header__left { flex: 0 0 auto; }
.app-header__desktop .app-header__right { margin-left: auto; display:flex; gap:0.75rem; align-items:center; }
</style>
