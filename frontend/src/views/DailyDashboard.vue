<template>
  <main class="page">
    <section class="page-content">

      <div v-if="dailyLoading">Загрузка...</div>
      <DailyTable v-else :rows="dailyRows" :total-amount="dailyTotal" :date="selectedDate" />
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import DailyTable from '../components/sections/DailyTable.vue'
import { useBodyClass } from '../composables/useBodyClass.js'

const store = useDashboardStore()
const { dailyLoading, dailyRows, dailyTotal, selectedDate } = storeToRefs(store)

useBodyClass('page-daily-bg')

onMounted(()=>{
  // пометить режим и загрузить данные за текущую выбранную дату
  store.setMode && store.setMode('daily')
  store.fetchDaily(selectedDate.value)
})
</script>
