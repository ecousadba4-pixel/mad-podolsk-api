<script setup>
import { computed } from 'vue'
import { useDashboardStore } from '../../store/dashboardStore.js'

const store = useDashboardStore()

const months = computed(() => {
  // генерация списка месяцев (6 месяцев назад + текущий)
  const list = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('ru-RU', { year: 'numeric', month: 'long' })
    list.push({ value: val, label })
  }
  return list
})

function onChange(e) {
  store.setSelectedMonth(e.target.value)
  store.fetchMonthlySummary()
  store.fetchSmetaCards()
}
</script>

<template>
  <div class="month-selector">
    <label class="month-selector__label">Месяц</label>
    <select class="month-selector__select" :value="store.selectedMonth" @change="onChange">
      <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.month-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}
.month-selector__label { color: #444; font-weight: 500 }
.month-selector__select { padding: 6px 10px; border-radius: 6px }
</style>
