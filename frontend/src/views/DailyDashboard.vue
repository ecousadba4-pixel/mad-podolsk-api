<template>
  <main class="page">
    <section class="page-content">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <button class="btn" @click="store.fetchDaily(store.selectedDate)">Загрузить дневную таблицу</button>
        <div class="dashboard__small">Дата: <strong>{{ store.selectedDate }}</strong></div>
      </div>

      <DailyTable :rows="store.dailyRows" />
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
