<template>
  <section class="summary-grid">
    <div class="summary-cards">
      <article class="summary-card">
        <div class="summary-label">План, ₽</div>
        <div class="summary-value">{{ formatMoney(kpi?.plan_total) }}</div>
      </article>

      <article class="summary-card">
        <div class="summary-label">Факт, ₽</div>
        <div class="summary-value">{{ formatMoney(kpi?.fact_total) }}</div>

        <div class="summary-progress" v-if="kpi">
          <div class="summary-progress-labels">
            <span>ИСПОЛНЕНИЕ</span>
            <strong>{{ percentExecuted }}%</strong>
          </div>
          <div class="summary-progress-bar" role="progressbar" :aria-valuenow="percentExecuted" aria-valuemin="0" aria-valuemax="100">
            <div class="summary-progress-fill" :style="{ width: percentExecuted + '%' }" :class="{ overflow: rawPercent > 100 }"></div>
          </div>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-label">Отклонение, ₽</div>
        <div class="summary-value" :class="{'negative': kpi && kpi.delta < 0}">{{ formatMoney(kpi?.delta) }}</div>
      </article>

      <article class="summary-card summary-card-interactive daily-average" @click="$emit('open-daily')">
        <div class="summary-label daily-average">СР.ДНЕВ. ВЫРУЧКА, ₽</div>
        <div class="summary-value">{{ formatMoney(kpi?.avg_daily_revenue) }}</div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ kpi: { type: Object, default: () => ({}) } })
const emit = defineEmits(['open-daily'])

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
  return Number(v).toLocaleString('ru-RU')
}
</script>
