<template>
  <section class="summary-grid" ref="root">
    <div class="summary-cards">
      <article class="summary-card p-md">
        <UiLabel class="summary-label type-label">План, ₽</UiLabel>
        <div class="summary-value">{{ formatMoney(kpi?.plan_total) }}</div>
      </article>

      <article class="summary-card summary-card-interactive p-md" @click="$emit('open-fact-types')">
        <UiLabel class="summary-label type-label">Факт, ₽</UiLabel>
        <div class="summary-value">{{ formatMoney(kpi?.fact_total) }}</div>

        <UiProgress
          v-if="kpi"
          :value="rawPercent"
          :color="rawPercent > 100 ? 'success' : 'accent'"
          :labels="{ left: 'ИСПОЛНЕНИЕ', right: `${percentExecuted}%` }"
          class="summary-progress"
        />
        <div class="summary-card-hint" aria-hidden="true">i</div>
      </article>

      <article class="summary-card p-md">
        <UiLabel class="summary-label type-label">Отклонение, ₽</UiLabel>
        <div class="summary-value" :class="{ 'negative': kpi && kpi.delta < 0 }">{{ formatMoney(kpi?.delta) }}</div>
      </article>

            <article class="summary-card summary-card-interactive daily-average p-md" @click="$emit('open-daily')" :class="{ 'current-month': isCurrentMonth }">
              <UiLabel class="summary-label daily-average type-label">СР.ДНЕВ. ВЫРУЧКА, ₽</UiLabel>
              <div class="summary-value">{{ formatMoney(kpi?.avg_daily_revenue) }}</div>
              <div class="summary-card-hint" aria-hidden="true" v-if="isCurrentMonth">i</div>
            </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue'
import { useDashboardUiStore } from '../../store/dashboardUiStore'
import { storeToRefs } from 'pinia'
import { UiLabel, UiProgress } from '../ui'

const props = defineProps({ kpi: { type: Object, default: () => ({}) } })
const emit = defineEmits(['open-daily', 'open-fact-types'])

// Покажем иконку-подсказку только если выбран текущий календарный месяц
const uiStore = useDashboardUiStore()
const { selectedMonth } = storeToRefs(uiStore)
const isCurrentMonth = computed(() => {
  const sel = String(selectedMonth.value || '').slice(0, 7)
  const now = new Date().toISOString().slice(0, 7)
  return sel === now
})

const rawPercent = computed(() => {
  const plan = Number(props.kpi?.plan_total || 0)
  const fact = Number(props.kpi?.fact_total || 0)
  if (!plan || plan === 0) return 0
  return Math.round((fact / plan) * 100)
})

const percentExecuted = computed(() => {
  const v = rawPercent.value
  if (v < 0) return 0
  if (v > 100) return 100
  return v
})

import { formatMoney } from '../../utils/format'

// Автоматическое уменьшение размера заголовков, чтобы все четыре метки помещались в одну строку
const root = ref(null)
let resizeObserver = null
let resizeHandler = null

function adjustSummaryLabelSize() {
  // Найдём все лейблы внутри секции
  const el = root.value || document.querySelector('.summary-grid')
  if (!el) return
  const labels = Array.from(el.querySelectorAll('.summary-label'))
  if (!labels.length) return

  // Сначала сбросим кастомную переменную, чтобы считать от базового размера
  el.style.removeProperty('--summary-label-fs')

  // Получаем текущ базовый размер из computed style первого лейбла
  const cs = getComputedStyle(labels[0])
  let fontSize = parseFloat(cs.fontSize) || 20
  const minSize = 12 // минимальный размер шрифта

  // Функция проверяет, есть ли переполнение у любого лейбла
  function anyOverflow() {
    return labels.some(l => l.scrollWidth > l.clientWidth + 1)
  }

  // Понижаем размер на 1px пока есть переполнение и больше minSize
  // и применяем один и тот же размер ко всем лейблам через CSS-переменную
  while (fontSize > minSize) {
    // применяем пробный размер
    el.style.setProperty('--summary-label-fs', fontSize + 'px')
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    labels[0].offsetWidth
    if (!anyOverflow()) break
    fontSize = Math.round(fontSize - 1)
  }
}

function scheduleAdjust() {
  // небольшая дебаунс-обертка
  if (resizeHandler) clearTimeout(resizeHandler)
  resizeHandler = setTimeout(() => {
    nextTick().then(adjustSummaryLabelSize)
  }, 80)
}

onMounted(() => {
  // привяжем слушатель ресайза и MutationObserver/ResizeObserver
  scheduleAdjust()
  window.addEventListener('resize', scheduleAdjust)

  // Также наблюдаем за изменениями DOM внутри summary-cards (например, данные KPI)
  try {
    resizeObserver = new ResizeObserver(scheduleAdjust)
    const container = document.querySelector('.summary-cards')
    if (container) resizeObserver.observe(container)
  } catch (e) {
    // игнорируем, если ResizeObserver не поддерживается
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleAdjust)
  if (resizeObserver) resizeObserver.disconnect()
  if (resizeHandler) clearTimeout(resizeHandler)
})

// При изменении данных KPI пересчитаем
watch(() => props.kpi, () => {
  scheduleAdjust()
}, { deep: true })

</script>
