<template>
  <div class="monthly-dashboard">

    <!-- Блок выбора месяца -->
    <section class="month-selector">
      <label for="month">Выберите месяц:</label>
      <input
        id="month"
        type="month"
        v-model="selectedMonth"
        @change="onMonthChange"
      />
    </section>

    <!-- KPI блок -->
    <section class="kpi-block">
      <div class="kpi-item">
        <div class="kpi-label">План</div>
        <div class="kpi-value">—</div>
      </div>

      <div class="kpi-item">
        <div class="kpi-label">Факт</div>
        <div class="kpi-value">—</div>
      </div>

      <div class="kpi-item">
        <div class="kpi-label">Отклонение</div>
        <div class="kpi-value">—</div>
      </div>

      <div class="kpi-item">
        <div class="kpi-label">Среднедневная выручка</div>
        <div class="kpi-value">—</div>
      </div>
    </section>

    <!-- Карточки смет -->
    <section class="smeta-cards">
      <div class="smeta-card">Смета «Лето»</div>
      <div class="smeta-card">Смета «Зима»</div>
      <div class="smeta-card">Смета «Внерегламент»</div>
    </section>

    <!-- Таблица работ (пока заглушка) -->
    <section class="work-list">
      <h3>Виды работ</h3>
      <p>Скоро тут будет таблица с работами…</p>
    </section>

  </div>
</template>

<script setup>
import { useDashboardStore } from '../store/dashboardStore'
import { computed } from 'vue'

const store = useDashboardStore()

const selectedMonth = computed({
  get: () => store.selectedMonth,
  set: (v) => store.setSelectedMonth(v)
})

function onMonthChange() {
  // Позже здесь будет реальный запрос к API
  console.log('Выбран месяц:', store.selectedMonth)
}
</script>

<style scoped>
.monthly-dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Селектор месяца */
.month-selector {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  display: inline-block;
}

/* KPI */
.kpi-block {
  display: flex;
  gap: 16px;
}

.kpi-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  flex: 1;
}

.kpi-label {
  font-size: 14px;
  color: #777;
}

.kpi-value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 600;
}

/* Сметы */
.smeta-cards {
  display: flex;
  gap: 16px;
}

.smeta-card {
  background: white;
  flex: 1;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

/* Таблица работ */
.work-list {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
</style>
