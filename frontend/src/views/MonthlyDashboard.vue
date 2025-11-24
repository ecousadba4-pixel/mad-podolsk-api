<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import SmetaCardsSection from '../components/sections/SmetaCardsSection.vue'
import SmetaDetailsTable from '../components/sections/SmetaDetailsTable.vue'
import ContractExecutionSection from '../components/sections/ContractExecutionSection.vue'
import SummaryKpiSection from '../components/sections/SummaryKpiSection.vue'
import DailyRevenueModal from '../components/modals/DailyRevenueModal.vue'
import SmetaDescriptionDailyModal from '../components/modals/SmetaDescriptionDailyModal.vue'
import { ref } from 'vue'

const store = useDashboardStore()

onMounted(async () => {
  // загрузим основные данные для текущего месяца
  await Promise.all([store.fetchMonthlySummary(), store.fetchSmetaCards()])
})

const dailyRevenueVisible = ref(false)
const smetaDescVisible = ref(false)

function openDailyRevenue(){
  dailyRevenueVisible.value = true
}

// открыть попап расшифровки при выборе description
function openSmetaDescription(){
  smetaDescVisible.value = true
}

function refreshMonthData() {
  store.fetchMonthlySummary()
  store.fetchSmetaCards()
}
</script>

<template>
  <section class="dashboard">
    <main class="dashboard__content">
      <div v-if="store.monthlyLoading" class="dashboard__state">Загружаем данные…</div>
      <div v-else-if="store.monthlyError" class="dashboard__state dashboard__state--error">Ошибка загрузки: {{ store.monthlyError }}</div>


      <div v-else-if="store.monthlySummary" class="dashboard__grid">
        <!-- Исполнение контракта -->
        <ContractExecutionSection :contract="store.monthlySummary.contract" />

        <!-- Summary KPI -->
        <SummaryKpiSection :kpi="store.monthlySummary.kpi" @open-daily="openDailyRevenue" />

        <!-- Сметные карточки -->
        <SmetaCardsSection />

        <!-- Детали сметы (появляются при выборе сметы) -->
        <section v-if="store.smetaDetails && store.smetaDetails.length" class="dashboard-section">
          <h3 class="dashboard-section__title">Детали сметы</h3>
          <SmetaDetailsTable :items="store.smetaDetails" @select="(item)=>{ store.setSelectedDescription(item.title); smetaDescVisible = true }" />
        </section>

        <!-- Дневная таблица теперь показывается в отдельном режиме "По дням" -->

        <!-- Модальные окна -->
        <DailyRevenueModal :visible="dailyRevenueVisible" :month="store.selectedMonth" @close="dailyRevenueVisible = false" />
        <SmetaDescriptionDailyModal :visible="smetaDescVisible" :month="store.selectedMonth" :smeta_key="store.selectedSmeta" :description="store.selectedDescription" @close="smetaDescVisible = false" />
      </div>

      <div v-else class="dashboard__state">Данные ещё не загружены.</div>
    </main>
  </section>

</template>
