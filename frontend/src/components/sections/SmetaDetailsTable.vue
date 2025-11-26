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
              <span class="chev" :class="{ rotated: isExpanded(idFor(item, idx)) }">▾</span>
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
 
 
