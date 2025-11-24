<script setup>
import { computed, onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js' // путь из папки views

const store = useDashboardStore()

// Привязываем input type="month" к selectedMonth в store
const selectedMonth = computed({
  get: () => store.selectedMonth,
  set: (value) => {
    if (!value) return
    store.setSelectedMonth(value)       // 1) обновляем месяц в store
    store.fetchMonthlySummary()         // 2) грузим данные по новому месяцу
  }
})

// При первом заходе на страницу загружаем данные
onMounted(() => {
  if (!store.monthlySummary) {
    store.fetchMonthlySummary()
  }
})
</script>

<template>
  <section class="dashboard">
    <!-- Заголовок дашборда -->
    <header class="dashboard__toolbar">
      <div class="dashboard__title-block">
        <h1 class="dashboard__title">СКПДИ · МАД · Подольск</h1>
        <p class="dashboard__subtitle">Работы в статусе «Рассмотрено»</p>
      </div>

      <!-- Выбор месяца -->
      <div class="dashboard__controls">
        <label class="month-selector">
          <span class="month-selector__label">Месяц</span>
          <input
            v-model="selectedMonth"
            type="month"
            class="month-selector__input"
          />
        </label>
      </div>
    </header>

    <!-- Контент по месяцу -->
    <main class="dashboard__content">
      <div v-if="store.monthlyLoading" class="dashboard__state">
        Загружаем данные…
      </div>

      <div
        v-else-if="store.monthlyError"
        class="dashboard__state dashboard__state--error"
      >
        Ошибка загрузки: {{ store.monthlyError }}
      </div>

      <div v-else-if="store.monthlySummary" class="dashboard__grid">
        <!-- Пока минимальный вывод, дальше превратим в красивые карточки -->
        <section class="dashboard-card">
          <h2 class="dashboard-card__title">Контракт</h2>
          <p class="dashboard-card__value">
            План: {{ store.monthlySummary.plan_total }}
          </p>
          <p class="dashboard-card__value">
            Факт: {{ store.monthlySummary.fact_total }}
          </p>
          <p class="dashboard-card__value">
            Исполнение: {{ store.monthlySummary.contract_planfact_pct }} %
          </p>
        </section>
      </div>

      <div v-else class="dashboard__state">
        Данные ещё не загружены.
      </div>
    </main>
  </section>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.dashboard__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard__title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.dashboard__subtitle {
  margin: 0;
  color: #555;
}

.dashboard__controls {
  display: flex;
  align-items: center;
}

.month-selector__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #777;
}

.month-selector__input {
  display: block;
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #d0d0d0;
}

.dashboard__content {
  min-height: 200px;
}

.dashboard__state {
  font-size: 14px;
  color: #555;
}

.dashboard__state--error {
  color: #c00;
}

.dashboard-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #fff;
  max-width: 320px;
}

.dashboard-card__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.dashboard-card__value {
  margin: 2px 0;
}
</style>
