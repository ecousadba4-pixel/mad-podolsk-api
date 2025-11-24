<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'

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
          По месяцам
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ 'mode-btn--active': isDaily }"
          @click="goToDaily"
        >
          По дням
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
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 24px 32px 16px;
  gap: 24px;
  background: #fff;
}

.app-header__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-header__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.app-header__subtitle {
  margin: 0;
  font-size: 14px;
  color: #555;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* переключатель режимов */
.app-header__mode-switch {
  display: inline-flex;
  padding: 2px;
  border-radius: 999px;
  background: #f3f3f3;
}

.mode-btn {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  color: #555;
}

.mode-btn--active {
  background: #111827;
  color: #fff;
}

/* выбор месяца */
.app-header__month {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #777;
}

.app-header__month-input {
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #d0d0d0;
  font-size: 14px;
}
</style>
