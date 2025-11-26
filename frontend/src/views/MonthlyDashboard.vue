<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useIsMobile } from '../composables/useIsMobile.js'
import { useModal } from '../composables/useModal.js'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import TableSkeleton from '../components/ui/TableSkeleton.vue'
import DailyRevenueModal from '../components/modals/DailyRevenueModal.vue'
import SmetaDescriptionDailyModal from '../components/modals/SmetaDescriptionDailyModal.vue'

const ContractExecutionSection = defineAsyncComponent(() => import('../components/sections/ContractExecutionSection.vue'))
const SummaryKpiSection = defineAsyncComponent(() => import('../components/sections/SummaryKpiSection.vue'))
const SmetaCardsSection = defineAsyncComponent(() => import('../components/sections/SmetaCardsSection.vue'))
const SmetaDetailsTable = defineAsyncComponent(() => import('../components/sections/SmetaDetailsTable.vue'))
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

async function loadMonthlyData(){
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
}

await loadMonthlyData()

const dailyRevenueModal = useModal(false)
const smetaDescModal = useModal(false)

const isDailyModalOpen = computed(() => dailyRevenueModal.isOpen.value)
const isSmetaDescOpen = computed(() => smetaDescModal.isOpen.value)

const openDailyRevenue = () => dailyRevenueModal.open()
const closeDailyRevenue = () => dailyRevenueModal.close()
const openSmetaDescription = () => smetaDescModal.open()
const closeSmetaDescription = () => smetaDescModal.close()

// открыть попап расшифровки при выборе description
function refreshMonthData() {
  store.fetchMonthlySummary()
  store.fetchSmetaCards()
}

function onSelectDescription(item){
  store.setSelectedDescription(item.title || item.description)
  openSmetaDescription()
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
      <Suspense>
        <template #default>
          <div v-if="monthlyError" class="dashboard__state dashboard__state--error">Ошибка загрузки: {{ monthlyError }}</div>

          <template v-else>
            <Suspense>
              <template #default>
                <div v-if="monthlySummary" class="dashboard__grid">
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
                  <DailyRevenueModal :visible="isDailyModalOpen" :month="selectedMonth" @close="closeDailyRevenue()" />
                  <SmetaDescriptionDailyModal :visible="isSmetaDescOpen" :month="selectedMonth" :smeta_key="selectedSmeta" :description="selectedDescription" @close="closeSmetaDescription()" />
                </div>

                <div v-else class="dashboard__state">Данные ещё не загружены.</div>
              </template>

              <template #fallback>
                <div class="dashboard__state">Загружаем разделы…</div>
              </template>
            </Suspense>
          </template>
        </template>

        <template #fallback>
          <div class="dashboard__state">Загружаем данные…</div>
        </template>
      </Suspense>
    </main>
  </section>

</template>
