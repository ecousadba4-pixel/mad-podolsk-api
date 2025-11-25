<script setup>
import { onMounted, computed } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import SmetaCardsSection from '../components/sections/SmetaCardsSection.vue'
import SmetaDetailsTable from '../components/sections/SmetaDetailsTable.vue'
import TableSkeleton from '../components/ui/TableSkeleton.vue'
import ContractExecutionSection from '../components/sections/ContractExecutionSection.vue'
import SummaryKpiSection from '../components/sections/SummaryKpiSection.vue'
import DailyRevenueModal from '../components/modals/DailyRevenueModal.vue'
import SmetaDescriptionDailyModal from '../components/modals/SmetaDescriptionDailyModal.vue'
import { ref } from 'vue'

const smetaSortKey = ref('plan')
const smetaSortDir = ref(-1)

const store = useDashboardStore()

const selectedSmetaLabel = computed(() => {
  const key = store.selectedSmeta
  if (!key) return 'Расшифровка работ по смете'
  const found = (store.smetaCards || []).find(s => s.smeta_key === key)
  const name = found ? found.label : key
  return `Расшифровка работ по смете «${name}»`
})

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
        <section v-if="store.smetaDetailsLoading || (store.smetaDetails && store.smetaDetails.length)" class="panel smeta-panel smeta-details">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title-mobile">
                <div class="panel-title-mobile-label">РАБОТЫ ПО СМЕТЕ</div>
                <div class="panel-title-mobile-value">{{ selectedSmetaLabel.replace('Расшифровка работ по смете', '') }}</div>
              </div>
              <h3 class="panel-title">{{ selectedSmetaLabel }}</h3>
            </div>
            <div class="panel-header-controls">
              <select class="smeta-sort-select" v-model="smetaSortKey" @change="smetaSortDir = -1">
                <option value="plan">План — по убыванию</option>
                <option value="fact">Факт — по убыванию</option>
                <option value="delta">Отклонение — по убыванию</option>
              </select>
            </div>
          </div>
          <div class="panel-body">
            <div class="smeta-details-wrapper" :class="{ 'is-loading': store.smetaDetailsLoading }" style="position:relative;">
              <SmetaDetailsTable :items="store.smetaDetails" :sort-key="smetaSortKey" :sort-dir="smetaSortDir" @sort-changed="(p)=>{ smetaSortKey = p.key; smetaSortDir = p.dir }" @select="(item)=>{ store.setSelectedDescription(item.title || item.description); smetaDescVisible = true }" />
              <TableSkeleton v-if="store.smetaDetailsLoading" class="overlay-skeleton" />
            </div>
          </div>
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
