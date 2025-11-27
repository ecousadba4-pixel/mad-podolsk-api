<template>
  <main class="page">
    <section class="page-content">

      <div v-if="dailyLoading">Загрузка...</div>
      <template v-else>
        <!-- Printable report kept on the page for export; button moved to AppHeader -->
        <ReportPrintable :rows="dailyRows" :date="selectedDate" :total="dailyTotal" />

        <MobileDailyFull v-if="isMobile || forceMobile" :rows="dailyRows" :total-amount="dailyTotal" :date="selectedDate" />
        <DailyTable v-else :rows="dailyRows" :total-amount="dailyTotal" :date="selectedDate" />
      </template>
    </section>
  </main>
</template>

<script setup>
import { useDashboardDataStore } from '../store/dashboardDataStore.js'
import { useDashboardUiStore } from '../store/dashboardUiStore.js'
import { storeToRefs } from 'pinia'
import DailyTable from '../components/sections/DailyTable.vue'
import MobileDailyFull from '../components/sections/MobileDailyFull.vue'
import ReportPrintable from '../components/report/ReportPrintable.vue'
import { useBodyClass } from '../composables/useBodyClass.js'
import { useIsMobile } from '../composables/useIsMobile.js'

const dataStore = useDashboardDataStore()
const uiStore = useDashboardUiStore()
const { dailyLoading, dailyRows, dailyTotal } = storeToRefs(dataStore)
const { selectedDate } = storeToRefs(uiStore)

useBodyClass('page-daily-bg')

const { isMobile } = useIsMobile()
// Temporary: allow forcing mobile view via URL `?mobile=1` for testing
let forceMobile = false
try {
  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  forceMobile = sp ? sp.get('mobile') === '1' : false
} catch (e) { forceMobile = false }
</script>
