<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import LastUpdatedBadge from './LastUpdatedBadge.vue'
import MonthPicker from './MonthPicker.vue'
import DayPicker from './DayPicker.vue'

const router = useRouter()
const route = useRoute()
const store = useDashboardStore()
const { selectedMonth: selectedMonthRef, monthlySummary, selectedDate } = storeToRefs(store)

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
    ;(async () => {
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
    <div class="app-header__left">
      <h1 class="app-header__title text-h1">СКПДИ · МАД · Подольск</h1>
      <p class="app-header__subtitle text-body-sm">Работы в статусе «Рассмотрено»</p>
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

      <LastUpdatedBadge class="control" :loadedAt="monthlySummary?.value?.loaded_at" />
    </div>
  </header>
</template>
