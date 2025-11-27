<template>
  <div>
    <div v-if="!items || items.length === 0" class="empty-state">Нет данных по смете</div>

    <!-- Desktop/table view -->
    <table v-if="!isMobile" :class="['smeta-breakdown-table', `sorted-by-${sortKey}`]">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Работы</th>
            <th :class="['numeric','sortable', { sorted: sortKey === 'plan' } ]" @click="toggleSort('plan')">
              План
              <span class="sort-indicator">
                <span v-if="sortKey === 'plan'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
                <span v-else class="inactive">▲▼</span>
              </span>
            </th>
            <th :class="['numeric','sortable', { sorted: sortKey === 'fact' } ]" @click="toggleSort('fact')">
              Факт
              <span class="sort-indicator">
                <span v-if="sortKey === 'fact'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
                <span v-else class="inactive">▲▼</span>
              </span>
            </th>
            <th :class="['numeric','sortable', { sorted: sortKey === 'delta' } ]" @click="toggleSort('delta')">
              Отклонение
              <span class="sort-indicator">
                <span v-if="sortKey === 'delta'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
                <span v-else class="inactive">▲▼</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, idx) in sortedItems"
            :key="item.title || item.description || item.work_name || idx"
            class="smeta-breakdown-table__row smeta-breakdown-table__row--interactive"
            @click="$emit('select', item)"
          >
            <td>
              <div class="smeta-title-wrapper" :data-id="idFor(item, idx)">
                <div
                  :ref="el => registerTitleRef(el, idFor(item, idx))"
                  class="truncate-2"
                  :class="{ 'is-expanded': isExpanded(idFor(item, idx)) }"
                >
                  {{ item.title || item.description || item.work_name }}
                </div>
                <button
                  v-if="isClamped(idFor(item, idx))"
                  class="smeta-title-toggle"
                  @click.stop="toggleExpand(idFor(item, idx))"
                  :aria-expanded="isExpanded(idFor(item, idx))"
                  :aria-label="isExpanded(idFor(item, idx)) ? 'Свернуть' : 'Развернуть'"
                >
                  <span class="chev" :class="{ rotated: isExpanded(idFor(item, idx)) }" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                      <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
            </td>
            <td class="numeric">{{ formatMoney(item.plan) }}</td>
            <td class="numeric">{{ formatMoney(item.fact) }}</td>
            <td :class="{'negative': (Number(item.fact || 0) - Number(item.plan || 0)) < 0}" class="numeric">{{ formatMoney(Number(item.fact || 0) - Number(item.plan || 0)) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="smeta-breakdown-table__totals">
            <td><strong>Итого</strong></td>
            <td class="numeric"><strong>{{ formatMoney(totalsPlan) }}</strong></td>
            <td class="numeric"><strong>{{ formatMoney(totalsFact) }}</strong></td>
            <td :class="{'negative': totalsDelta < 0}" class="numeric"><strong>{{ formatMoney(totalsDelta) }}</strong></td>
          </tr>
        </tfoot>
      </table>

    <!-- Mobile stacked view delegated to separate component -->
    <SmetaDetailsMobile
      v-if="isMobile"
      :sorted-items="sortedItems"
      :totals-plan="totalsPlan"
      :totals-fact="totalsFact"
      :totals-delta="totalsDelta"
      :register-title-ref="registerTitleRef"
      :is-clamped="isClamped"
      :is-expanded="isExpanded"
      :toggle-expand="toggleExpand"
      :id-for="idFor"
      :format-money="formatMoney"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  sortKey: { type: String, default: 'plan' },
  sortDir: { type: Number, default: -1 }
})
const emit = defineEmits(['select','sort-changed'])

import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useIsMobile } from '../../composables/useIsMobile.js'
import { useSort } from '../../composables/useSort.js'
import { useDashboardUiStore } from '../../store/dashboardUiStore.js'
import { storeToRefs } from 'pinia'
import SmetaDetailsMobile from './SmetaDetailsMobile.vue'

const { isMobile } = useIsMobile()

// detect selected smeta from global store so we can apply smeta-specific defaults
const store = useDashboardUiStore()
const { selectedSmeta } = storeToRefs(store)

function isVneregKey(key) {
  if (!key) return false
  const k = String(key).toLowerCase()
  return k.includes('vne') || k === 'vnereg' || k === 'vner1' || k === 'vner2' || k === 'vnereglement' || k === 'vnereglement'
}

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

// Sorting state: default by plan desc — can be overridden by parent via props
const compareRows = (a, b, key, dir) => {
  const value = (item) => key === 'delta'
    ? (Number(item.fact || 0) - Number(item.plan || 0))
    : Number(item[key] || 0)
  const diff = value(a) - value(b)
  if (diff === 0) return 0
  return dir * Math.sign(diff)
}

const { sortKey, sortDir, sortedItems, setSort, toggleSort: toggleSortKey } = useSort(
  () => props.items,
  {
    initialKey: props.sortKey || (isVneregKey(selectedSmeta.value) ? 'fact' : 'plan'),
    initialDir: typeof props.sortDir === 'number' ? props.sortDir : -1,
    compare: compareRows
  }
)

// If selected smeta changes to a vnereg-like key, default-sort by `fact` (unless already set)
watch(selectedSmeta, (newKey) => {
  if (isVneregKey(newKey) && sortKey.value !== 'fact') {
    // set default descending by fact
    setSort('fact', -1)
    // notify parent about sort change
    try { emit('sort-changed', { key: 'fact', dir: -1 }) } catch (e) { /* ignore */ }
  }
})

// sync props -> internal
watch(() => props.sortKey, (v) => { if (v) setSort(v) })
watch(() => props.sortDir, (v) => { if (typeof v === 'number') setSort(sortKey.value, v) })

function toggleSort(key){
  const next = toggleSortKey(key)
  emit('sort-changed', next)
}

// Totals for Plan / Fact / Delta
const totalsPlan = computed(() => {
  return (props.items || []).reduce((s, it) => s + Number(it.plan || 0), 0)
})
const totalsFact = computed(() => {
  return (props.items || []).reduce((s, it) => s + Number(it.fact || 0), 0)
})
const totalsDelta = computed(() => {
  return totalsFact.value - totalsPlan.value
})

const expanded = ref(new Set())
const clamped = ref({})
const titleEls = new Map()

function idFor(item, idx){
  return `${idx}-${String(item.title || item.description || item.work_name || '')}`
}

function registerTitleRef(el, id){
  if (el) titleEls.set(id, el)
  else titleEls.delete(id)
}

function isExpanded(id){ return expanded.value.has(id) }
function isClamped(id){ return !!(clamped.value && clamped.value[id]) }

function toggleExpand(id){
  const s = new Set(expanded.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expanded.value = s
}

function checkClamped(){
  nextTick(() => {
    const result = {}
    try {
      for (const [id, el] of titleEls.entries()){
        if (!el) continue
        const tolerance = 2
        const fullH = el.scrollHeight || el.offsetHeight || 0
        const visibleH = el.clientHeight || el.offsetHeight || 0
        result[id] = fullH > (visibleH + tolerance)
      }
    } catch (e) {
      // ignore
    }
    clamped.value = result
  })
}

onMounted(() => {
  checkClamped()
  window.addEventListener('resize', checkClamped)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkClamped)
})

watch(sortedItems, () => { checkClamped() })
</script>

<style scoped>
/* keep the most relevant styles local; other shared styles remain in project globals */
.smeta-mobile-row-labels,
.smeta-mobile-row-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-items: center;
}
.smeta-mobile-row-labels .lbl { text-align: center; font-weight: 600; color: var(--color-text-muted, #6b6b6b); }
.smeta-mobile-row-values .val { text-align: center; font-variant-numeric: tabular-nums; }
.smeta-breakdown-table tbody tr:nth-child(odd) { background-color: rgba(0,0,0,0.03); }
.smeta-breakdown-table td.numeric, .smeta-breakdown-table th.numeric { text-align: right; padding-right: 12px; }
.smeta-title-toggle { background: transparent; border: none; padding: 0; margin-left: 6px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 10px; }
.smeta-title-toggle .chev { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; color: var(--chevron-color, rgb(94 100 115 / 50%)); transition: background-color .12s ease, transform .12s ease, color .12s ease; border-radius: 10px; }
.smeta-title-toggle .chev svg { width: 18px; height: 18px; }
.smeta-title-toggle .chev.rotated { transform: rotate(180deg); color: #6b7280; }

/* Responsive rules from original file kept */
@media (max-width: 767px) {
  .smeta-breakdown-table { width: 100% !important; max-width: 100% !important; table-layout: fixed; box-sizing: border-box; border-collapse: collapse; }
  .smeta-breakdown-table col:nth-child(1) { width: 58%; min-width: 0; }
  .smeta-breakdown-table col:nth-child(2), .smeta-breakdown-table col:nth-child(3), .smeta-breakdown-table col:nth-child(4) { width: 14%; min-width: 0; }
  .smeta-breakdown-table th, .smeta-breakdown-table td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box; }
  .smeta-breakdown-table td.numeric, .smeta-breakdown-table th.numeric { padding-right: 8px; }
  .smeta-breakdown-table td:first-child .truncate-2 { display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
  .smeta-breakdown-table, .smeta-breakdown-table * { min-width: 0; box-sizing: border-box; }
}

@media (max-width: 420px) {
  .smeta-breakdown-table td.numeric, .smeta-breakdown-table th.numeric { font-size: 13px; line-height: 1.1; padding-right: 6px; white-space: nowrap; overflow: hidden; text-overflow: clip; font-variant-numeric: tabular-nums; }
  @media (max-width: 360px) { .smeta-breakdown-table td.numeric, .smeta-breakdown-table th.numeric { font-size: 12px; } }
}
</style>
