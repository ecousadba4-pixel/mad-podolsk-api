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
        <SmetaDetails :items="filteredRows" :sort-key="sortKey" :sort-dir="sortDir" @select="openByDescription" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardUiStore } from '../store/dashboardUiStore.js'
import { useSmetaSelection } from '../composables/useSmetaSelection.js'
import { useSmetaSorting } from '../composables/useSmetaSorting.js'
import { useDescriptionsModal } from '../composables/useDescriptionsModal.js'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const uiStore = useDashboardUiStore()
const { smetaDetails, smetaDetailsLoading, selectedSmetaLabel, selectSmeta, ensureDetailsLoaded } = useSmetaSelection()
const { selectedMonth } = storeToRefs(uiStore)
const { open: openDescriptionModal } = useDescriptionsModal()
const smetaKey = computed(() => route.params.smetaKey || uiStore.selectedSmeta.value)

watch(smetaKey, (key) => {
  selectSmeta(key)
  ensureDetailsLoaded(key)
}, { immediate: true })

const loading = computed(() => smetaDetailsLoading.value)
const rows = computed(() => smetaDetails.value)

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

const smetaLabel = computed(() => selectedSmetaLabel.value || smetaKey.value)

import { ref } from 'vue'
import { useIsMobile } from '../composables/useIsMobile.js'
import SmetaPanelNote from '../components/ui/SmetaPanelNote.vue'
import SmetaDetails from '../components/sections/SmetaDetails.vue'

// Sorting state for the table — used by mobile sort control and desktop headers if needed
const { sortKey: sortKeyRef, sortDir: sortDirRef } = useSmetaSorting('plan', -1)

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
  openDescriptionModal(row.title || row.description)
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

  .smeta-breakdown-scroll.is-mobile { overflow-x: auto; }

  .smeta-breakdown-table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed; /* make columns respect available width */
    border-collapse: collapse;
    box-sizing: border-box;
  }

  .smeta-breakdown-table th,
  .smeta-breakdown-table td {
    min-width: 0; /* allow cells to shrink below content width */
    white-space: normal; /* allow wrapping */
    word-break: break-word;
    box-sizing: border-box;
    padding: 10px 8px;
  }

  /* Keep numeric columns compact and right-aligned, but allow wrapping if necessary */
  .smeta-breakdown-table th.numeric,
  .smeta-breakdown-table td.numeric {
    width: 22%;
    text-align: right;
    white-space: nowrap;
  }
}
</style>

