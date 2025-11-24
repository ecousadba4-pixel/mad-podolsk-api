<template>
  <section class="work-list has-data daily-table">
    <div class="work-list-surface">
      <div class="work-row work-row-header">
        <div>Дата</div>
        <div>Наименование</div>
        <div>Ед.</div>
        <div>Объем</div>
        <div>Сумма</div>
      </div>

      <div v-for="row in rows" :key="row.id" class="work-row">
        <div class="daily-cell daily-cell-date">{{ row.date }}</div>
        <div class="daily-cell daily-cell-name">{{ row.name }}</div>
        <div class="daily-cell daily-cell-unit">{{ row.unit }}</div>
        <div class="daily-cell daily-cell-volume">{{ row.volume }}</div>
        <div class="daily-cell daily-cell-amount">{{ formatMoney(row.amount) }}</div>
      </div>

      <div v-if="rows && rows.length" class="work-row work-row-total daily-total-row">
        <div class="daily-cell-total-label">Итого</div>
        <div class="daily-cell-total-gap"></div>
        <div class="daily-cell-total-amount">{{ formatMoney(total) }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] }
})

const total = computed(()=>{
  return props.rows.reduce((s,r)=> s + (Number(r.amount)||0), 0)
})

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  return Number(v).toLocaleString('ru-RU')
}
</script>
