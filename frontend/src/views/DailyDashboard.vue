<template>
  <main class="page">
    <section class="page-content">
      
      <div v-if="store.dailyLoading">Загрузка...</div>
      <DailyTable v-else :rows="store.dailyRows" :total-amount="store.dailyTotal" :date="store.selectedDate" />
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import DailyTable from '../components/sections/DailyTable.vue'

const store = useDashboardStore()

onMounted(()=>{
  // пометить режим и загрузить данные за текущую выбранную дату
  store.setMode && store.setMode('daily')
  store.fetchDaily(store.selectedDate)
})
</script>
