<template>
  <div class="day-picker" ref="root">
    <button
      type="button"
      class="day-picker__toggle control picker-toggle"
      @click="openNative()"
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

    <!-- native date input opened programmatically -->
    <input ref="inputDate" class="day-picker__input" type="date" :value="value" @input="onInput" :min="monthStart" :max="monthEnd" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'

const store = useDashboardStore()
const { selectedDate } = storeToRefs(store)
const inputDate = ref(null)

const value = computed(() => selectedDate.value)
const currentLabel = computed(() => {
  const v = selectedDate.value
  if (!v) return ''
  const d = new Date(v)
  return d.toLocaleString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
})

// Restrict picker to a 30-day range ending today (includes today)
// NOTE: выбираем 30 дней назад от сегодня (включительно). Если нужно
// другое поведение (например, 30 дней вперёд или диапазон по выбранному
// месяцу), сообщите и я поменяю.
const monthStart = computed(() => {
  const t = new Date()
  const s = new Date(t)
  // 30 дней включая сегодня -> от сегодняшней даты минус 29 дней
  s.setDate(s.getDate() - 29)
  return s.toISOString().slice(0,10)
})
const monthEnd = computed(() => {
  const t = new Date()
  return t.toISOString().slice(0,10)
})

function openNative(){
  try{ inputDate.value && inputDate.value.showPicker && inputDate.value.showPicker(); }catch(e){}
  try{ inputDate.value && inputDate.value.focus(); }catch(e){}
}

async function onInput(e){
  const v = e.target.value
  if (!v) return
  // ignore selections outside current month
  if (v < monthStart.value || v > monthEnd.value) return
  store.setSelectedDate(v)
  await store.fetchDaily(v)
}
</script>

