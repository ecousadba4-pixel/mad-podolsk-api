<script setup>
import { computed, ref, onMounted } from 'vue'
import { useIsMobile } from '../composables/useIsMobile.js'
import { useModal } from '../composables/useModal.js'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import SmetaCardsSection from '../components/sections/SmetaCardsSection.vue'
import SmetaDetailsTable from '../components/sections/SmetaDetailsTable.vue'
import TableSkeleton from '../components/ui/TableSkeleton.vue'
import ContractExecutionSection from '../components/sections/ContractExecutionSection.vue'
import SummaryKpiSection from '../components/sections/SummaryKpiSection.vue'
import DailyRevenueModal from '../components/modals/DailyRevenueModal.vue'
import SmetaDescriptionDailyModal from '../components/modals/SmetaDescriptionDailyModal.vue'
const smetaSortKey = ref('plan')
const smetaSortDir = ref(-1)

// use composable for mobile detection
const { isMobile } = useIsMobile()

const store = useDashboardStore()
const { monthlyLoading, monthlyError, monthlySummary, smetaDetails, smetaDetailsLoading, selectedMonth, selectedSmeta, selectedDescription, smetaCards } = storeToRefs(store)

const selectedSmetaLabel = computed(() => {
  const key = selectedSmeta.value
  if (!key) return 'Расшифровка работ по смете'
  const found = (smetaCards.value || []).find(s => s.smeta_key === key)
  const name = found ? found.label : key
  return `Расшифровка работ по смете «${name}»`
})

onMounted(async () => {
  // загрузим основные данные для текущего месяца только если их ещё нет
  // или они относятся к другому месяцу, и если в данный момент не идёт загрузка
  try {
    const loadedMonth = monthlySummary.value && (monthlySummary.value.month ? String(monthlySummary.value.month).slice(0,7) : null)
    const needLoad = !monthlySummary.value || loadedMonth !== selectedMonth.value
    if (needLoad && !monthlyLoading.value) {
      await Promise.all([store.fetchMonthlySummary(), store.fetchSmetaCards()])
    }
  } catch (e) {
    // на случай, если структура monthlySummary отличается — безопасно попытаться загрузить
    if (!monthlyLoading.value) await Promise.all([store.fetchMonthlySummary(), store.fetchSmetaCards()])
  }
})

const dailyRevenueModal = useModal(false)
const smetaDescModal = useModal(false)

function openDailyRevenue(){
  dailyRevenueModal.open()
}

// открыть попап расшифровки при выборе description
function openSmetaDescription(){
  smetaDescModal.open()
}

function refreshMonthData() {
  store.fetchMonthlySummary()
  store.fetchSmetaCards()
}

function onSelectDescription(item){
  store.setSelectedDescription(item.title || item.description)
  smetaDescModal.open()
}

// Handler for smeta card selection emitted by SmetaCardsSection
function onSmetaSelect(key){
  store.setSelectedSmeta(key)
  store.fetchSmetaDetails(key)
}
</script>

<template>
  <section class="dashboard">
    <main class="dashboard__content">
      <div v-if="monthlyLoading" class="dashboard__state">Загружаем данные…</div>
      <div v-else-if="monthlyError" class="dashboard__state dashboard__state--error">Ошибка загрузки: {{ monthlyError }}</div>


      <div v-else-if="monthlySummary" class="dashboard__grid">
        <!-- Исполнение контракта -->
        <ContractExecutionSection :contract="monthlySummary.contract" />

        <!-- Summary KPI -->
        <SummaryKpiSection :kpi="monthlySummary.kpi" @open-daily="openDailyRevenue" />

        <!-- Сметные карточки -->
        <SmetaCardsSection @select="onSmetaSelect" />

        <!-- Детали сметы (появляются при выборе сметы) -->
        <section v-if="smetaDetailsLoading || (smetaDetails && smetaDetails.length)" class="panel smeta-panel smeta-details">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title-mobile">
                <div class="panel-title-mobile-label">РАБОТЫ ПО СМЕТЕ</div>
                <div class="panel-title-mobile-value">{{ selectedSmetaLabel.replace('Расшифровка работ по смете', '') }}</div>
              </div>
              <h3 class="panel-title">{{ selectedSmetaLabel }}</h3>
              <p class="panel-note">Детали по виду работы при нажатии</p>
            </div>
            <div class="panel-header-controls panel-controls">
              <select v-if="isMobile" class="smeta-sort-select" v-model="smetaSortKey" @change="smetaSortDir = -1">
                <option value="plan">План — по убыванию</option>
                <option value="fact">Факт — по убыванию</option>
                <option value="delta">Отклонение — по убыванию</option>
              </select>
            </div>
          </div>
          <div class="panel-body">
            <div class="smeta-details-wrapper" :class="{ 'is-loading': smetaDetailsLoading }">
              <SmetaDetailsTable :items="smetaDetails" :sort-key="smetaSortKey" :sort-dir="smetaSortDir" @sort-changed="(p)=>{ smetaSortKey = p.key; smetaSortDir = p.dir }" @select="(item)=> onSelectDescription(item)" />
              <TableSkeleton v-if="smetaDetailsLoading" class="overlay-skeleton" />
            </div>
          </div>
        </section>

        <!-- Дневная таблица теперь показывается в отдельном режиме "По дням" -->

        <!-- Модальные окна -->
        <DailyRevenueModal :visible="dailyRevenueModal.isOpen" :month="selectedMonth" @close="dailyRevenueModal.close()" />
        <SmetaDescriptionDailyModal :visible="smetaDescModal.isOpen" :month="selectedMonth" :smeta_key="selectedSmeta" :description="selectedDescription" @close="smetaDescModal.close()" />
      </div>

      <div v-else class="dashboard__state">Данные ещё не загружены.</div>
    </main>
  </section>

</template>
