<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import MonthSelector from '../components/filters/MonthSelector.vue'
import SmetaCardsSection from '../components/sections/SmetaCardsSection.vue'

const store = useDashboardStore()

onMounted(async () => {
  // загрузим основные данные для текущего месяца
  await Promise.all([store.fetchMonthlySummary(), store.fetchSmetaCards()])
})
</script>

<template>
  <section class="dashboard">
    <header class="dashboard__controls">
      <MonthSelector />
    </header>

    <main class="dashboard__content">
      <div v-if="store.monthlyLoading" class="dashboard__state">Загружаем данные…</div>
      <div v-else-if="store.monthlyError" class="dashboard__state dashboard__state--error">Ошибка загрузки: {{ store.monthlyError }}</div>

      <div v-else-if="store.monthlySummary" class="dashboard__grid">
        <!-- Основные KPI -->
        <section class="dashboard-card">
          <h2 class="dashboard-card__title">Контракт</h2>
          <div class="dashboard-card__row"><span class="dashboard-card__label">План:</span><span class="dashboard-card__value">{{ store.monthlySummary.kpi?.plan_total?.toLocaleString() }}</span></div>
          <div class="dashboard-card__row"><span class="dashboard-card__label">Факт:</span><span class="dashboard-card__value">{{ store.monthlySummary.kpi?.fact_total?.toLocaleString() }}</span></div>
          <div class="dashboard-card__row"><span class="dashboard-card__label">Исполнение:</span><span class="dashboard-card__value">{{ Math.round((store.monthlySummary.contract?.contract_planfact_pct || 0) * 100) }} %</span></div>
        </section>

        <!-- Сметные карточки -->
        <SmetaCardsSection />
      </div>

      <div v-else class="dashboard__state">Данные ещё не загружены.</div>
    </main>
  </section>

</template>
