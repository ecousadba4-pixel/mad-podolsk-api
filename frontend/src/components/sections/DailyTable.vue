<template>
  <section class="panel smeta-panel panel--full-bleed">
      <div class="panel-header row-between">
      <div class="panel-title-group">
        <h3 class="panel-title text-h3">Данные по выручке за {{ displayDate }}</h3>
      </div>
    </div>
    <div class="panel-body">
      <div class="smeta-details-wrapper">
        <table class="smeta-breakdown-table smeta-breakdown-table--daily">
          <colgroup>
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Работы</th>
              <th class="numeric">Ед.</th>
              <th class="numeric">Объем</th>
              <th class="numeric">Сумма</th>
            </tr>
          </thead>
          <RecycleScroller
            :items="sortedRows"
            item-tag="tr"
            wrapper-tag="tbody"
            :item-size="48"
            key-field="id"
            class="virtual-scroller"
          >
            <template #default="{ item, index }">
              <tr :key="item.id || index">
                <td>{{ item.name }}</td>
                <td class="numeric">{{ item.unit }}</td>
                <td class="numeric">{{ formatVolume(item.volume) }}</td>
                <td class="numeric">{{ formatMoney(item.amount) }}</td>
              </tr>
            </template>
            <template #empty>
              <tr>
                <td colspan="4" class="muted">Нет данных</td>
              </tr>
            </template>

            <template #footer>
              <tr v-if="sortedRows && sortedRows.length" class="daily-total-row">
                <td colspan="3" class="smeta-breakdown-table__total-label">Итого</td>
                <td class="numeric smeta-breakdown-table__total-value">{{ formatMoney(total) }}</td>
              </tr>
            </template>
          </RecycleScroller>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: null },
  date: { type: String, default: '' }
})

const total = computed(() => {
  if (props.totalAmount !== null && props.totalAmount !== undefined) return Number(props.totalAmount) || 0
  return (props.rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0)
})

const sortedRows = computed(() => {
  const arr = (props.rows || []).slice()
  arr.sort((a, b) => {
    const va = Number(a.amount || 0)
    const vb = Number(b.amount || 0)
    return vb - va
  })
  // Ensure every item has a stable `id` field because
  // `RecycleScroller` relies on `key-field="id"` and will
  // throw if the key is missing. If original item has no id,
  // generate a deterministic fallback based on index and name.
  return arr.map((item, idx) => {
    if (item == null) return { id: `row-${idx}` }
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
  try {
    if (!props.date) return props.date || ''
    const d = new Date(props.date)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch (e) {
    return props.date || ''
  }
})
</script>
