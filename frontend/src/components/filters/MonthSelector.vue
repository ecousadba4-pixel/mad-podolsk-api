<script setup>
import { computed } from 'vue'
import { useDashboardStore } from '../../store/dashboardStore.js'
import { storeToRefs } from 'pinia'

const store = useDashboardStore()
const { selectedMonth } = storeToRefs(store)
const emit = defineEmits(['change'])

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
  // Inform parent about the change; parent/view should handle store updates
  emit('change', e.target.value)
}
</script>

<template>
  <div class="month-selector inline p-sm">
    <label class="month-selector__label">Месяц</label>
    <select class="month-selector__select control" :value="selectedMonth.value" @change="onChange">
      <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
    </select>
  </div>

</template>
