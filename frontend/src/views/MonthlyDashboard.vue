<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useIsMobile } from '../composables/useIsMobile.js'
import { useDashboardUiStore } from '../store/dashboardUiStore.js'
import { useDashboardDataStore } from '../store/dashboardDataStore.js'
import { useSmetaSelection } from '../composables/useSmetaSelection.js'
import { useSmetaSorting } from '../composables/useSmetaSorting.js'
import { useDescriptionsModal } from '../composables/useDescriptionsModal.js'
import { storeToRefs } from 'pinia'
import TableSkeleton from '../components/ui/TableSkeleton.vue'
import DailyRevenueModal from '../components/modals/DailyRevenueModal.vue'
import SmetaDescriptionDailyModal from '../components/modals/SmetaDescriptionDailyModal.vue'
import SmetaPanelNote from '../components/ui/SmetaPanelNote.vue'

const ContractExecutionSection = defineAsyncComponent(() => import('../components/sections/ContractExecutionSection.vue'))
const SummaryKpiSection = defineAsyncComponent(() => import('../components/sections/SummaryKpiSection.vue'))
const SmetaCardsSection = defineAsyncComponent(() => import('../components/sections/SmetaCardsSection.vue'))
const SmetaDetails = defineAsyncComponent(() => import('../components/sections/SmetaDetails.vue'))

const { isMobile } = useIsMobile()

const uiStore = useDashboardUiStore()
const dataStore = useDashboardDataStore()
const { monthlyLoading, monthlyError, monthlySummary } = storeToRefs(dataStore)
const { selectedMonth, selectedSmeta, isDailyModalOpen } = storeToRefs(uiStore)

const { selectedSmetaLabel, selectedSmetaDesktopTitle, smetaDetails, smetaDetailsLoading, selectSmeta, ensureDetailsLoaded } = useSmetaSelection()
const { sortKey: smetaSortKey, sortDir: smetaSortDir } = useSmetaSorting('plan', -1)
const { selectedDescription, isDescriptionModalOpen, open: openSmetaDescription, close: closeSmetaDescription } = useDescriptionsModal()

// collapsed state for mobile smeta list (toggle from header chevron)
const isSmetaCollapsed = ref(false)

const openDailyRevenue = () => uiStore.openDailyModal()
const closeDailyRevenue = () => uiStore.closeDailyModal()

// открыть попап расшифровки при выборе description
function onSelectDescription(item){
  openSmetaDescription(item.title || item.description)
}

// Handler for smeta card selection emitted by SmetaCardsSection
function onSmetaSelect(key){
  selectSmeta(key)
  ensureDetailsLoaded(key)
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
                        <h3 v-if="!isMobile" class="panel-title">{{ selectedSmetaDesktopTitle }}</h3>
                        <SmetaPanelNote :label="selectedSmetaLabel" />
                      </div>
                    </div>
                    <div class="panel-body" v-show="!isSmetaCollapsed">
                      <div class="smeta-details-wrapper" :class="{ 'is-loading': smetaDetailsLoading }">
                        <SmetaDetails :items="smetaDetails" :sort-key="smetaSortKey" :sort-dir="smetaSortDir" @sort-changed="(p)=>{ smetaSortKey.value = p.key; smetaSortDir.value = p.dir }" @select="(item)=> onSelectDescription(item)" />
                        <TableSkeleton v-if="smetaDetailsLoading" class="overlay-skeleton" />
                      </div>
                    </div>
                  </section>

                  <!-- Дневная таблица теперь показывается в отдельном режиме "По дням" -->

                  <!-- Модальные окна -->
                  <DailyRevenueModal :visible="isDailyModalOpen" :month="selectedMonth" @close="closeDailyRevenue()" />
                  <SmetaDescriptionDailyModal :visible="isDescriptionModalOpen" :month="selectedMonth" :smeta_key="selectedSmeta" :description="selectedDescription" @close="closeSmetaDescription()" />
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
