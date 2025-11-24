<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'
import LastUpdatedBadge from './LastUpdatedBadge.vue'

const router = useRouter()
const route = useRoute()
const store = useDashboardStore()

// выбор режима (для подсветки активной кнопки)
const isMonthly = computed(() => route.path === '/' || route.name === 'monthly')
const isDaily = computed(() => route.path === '/daily' || route.name === 'daily')

// навигация по режимам
function goToMonthly() {
  if (!isMonthly.value) {
    router.push({ path: '/' })
  }
}

function goToDaily() {
  if (!isDaily.value) {
    router.push({ path: '/daily' })
  }
}

// выбор месяца — тот же, что был в MonthlyDashboard
const selectedMonth = computed({
  get: () => store.selectedMonth,
  set: (value) => {
    if (!value) return
    store.setSelectedMonth(value)
    store.fetchMonthlySummary()
  }
})
</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <h1 class="app-header__title">СКПДИ · МАД · Подольск</h1>
      <p class="app-header__subtitle">Работы в статусе «Рассмотрено»</p>
    </div>

    <div class="app-header__right">
      <!-- Переключатель режимов -->
      <div class="app-header__mode-switch">
        <button
          type="button"
          class="mode-btn"
          :class="{ 'mode-btn--active': isMonthly }"
          @click="goToMonthly"
        >
          <span class="mode-btn-line1">По</span>
          <span class="mode-btn-line2">месяцам</span>
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ 'mode-btn--active': isDaily }"
          @click="goToDaily"
        >
          <span class="mode-btn-line1">По</span>
          <span class="mode-btn-line2">дням</span>
        </button>
      </div>

      <!-- Выбор месяца -->
      <label class="app-header__month">
        <span class="app-header__month-label">Месяц</span>
        <input
          v-model="selectedMonth"
          type="month"
          class="app-header__month-input"
        />
      </label>

      <LastUpdatedBadge :loadedAt="store.monthlySummary?.loaded_at" />
    </div>
  </header>
</template>
