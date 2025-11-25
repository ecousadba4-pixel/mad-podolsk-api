<template>
  <section class="panel smeta-panel panel--full-bleed">
    <div class="panel-header">
      <div class="panel-title-group">
        <h3 class="panel-title">Данные по выручке за {{ displayDate }}</h3>
      </div>
    </div>
    <div class="panel-body">
      <div class="smeta-details-wrapper">
        <table class="smeta-breakdown-table" style="width:100%">
        <colgroup>
          <col />
          <col style="width:110px" />
          <col style="width:120px" />
          <col style="width:140px" />
        </colgroup>
        <thead>
          <tr>
            <th>Работы</th>
            <th class="numeric">Ед.</th>
            <th class="numeric">Объем</th>
            <th class="numeric">Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in sortedRows" :key="row.id || idx">
            <td>{{ row.name }}</td>
            <td class="numeric">{{ row.unit }}</td>
            <td class="numeric">{{ formatVolume(row.volume) }}</td>
            <td class="numeric">{{ formatMoney(row.amount) }}</td>
          </tr>

          <tr v-if="sortedRows && sortedRows.length" class="daily-total-row">
            <td colspan="3" style="font-weight:700; text-align:right; padding-right:16px">Итого</td>
            <td class="numeric" style="font-weight:700">{{ formatMoney(total) }}</td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: null },
  date: { type: String, default: '' }
})

const total = computed(()=>{
  if (props.totalAmount !== null && props.totalAmount !== undefined) return Number(props.totalAmount) || 0
  return props.rows.reduce((s,r)=> s + (Number(r.amount)||0), 0)
})

// sort rows by amount desc by default
const sortedRows = computed(()=>{
  const arr = (props.rows || []).slice()
  arr.sort((a,b)=> {
    const va = Number(a.amount || 0)
    const vb = Number(b.amount || 0)
    return vb - va
  })
  return arr
})

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

function formatVolume(v){
  if (v === null || v === undefined) return ''
  const s = String(v)
  // remove any trailing parentheses with unit, e.g. "86 (10000 кв.м)" -> "86"
  return s.replace(/\s*\([^)]*\)\s*$/, '')
}

const displayDate = (()=>{
  try{
    if (!props.date) return props.date || ''
    const d = new Date(props.date)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }catch(e){ return props.date || '' }
})()
</script>
