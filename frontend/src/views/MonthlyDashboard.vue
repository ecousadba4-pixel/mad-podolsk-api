<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'

const store = useDashboardStore()

// При первом заходе на страницу загружаем данные
onMounted(async () => {
  if (!store.monthlySummary) {
    await store.fetchMonthlySummary()
  }
})
</script>

<template>
  <section class="dashboard">
    <main class="dashboard__content">
      <!-- LOADING -->
      <div v-if="store.monthlyLoading" class="dashboard__state">
        Загружаем данные…
      </div>

      <!-- ERROR -->
      <div
        v-else-if="store.monthlyError"
        class="dashboard__state dashboard__state--error"
      >
        Ошибка загрузки: {{ store.monthlyError }}
      </div>

      <!-- ДАННЫЕ ПОЛУЧЕНЫ -->
      <div v-else-if="store.monthlySummary" class="dashboard__grid">
        <!-- Карточка: Контракт -->
        <section class="dashboard-card">
          <h2 class="dashboard-card__title">Контракт</h2>

          <div class="dashboard-card__row">
            <span class="dashboard-card__label">План:</span>
            <span class="dashboard-card__value">
              {{ store.monthlySummary.plan_total?.toLocaleString() }}
            </span>
          </div>

          <div class="dashboard-card__row">
            <span class="dashboard-card__label">Факт:</span>
            <span class="dashboard-card__value">
              {{ store.monthlySummary.fact_total?.toLocaleString() }}
            </span>
          </div>

          <div class="dashboard-card__row">
            <span class="dashboard-card__label">Исполнение:</span>
            <span class="dashboard-card__value">
              {{ store.monthlySummary.contract_planfact_pct }} %
            </span>
          </div>
        </section>
      </div>

      <!-- НЕТ ДАННЫХ -->
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

/* Content area */
.dashboard__content {
  min-height: 200px;
}

.dashboard__state {
  font-size: 14px;
  padding: 12px;
  color: #555;
}

.dashboard__state--error {
  color: #c00;
}

/* Data grid */
.dashboard__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

/* Card */
.dashboard-card {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background: #fff;
  width: 320px;
}

.dashboard-card__title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}

.dashboard-card__row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.dashboard-card__label {
  color: #777;
}

.dashboard-card__value {
  font-weight: 500;
}
</style>
