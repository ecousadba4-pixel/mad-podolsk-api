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
            <th :class="['numeric','sortable', { sorted: sortKey === 'plan' }]" @click="toggleSort('plan')">
              План
              <span class="sort-indicator">
                <span v-if="sortKey === 'plan'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
                <span v-else class="inactive">▲▼</span>
              </span>
            </th>
            <th :class="['numeric','sortable', { sorted: sortKey === 'fact' }]" @click="toggleSort('fact')">
              Факт
              <span class="sort-indicator">
                <span v-if="sortKey === 'fact'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
                <span v-else class="inactive">▲▼</span>
              </span>
            </th>
            <th :class="['numeric','sortable', { sorted: sortKey === 'delta' }]" @click="toggleSort('delta')">
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
    
    <!-- Mobile stacked view: three rows per item -->
    <div v-if="isMobile" class="smeta-details-mobile">
      <div v-for="(item, idx) in sortedItems" :key="item.title || item.description || item.work_name || idx" class="smeta-mobile-item p-sm" @click="$emit('select', item)">
        <div class="smeta-mobile-row smeta-mobile-row-title">
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
        </div>
        <div class="smeta-mobile-row smeta-mobile-row-labels text-label">
          <div class="lbl">План</div>
          <div class="lbl">Факт</div>
          <div class="lbl">Отклонение</div>
        </div>
        <div class="smeta-mobile-row smeta-mobile-row-values">
          <div class="val text-body">{{ formatMoney(item.plan) }}</div>
          <div class="val text-body">{{ formatMoney(item.fact) }}</div>
          <div class="val text-body" :class="{'negative': (Number(item.fact || 0) - Number(item.plan || 0)) < 0}">{{ formatMoney(Number(item.fact || 0) - Number(item.plan || 0)) }}</div>
        </div>
      </div>

      <!-- Mobile totals (single block after list) -->
      <div class="smeta-mobile-totals p-sm">
        <div class="smeta-mobile-row smeta-mobile-row-labels text-label">
          <div class="lbl">Итого</div>
        </div>
        <div class="smeta-mobile-row smeta-mobile-row-labels text-label">
          <div class="lbl">План</div>
          <div class="lbl">Факт</div>
          <div class="lbl">Отклонение</div>
        </div>
        <div class="smeta-mobile-row smeta-mobile-row-values">
          <div class="val text-body">{{ formatMoney(totalsPlan) }}</div>
          <div class="val text-body">{{ formatMoney(totalsFact) }}</div>
          <div class="val text-body" :class="{'negative': totalsDelta < 0}">{{ formatMoney(totalsDelta) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  sortKey: { type: String, default: 'plan' },
  sortDir: { type: Number, default: -1 }
})
const emit = defineEmits(['select', 'sort-changed'])

import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useIsMobile } from '../../composables/useIsMobile.js'
import { useSort } from '../../composables/useSort.js'

const { isMobile } = useIsMobile()

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
    initialKey: props.sortKey || 'plan',
    initialDir: typeof props.sortDir === 'number' ? props.sortDir : -1,
    compare: compareRows
  }
)

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
  // include index to guarantee uniqueness even when titles repeat
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
        // Prefer a robust overflow test: compare full scrollHeight with visible clientHeight.
        // When -webkit-line-clamp is active, clientHeight equals the clamped (visible) height,
        // while scrollHeight equals the full content height. Use a small tolerance to avoid
        // false positives from fractional pixels.
        const tolerance = 2 // pixels
        const fullH = el.scrollHeight || el.offsetHeight || 0
        const visibleH = el.clientHeight || el.offsetHeight || 0
        result[id] = fullH > (visibleH + tolerance)
      }
    } catch (e) {
      // silently ignore measurement errors
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

// Re-check clamped state when items change (e.g. new data arrives)
watch(sortedItems, () => { checkClamped() })


</script>
 
 

<style scoped>
/* Mobile: labels and values aligned in 3 equal columns and centered */
.smeta-mobile-row-labels,
.smeta-mobile-row-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-items: center;
}

.smeta-mobile-row-labels .lbl {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-muted, #6b6b6b);
}

.smeta-mobile-row-values .val {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Zebra only for the work-name cell (desktop) */
.smeta-breakdown-table tbody tr:nth-child(odd) {
  background-color: rgba(0,0,0,0.03);
}

/* Ensure numeric cells keep their white background for better readability (override) */
.smeta-breakdown-table tbody tr td.numeric {
  background: transparent;
}

/* Zebra only for the title block inside mobile item */
.smeta-details-mobile .smeta-mobile-row-title {
  background-color: rgba(0,0,0,0.05);
  padding: 8px 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

/* Keep numeric cells visually centered in desktop where appropriate */
.smeta-breakdown-table td.numeric,
.smeta-breakdown-table th.numeric {
  text-align: right;
  padding-right: 12px;
}

.smeta-mobile-item {
  border-radius: 8px;
}

/* Chevron styles: match DayPicker look & behavior (size, color, hover/focus, rotation) */
.smeta-title-toggle {
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
}

.smeta-title-toggle .chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--chevron-color, rgb(94 100 115 / 50%));
  transition: background-color .12s ease, transform .12s ease, color .12s ease;
  border-radius: 10px;
}

.smeta-title-toggle .chev svg { width: 18px; height: 18px; }

.smeta-title-toggle:hover .chev { background: var(--surface-highlight, rgba(0,0,0,0.04)); }
.smeta-title-toggle:active .chev { transform: scale(.98); }
.smeta-title-toggle:focus-visible { outline: 2px solid color-mix(in srgb, var(--accent, #6b77f4) 20%, transparent); outline-offset: 2px; }

.smeta-title-toggle .chev.rotated { transform: rotate(180deg); color: #6b7280; }

</style>



