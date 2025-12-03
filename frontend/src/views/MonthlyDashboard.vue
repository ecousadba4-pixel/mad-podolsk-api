<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useIsMobile } from '../composables/useIsMobile.js'
import { useModal } from '../composables/useModal.js'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import { TableSkeleton } from '../components/common'
import { DailyRevenueModal, SmetaDescriptionDailyModal, TypeOfWorkModal } from '../components/modals'
import { PageSection } from '../components/layouts'
import { isVneregKey } from '../composables/useSmetaBreakdown.js'

const ContractExecutionSection = defineAsyncComponent(() => import('../components/dashboard/ContractExecutionSection.vue'))
const SummaryKpiSection = defineAsyncComponent(() => import('../components/dashboard/SummaryKpiSection.vue'))
const SmetaCardsSection = defineAsyncComponent(() => import('../components/dashboard/SmetaCardsSection.vue'))
const SmetaDetails = defineAsyncComponent(() => import('../components/dashboard/SmetaDetails.vue'))
const smetaSortKey = ref('plan')
const smetaSortDir = ref(-1)

// use composable for mobile detection
const { isMobile } = useIsMobile()

const store = useDashboardStore()
const { monthlyLoading, monthlyError, monthlySummary, smetaDetails, smetaDetailsLoading, selectedMonth, selectedSmeta, selectedDescription, smetaCards } = storeToRefs(store)

// Watch for smeta changes to set default sort key
// Лето и Зима - сортировка по План, Внерегламент - сортировка по Факт
watch(selectedSmeta, (newKey) => {
  if (isVneregKey(newKey)) {
    smetaSortKey.value = 'fact'
  } else {
    smetaSortKey.value = 'plan'
  }
  smetaSortDir.value = -1
}, { immediate: true })

const selectedSmetaLabel = computed(() => {
  const key = selectedSmeta.value
  if (!key) return ''
  const found = (smetaCards.value || []).find(s => s.smeta_key === key)
  const name = found ? found.label : key
  return name
})

const selectedSmetaDesktopTitle = computed(() => {
  const name = selectedSmetaLabel.value
  return name ? `Расшифровка работ по смете «${name}»` : 'Расшифровка работ по смете'
})

const dailyRevenueModal = useModal(false)
const smetaDescModal = useModal(false)
const typeOfWorkModal = useModal(false)

// collapsed state for mobile smeta list (toggle from header chevron)
const isSmetaCollapsed = ref(false)

const isDailyModalOpen = computed(() => dailyRevenueModal.isOpen.value)
const isSmetaDescOpen = computed(() => smetaDescModal.isOpen.value)
const isTypeOfWorkModalOpen = computed(() => typeOfWorkModal.isOpen.value)

const openDailyRevenue = () => dailyRevenueModal.open()
const closeDailyRevenue = () => dailyRevenueModal.close()
const openSmetaDescription = () => smetaDescModal.open()
const closeSmetaDescription = () => smetaDescModal.close()
const openTypeOfWorkModal = () => typeOfWorkModal.open()
const closeTypeOfWorkModal = () => typeOfWorkModal.close()

// открыть попап расшифровки при выборе description
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
                <div v-if="monthlySummary" class="dashboard__grid" :class="{ 'is-loading': monthlyLoading }">
                  <!-- Исполнение контракта -->
                  <ContractExecutionSection :contract="monthlySummary.contract" />

                  <!-- Summary KPI -->
                  <SummaryKpiSection :kpi="monthlySummary.kpi" @open-daily="openDailyRevenue" @open-fact-types="openTypeOfWorkModal" />

                  <!-- Сметные карточки -->
                  <SmetaCardsSection @select="onSmetaSelect" />

                  <!-- Детали сметы (появляются при выборе сметы) -->
                  <PageSection
                    v-if="smetaDetailsLoading || (smetaDetails && smetaDetails.length)"
                    variant="panel"
                    class="smeta-panel smeta-details"
                  >
                    <template #header>
                      <div class="panel-title-group">
                        <h3 v-if="!isMobile" class="panel-title">{{ selectedSmetaDesktopTitle }}</h3>
                        <div v-if="isMobile" class="panel-title-mobile">
                          <h3 class="panel-title-mobile-main">Работы по смете {{ selectedSmetaLabel }}</h3>
                          <p class="panel-note-mobile">Детали по виду работы при нажатии</p>
                        </div>
                        <p v-else class="panel-note">Детали по виду работы при нажатии</p>
                      </div>
                    </template>

                    <div v-show="!isSmetaCollapsed" class="smeta-details-wrapper" :class="{ 'is-loading': smetaDetailsLoading }">
                      <SmetaDetails :items="smetaDetails" :sort-key="smetaSortKey" :sort-dir="smetaSortDir" @sort-changed="(p)=>{ smetaSortKey = p.key; smetaSortDir = p.dir }" @select="(item)=> onSelectDescription(item)" />
                      <TableSkeleton v-if="smetaDetailsLoading" class="overlay-skeleton" />
                    </div>
                  </PageSection>

                  <!-- Дневная таблица теперь показывается в отдельном режиме "По дням" -->

                  <!-- Модальные окна -->
                  <DailyRevenueModal :visible="isDailyModalOpen" :month="selectedMonth" @close="closeDailyRevenue()" />
                  <SmetaDescriptionDailyModal :visible="isSmetaDescOpen" :month="selectedMonth" :smeta_key="selectedSmeta" :description="selectedDescription" @close="closeSmetaDescription()" />
                  <TypeOfWorkModal :visible="isTypeOfWorkModalOpen" :month="selectedMonth" @close="closeTypeOfWorkModal()" />
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
