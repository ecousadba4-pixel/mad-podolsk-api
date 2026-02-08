<template>
  <div class="day-picker" ref="root">
    <button
      type="button"
      class="day-picker__toggle control picker-toggle"
      @click="openCalendar"
      :aria-label="`Выбор даты, текущая: ${currentLabel}`"
    >
        <div class="day-picker__info">
          <span class="day-picker__current">{{ currentLabel }}</span>
        </div>
        <span class="day-picker__arrow" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
    </button>

    <CalendarDropdown
      v-model:isOpen="isCalendarOpen"
      :modelValue="value"
      :minDate="monthStart"
      :maxDate="monthEnd"
      :anchorRect="anchorRect"
      @select="onDateSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDailyStore } from '../../store/dailyStore'
import { storeToRefs } from 'pinia'
import CalendarDropdown from './CalendarDropdown.vue'

const dailyStore = useDailyStore()
const { selectedDate } = storeToRefs(dailyStore)
const root = ref(null)
const isCalendarOpen = ref(false)
const anchorRect = ref(null)

const value = computed(() => selectedDate.value)
const currentLabel = computed(() => {
  const v = selectedDate.value
  if (!v) return ''
  const d = new Date(v)
  return d.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
})

// Restrict picker to a 30-day range ending today (includes today)
const monthStart = computed(() => {
  const t = new Date()
  const s = new Date(t)
  s.setDate(s.getDate() - 29)
  return s.toISOString().slice(0,10)
})
const monthEnd = computed(() => {
  const t = new Date()
  return t.toISOString().slice(0,10)
})

function openCalendar() {
  if (root.value) {
    const rect = root.value.getBoundingClientRect()
    anchorRect.value = {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height
    }
  }
  isCalendarOpen.value = true
}

async function onDateSelect(dateStr) {
  if (!dateStr) return
  if (dateStr < monthStart.value || dateStr > monthEnd.value) return
  dailyStore.setSelectedDate(dateStr)
  await dailyStore.fetchDaily(dateStr)
}
</script>

