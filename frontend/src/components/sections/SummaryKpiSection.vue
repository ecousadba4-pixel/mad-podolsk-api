<template>
  <section class="summary-grid" ref="root">
    <div class="summary-cards">
      <article class="summary-card p-md">
        <div class="summary-label type-label">План, ₽</div>
        <div class="summary-value">{{ formatMoney(kpi?.plan_total) }}</div>
      </article>

      <article class="summary-card p-md">
        <div class="summary-label type-label">Факт, ₽</div>
        <div class="summary-value">{{ formatMoney(kpi?.fact_total) }}</div>

        <div class="summary-progress" v-if="kpi">
          <div class="summary-progress-labels">
            <span>ИСПОЛНЕНИЕ</span>
            <strong>{{ percentExecuted }}%</strong>
          </div>
          <div class="summary-progress-bar" role="progressbar" :aria-valuenow="percentExecuted" aria-valuemin="0" aria-valuemax="100">
            <div class="summary-progress-fill progress__fill" :style="{ '--progress': percentExecuted + '%' }" :class="{ overflow: rawPercent > 100 }"></div>
          </div>
        </div>
      </article>

      <article class="summary-card p-md">
        <div class="summary-label type-label">Отклонение, ₽</div>
        <div class="summary-value" :class="{'negative': kpi && kpi.delta < 0}">{{ formatMoney(kpi?.delta) }}</div>
      </article>

            <article class="summary-card summary-card-interactive daily-average p-md" @click="$emit('open-daily')" :class="{ 'current-month': isCurrentMonth }">
              <div class="summary-label daily-average type-label">СР.ДНЕВ. ВЫРУЧКА, ₽</div>
              <div class="summary-value">{{ formatMoney(kpi?.avg_daily_revenue) }}</div>
              <div class="summary-card-hint" aria-hidden="true" v-if="isCurrentMonth">i</div>
            </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, nextTick, ref } from 'vue'
import { useDashboardUiStore } from '../../store/dashboardUiStore.js'
import { storeToRefs } from 'pinia'

const props = defineProps({ kpi: { type: Object, default: () => ({}) } })
const emit = defineEmits(['open-daily'])

// Покажем иконку-подсказку только если выбран текущий календарный месяц
const store = useDashboardUiStore()
const { selectedMonth } = storeToRefs(store)
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

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

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
