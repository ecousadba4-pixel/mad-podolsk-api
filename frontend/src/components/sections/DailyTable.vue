<template>
  <section class="panel smeta-panel panel--full-bleed daily-table">
    <div class="panel-header row-between">
      <div class="panel-title-group">
        <h3 class="panel-title text-h3">Данные по выручке<span v-if="displayDate" class="panel-title-date"> — {{ displayDate }}</span></h3>
      </div>
    </div>

    <div class="panel-body">
      <div class="smeta-details-wrapper">
        <div class="smeta-breakdown-table smeta-breakdown-table--daily">
          <table aria-label="Данные по выручке">
            <colgroup>
              <col style="width:60%" />
              <col style="width:13%" />
              <col style="width:13%" />
              <col style="width:14%" />
            </colgroup>

            <thead>
              <tr>
                <th class="name"><div class="cell-inner cell-inner--name">Работы</div></th>
                <th class="numeric"><div class="cell-inner">Ед.</div></th>
                <th class="numeric"><div class="cell-inner">Объем</div></th>
                <th class="numeric"><div class="cell-inner">Сумма</div></th>
              </tr>
            </thead>

            <tbody>
              <template v-if="sortedRows && sortedRows.length">
                <tr v-for="(item, index) in sortedRows" :key="item.id || index">
                  <td class="name"><div class="cell-inner cell-inner--name">{{ item.name }}</div></td>
                  <td class="numeric"><div class="cell-inner">{{ item.unit }}</div></td>
                  <td class="numeric"><div class="cell-inner">{{ formatVolume(item.volume) }}</div></td>
                  <td class="numeric"><div class="cell-inner">{{ formatMoney(item.amount) }}</div></td>
                </tr>
              </template>
              <template v-else>
                <tr>
                  <td class="muted" colspan="4">Нет данных</td>
                </tr>
              </template>
            </tbody>

            <tfoot>
              <tr v-if="sortedRows && sortedRows.length" class="daily-total-row">
                <td colspan="3" class="smeta-breakdown-table__total-label">Итого</td>
                <td class="numeric smeta-breakdown-table__total-value"><div class="cell-inner">{{ formatMoney(total) }}</div></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: null },
  date: { type: [String, Date], default: '' }
})

const total = computed(() => {
  if (props.totalAmount !== null && props.totalAmount !== undefined) return Number(props.totalAmount) || 0
  return (props.rows || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0)
})

const sortedRows = computed(() => {
  const arr = (props.rows || []).slice()
  arr.sort((a, b) => {
    const va = Number(a?.amount || 0)
    const vb = Number(b?.amount || 0)
    if (vb !== va) return vb - va
    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
  return arr.map((item, idx) => {
    if (!item) return { id: `row-${idx}`, name: '-', unit: '', volume: '', amount: 0 }
    if (item.id === null || item.id === undefined || item.id === '') {
      return { ...item, id: `row-${idx}-${String(item.name || '').slice(0,20)}` }
    }
    return item
  })
})

function formatMoney(v) {
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

function formatVolume(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return s.replace(/\s*\([^)]*\)\s*$/, '')
}

const displayDate = computed(() => {
  if (!props.date) return ''
  try {
    const d = typeof props.date === 'string' ? new Date(props.date) : props.date
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return String(props.date)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch (e) {
    return String(props.date)
  }
})
</script>
