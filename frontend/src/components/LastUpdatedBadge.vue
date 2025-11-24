<template>
  <div class="last-updated" v-if="display">
    <span class="last-updated__dot" aria-hidden="true"></span>
    <div class="last-updated__text">
      <div class="last-updated__label">ДАННЫЕ ОБНОВЛЕНЫ</div>
      <div class="last-updated__time">{{ formatted }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'

const props = defineProps({ loadedAt: { type: [String, Date], default: null } })

const store = useDashboardStore()

const source = computed(() => {
  if (props.loadedAt) return props.loadedAt
  return store.loadedAt || store.monthlySummary?.loaded_at || null
})

const display = computed(()=> !!source.value)

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function pad(n){ return String(n).padStart(2,'0') }

const formatted = computed(()=>{
  const v = source.value
  if (!v) return ''
  const d = (typeof v === 'string') ? new Date(v) : new Date(v)
  if (isNaN(d)) return String(v)
  const day = d.getDate()
  const monthName = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${day} ${monthName} ${year} г., ${hh}:${mm}`
})
</script>
