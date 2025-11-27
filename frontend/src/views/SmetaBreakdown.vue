<template>
  <section class="panel smeta-panel smeta-details smeta-breakdown">
    <div class="panel-header row-between">
      <div class="panel-title-group">
        <SmetaPanelNote :label="smetaLabel" />
        <h3 class="panel-title text-h3">{{ smetaLabel }}</h3>
      </div>
    </div>

      <div class="panel-body">
      <div v-if="loading" class="skeleton">Загрузка...</div>

      <div v-if="!loading" class="smeta-breakdown-scroll" :class="{ 'is-mobile': isMobile }">
        <table class="smeta-breakdown-table">
        <thead>
          <tr>
            <th>Работы</th>
            <th class="numeric">План</th>
            <th class="numeric">Факт</th>
            <th class="numeric">Отклонение</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sortedRows" :key="row.id" @click="openByDescription(row)">
            <td>{{ row.title || row.description }}</td>
            <td class="numeric">{{ formatMoney(row.plan) }}</td>
            <td class="numeric">{{ formatMoney(row.fact) }}</td>
            <td :class="{'negative': (row.fact - row.plan) < 0}" class="numeric">{{ formatMoney((row.fact || 0) - (row.plan || 0)) }}</td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="4" class="muted">Нет данных для выбранной сметы</td>
          </tr>
        </tbody>
        <tfoot v-if="filteredRows.length > 0">
          <tr class="smeta-breakdown-table__totals">
            <td>Итого</td>
            <td class="numeric">{{ formatMoney(totals.plan) }}</td>
            <td class="numeric">{{ formatMoney(totals.fact) }}</td>
            <td :class="{'negative': totals.delta < 0}" class="numeric">{{ formatMoney(totals.delta) }}</td>
          </tr>
        </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const store = useDashboardStore()
const { smetaDetailsLoading, smetaDetails, selectedMonth: selectedMonthRef, smetaCards, selectedSmeta } = storeToRefs(store)

const smetaKey = computed(() => route.params.smetaKey || selectedSmeta.value || 'leto')

onMounted(async () => {
  // set selected smeta in store for other components and fetch details
  store.setSelectedSmeta(smetaKey.value)
  await store.fetchSmetaDetails(smetaKey.value)
  console.log('[SmetaBreakdown] mounted, smetaKey=', smetaKey.value)
})

const loading = computed(() => smetaDetailsLoading.value)
const rows = computed(() => smetaDetails.value)
const selectedMonth = computed(() => selectedMonthRef.value)

// show only rows where plan>1 or fact>1
// Special rule: if selected smeta is vnerereg (внерегламент) then Plan should be shown as 0
const filteredRows = computed(() => {
  const key = smetaKey.value
  const isVnereg = key && (key.toLowerCase().includes('vne') || key === 'vnereg' || key === 'vner1' || key === 'vner2')
  const src = (rows.value || [])
  // map rows to adjusted rows (apply Plan=0 for vnerereg) then filter
  return src
    .map(r => {
      const plan = Number(r.plan || 0)
      const fact = Number(r.fact || r.fact_amount_done || 0)
      return {
        ...r,
        plan: isVnereg ? 0 : plan,
        fact: fact
      }
    })
    .filter(r => (Number(r.plan || 0) > 1) || (Number(r.fact || 0) > 1))
})

// totals for Plan / Fact / Delta
const totals = computed(() => {
  const arr = filteredRows.value || []
  const plan = arr.reduce((s, r) => s + (Number(r.plan) || 0), 0)
  const fact = arr.reduce((s, r) => s + (Number(r.fact) || 0), 0)
  const delta = fact - plan
  return { plan, fact, delta }
})

const smetaLabel = computed(() => {
  // derive a human-friendly label from smetaKey or fall back
  const key = smetaKey.value
  const map = { leto: 'Лето', zima: 'Зима', vnereg: 'Внерегламент', vner1: 'Внерегламент' }
  return map[key] || (smetaCards.value.find(c => c.smeta_key === key)?.label) || key
})

import { ref } from 'vue'
import { useIsMobile } from '../composables/useIsMobile.js'
import SmetaPanelNote from '../components/ui/SmetaPanelNote.vue'

// Sorting state for the table — used by mobile sort control and desktop headers if needed
const sortKeyRef = ref('plan')
const sortDirRef = ref(-1)

function valueForRow(r, key){
  if (key === 'delta') return (Number(r.fact || 0) - Number(r.plan || 0))
  return Number(r[key] || 0)
}

function onSortChange(e){
  // keep only metric name in control; default to descending
  sortDirRef.value = -1
}

const sortKey = sortKeyRef
const sortDir = sortDirRef

// sorted rows used in table
const sortedRows = computed(() => {
  const arr = (filteredRows.value || []).slice()
  arr.sort((a,b)=>{
    const va = valueForRow(a, sortKey.value)
    const vb = valueForRow(b, sortKey.value)
    const diff = va - vb
    if (diff === 0) return 0
    return sortDir.value * Math.sign(diff)
  })
  return arr
})

const { isMobile } = useIsMobile()

// header uses simple panel-title markup; no local component registration required

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

function openByDescription(row){
  // set selected description and navigate to modal/view for daily breakdown
  store.setSelectedDescription(row.title || row.description)
  // we can navigate to a daily-details route in future; for now open /daily and keep selection
  router.push({ path: '/daily' })
}
</script>

<style scoped>
/* Header layout (applies for compact and mobile views) --------------------------------- */
/* Show the two-line mobile title block and hide the long H2 title to enforce consistent layout */
.panel-title-mobile,
.panel-header-controls {
  font-family: var(--font-sans);
}

.panel-title-mobile { display: block; }
.panel-title { display: none; }

.panel-title-mobile-left { display:flex; flex-direction:column; gap:4px; }
.panel-title-mobile-label { font-size: var(--font-size-label); text-transform:uppercase; color:var(--text-muted); }
.panel-title-mobile-value { font-size: clamp(1rem, 4vw, 1.2rem); line-height:1.2; font-weight:600; color:var(--text-primary); }

/* Ensure mobile sort control uses DayPicker-style spacing */
.panel-header-controls .month-select { display:flex; flex-direction:column; gap:4px; }
.panel-header-controls .work-mobile-sort-control select { font-family: var(--font-sans); }

/* Force header grid for smeta details so changes are visible at all widths */
.work-panel-header {
  display: grid;
  grid-template-columns: 1fr minmax(140px, 36%);
  gap: 12px 18px;
  align-items: center;
  padding: 8px 12px;
}

/* Small screens: stack if needed */
@media (max-width: 520px) {
  .work-panel-header { grid-template-columns: 1fr; }
  .panel-header-controls { justify-self: start; }
}

/* Make the smeta breakdown table scroll and fit inside mobile modal/viewports */
.smeta-breakdown-scroll { width: 100%; }

@media (max-width: 640px) {
  .smeta-breakdown-scroll.is-mobile {
    max-height: calc(100vh - 140px); /* reserve space for header/modal chrome */
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    padding-right: 6px; /* give slight room for scrollbar */
  }

  .smeta-breakdown-table { width: 100%; table-layout: auto; }
  .smeta-breakdown-table td, .smeta-breakdown-table th { word-break: break-word; }
}
</style>

