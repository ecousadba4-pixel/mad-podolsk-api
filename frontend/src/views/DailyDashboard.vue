<template>
  <main class="page">
    <section class="page-content">

      <div v-if="dailyLoading">Загрузка...</div>
      <template v-else>
        <!-- Printable report removed; export button kept in AppHeader -->

        <MobileDailyFull v-if="isMobile || forceMobile" :rows="dailyRows" :total-amount="dailyTotal" :date="selectedDate" />
        <DailyTable v-else :rows="dailyRows" :total-amount="dailyTotal" :date="selectedDate" />
      </template>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import DailyTable from '../components/sections/DailyTable.vue'
import MobileDailyFull from '../components/sections/MobileDailyFull.vue'
import { useBodyClass } from '../composables/useBodyClass.js'
import { useIsMobile } from '../composables/useIsMobile.js'

const store = useDashboardStore()
const { dailyLoading, dailyRows, dailyTotal, selectedDate } = storeToRefs(store)

useBodyClass('page-daily-bg')

const { isMobile } = useIsMobile()
// Temporary: allow forcing mobile view via URL `?mobile=1` for testing
let forceMobile = false
try {
  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  forceMobile = sp ? sp.get('mobile') === '1' : false
} catch (e) { forceMobile = false }

onMounted(()=>{
  // пометить режим и загрузить данные за текущую выбранную дату
  store.setMode && store.setMode('daily')
  store.fetchDaily(selectedDate.value)
})
</script>
