<template>
  <section class="panel smeta-panel smeta-details smeta-breakdown">
    <div class="panel-header">
      <div class="panel-title-group">
        <h2 class="panel-title">Расшифровка работ по смете — {{ smetaLabel }}</h2>
        <p class="panel-note">Детали по виду работы при нажатии</p>
        <div class="panel-title-mobile">
          <div class="panel-title-mobile-label">РАБОТЫ ПО СМЕТЕ</div>
          <div class="panel-title-mobile-value">{{ smetaLabel }}</div>
        </div>
        <p class="panel-subtitle">{{ selectedMonth }}</p>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="loading" class="skeleton">Загрузка...</div>

      <table v-else class="smeta-breakdown-table">
        <thead>
          <tr>
            <th>Работы</th>
            <th class="numeric">План</th>
            <th class="numeric">Факт</th>
            <th class="numeric">Отклонение</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.id" @click="openByDescription(row)">
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

