<template>
  <div>
    <div v-if="!items || items.length === 0" class="empty-state">Нет данных по смете</div>
    <!-- Desktop/table view -->
    <table v-if="!isMobile" class="smeta-breakdown-table">
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
                  class="smeta-title-text"
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
                  <span class="chev" :class="{ rotated: isExpanded(idFor(item, idx)) }">▾</span>
                </button>
              </div>
            </td>
            <td class="numeric">{{ formatMoney(item.plan) }}</td>
            <td class="numeric">{{ formatMoney(item.fact) }}</td>
            <td :class="{'negative': (Number(item.fact || 0) - Number(item.plan || 0)) < 0}" class="numeric">{{ formatMoney(Number(item.fact || 0) - Number(item.plan || 0)) }}</td>
          </tr>
        </tbody>
      </table>
    
    <!-- Mobile stacked view: three rows per item -->
    <div v-if="isMobile" class="smeta-details-mobile">
      <div v-for="(item, idx) in sortedItems" :key="item.title || item.description || item.work_name || idx" class="smeta-mobile-item" @click="$emit('select', item)">
        <div class="smeta-mobile-row smeta-mobile-row-title">
          <div class="smeta-title-wrapper" :data-id="idFor(item, idx)">
            <div
              :ref="el => registerTitleRef(el, idFor(item, idx))"
              class="smeta-title-text"
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
              <span class="chev" :class="{ rotated: isExpanded(idFor(item, idx)) }">▾</span>
            </button>
          </div>
        </div>
        <div class="smeta-mobile-row smeta-mobile-row-labels">
          <div class="lbl">План</div>
          <div class="lbl">Факт</div>
          <div class="lbl">Отклонение</div>
        </div>
        <div class="smeta-mobile-row smeta-mobile-row-values">
          <div class="val">{{ formatMoney(item.plan) }}</div>
          <div class="val">{{ formatMoney(item.fact) }}</div>
          <div class="val" :class="{'negative': (Number(item.fact || 0) - Number(item.plan || 0)) < 0}">{{ formatMoney(Number(item.fact || 0) - Number(item.plan || 0)) }}</div>
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
const emit = defineEmits(['select'])

import { computed, ref, watch } from 'vue'

// detect mobile via simple media query (reactive)
const isMobile = ref(false)
if (typeof window !== 'undefined'){
  const mq = window.matchMedia('(max-width: 640px)')
  isMobile.value = mq.matches
  mq.addEventListener && mq.addEventListener('change', e => { isMobile.value = e.matches })
}

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

// Sorting state: default by plan desc — can be overridden by parent via props
const sortKey = ref(props.sortKey || 'plan')
const sortDir = ref(typeof props.sortDir === 'number' ? props.sortDir : -1) // -1 desc, 1 asc

// sync props -> internal
watch(() => props.sortKey, (v) => { if (v) sortKey.value = v })
watch(() => props.sortDir, (v) => { if (typeof v === 'number') sortDir.value = v })

function toggleSort(key){
  if (sortKey.value === key){
    sortDir.value = -sortDir.value
  } else {
    sortKey.value = key
    // default direction: desc
    sortDir.value = -1
  }
  // notify parent about sort change
  emit('sort-changed', { key: sortKey.value, dir: sortDir.value })
}

const sortedItems = computed(() => {
  const arr = (props.items || []).slice()
  const k = sortKey.value
  const dir = sortDir.value
  arr.sort((a, b) => {
    const va = k === 'delta' ? (Number(a.fact || 0) - Number(a.plan || 0)) : Number(a[k] || 0)
    const vb = k === 'delta' ? (Number(b.fact || 0) - Number(b.plan || 0)) : Number(b[k] || 0)
    const diff = va - vb
    if (diff === 0) return 0
    return dir * Math.sign(diff)
  })
  return arr
})

// --- Expansion / clamp measurement logic ---
import { onMounted, onBeforeUnmount, nextTick } from 'vue'

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
        const style = window.getComputedStyle(el)
        // try to infer line-height; fallback to font-size * 1.2
        const lh = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2
        const maxH = lh * 2 + 1 // two lines + tolerance
        result[id] = el.scrollHeight > maxH
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
.sortable { cursor: pointer; user-select: none; }
.sort-indicator { margin-left: 8px; font-size: 0.9em; vertical-align: middle; }
.sort-indicator .inactive { color: #c0c0c0; }
.sort-indicator .active { color: #0b74de; font-weight: 700; }
th.sorted { background: rgba(11,116,222,0.06); }
.numeric { text-align: right; }
.smeta-breakdown-table th { padding: 8px 10px; }

/* Mobile styles: hide table and show stacked view */
@media (max-width: 640px) {
  .smeta-breakdown-table { display: none; }
  .smeta-details-mobile { display: block; }
  .smeta-mobile-item { padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
  .smeta-mobile-row { display: flex; gap: 8px; align-items: center; }
  .smeta-mobile-row-title { font-weight: 400; padding-bottom: 4px; font-size: var(--font-size-body-sm); line-height: 1.2 }
  .smeta-mobile-row-labels { font-size: 0.8em; color: var(--text-muted); justify-content: space-between }
  /* Align labels and values to the left and use a lighter font for better visual parity with desktop */
  .smeta-mobile-row-labels { font-size: 0.86em; color: var(--text-muted); justify-content: flex-start; gap: 8px }
  .smeta-mobile-row-values { font-weight: 500; justify-content: flex-start; gap: 8px }
  .smeta-mobile-row-labels .lbl, .smeta-mobile-row-values .val { flex: 1 1 33%; text-align: left; font-family: var(--font-sans); }
  .smeta-mobile-row-title { text-align: left }
  /* We'll enable the mobile block via inline reactive flag in template */
}

/* Light zebra striping to separate items on mobile for readability */
.smeta-details-mobile .smeta-mobile-item:nth-child(odd) { background: rgba(15,23,42,0.02); }
.smeta-details-mobile .smeta-mobile-item { padding: 12px 0; }
.smeta-details-mobile .smeta-mobile-item:hover { background: rgba(15,23,42,0.04); }

/* Ensure negative deltas use dashboard danger color on both desktop and mobile */
.negative { color: var(--danger); }


/* Title clamp / toggle styles */
.smeta-title-wrapper { display:flex; align-items:flex-start; gap:8px; position:relative }
.smeta-title-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
.smeta-title-text.is-expanded {
  -webkit-line-clamp: unset;
  display: block;
}
.smeta-title-toggle {
  background: transparent;
  border: none;
  color: #9aa0a6; /* light gray */
  padding: 4px;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 0 0 auto;
}
.smeta-title-toggle:focus { outline: 2px solid rgba(11,116,222,0.18); border-radius: 6px }
.smeta-title-toggle .chev { transition: transform .18s ease, color .12s ease; font-size: 14px }
.smeta-title-toggle .chev.rotated { transform: rotate(180deg); color: #6b7280 }

/* ensure chevron sits to the right in table cell and doesn't push layout */
td .smeta-title-wrapper { align-items: center }

</style>
 
