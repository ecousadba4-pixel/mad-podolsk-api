<template>
  <section class="mobile-daily">
    <div class="mobile-daily__spacer" ref="spacerRef" aria-hidden="true"></div>
    <div class="mobile-daily__constrain" ref="constrainRef">
      <div class="mobile-daily__card">
        <header class="mobile-daily__header">
          <h3 class="panel-title text-h3">Выручка<span v-if="displayDateShort"> — {{ displayDateShort }}</span></h3>
        </header>
        <!-- Mobile table content rendered here -->
        <div class="smeta-details-mobile">
          <div v-if="!sortedRows || sortedRows.length === 0" class="empty-state">Нет данных</div>
          <div v-for="(item, idx) in sortedRows" :key="item.id || idx" class="smeta-mobile-item p-sm">
            <div class="smeta-mobile-row smeta-mobile-row-title">
              <div class="smeta-title-wrapper" :data-id="idFor(item, idx)">
                <div
                  :ref="el => registerTitleRef(el, idFor(item, idx))"
                  class="truncate-2"
                  :class="{ 'is-expanded': isExpanded(idFor(item, idx)) }"
                >
                  {{ item.name }}
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
              <div class="lbl">Ед.</div>
              <div class="lbl">Объем</div>
              <div class="lbl">Сумма</div>
            </div>
            <div class="smeta-mobile-row smeta-mobile-row-values">
              <div class="val text-body">{{ item.unit }}</div>
              <div class="val text-body">{{ formatVolume(item.volume) }}</div>
              <div class="val text-body">{{ formatMoney(item.amount) }}</div>
            </div>
          </div>

          <div v-if="sortedRows && sortedRows.length" class="smeta-mobile-totals p-sm">
            <div class="smeta-mobile-row-values totals-grid">
              <div class="totals-label">ИТОГО</div>
              <div class="val text-body totals-value"><strong>{{ formatMoney(total) }}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: null },
  date: { type: [String, Date], default: '' }
})

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

// Short date for mobile single-line header: DD.MM.YYYY
const displayDateShort = computed(() => {
  if (!props.date) return ''
  try {
    const d = typeof props.date === 'string' ? new Date(props.date) : props.date
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return String(props.date)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  } catch (e) {
    return String(props.date)
  }
})

const constrainRef = ref(null)
const spacerRef = ref(null)

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

const total = computed(() => {
  if (props.totalAmount !== null && props.totalAmount !== undefined) return Number(props.totalAmount) || 0
  return (props.rows || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0)
})

// --- collapse / expand title logic (copied/adapted from SmetaDetailsTable.vue) ---
const expanded = ref(new Set())
const clamped = ref({})
const titleEls = new Map()

function idFor(item, idx){
  return `${idx}-${String(item?.name || '')}`
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


function applyHeaderRect() {
  const el = constrainRef.value
  const spacer = spacerRef.value
  if (!el) return
  const header = document.querySelector('.app-header__inner')
  if (!header) return
  const r = header.getBoundingClientRect()
  const ownRect = el.getBoundingClientRect()
  // switch to fixed positioning so the element can align exactly with header
  // and preserve its place in the document using the spacer
  el.style.position = 'fixed'
  el.style.left = `${Math.round(r.left)}px`
  el.style.top = `${Math.round(ownRect.top)}px`
  el.style.width = `${Math.round(r.width)}px`
  el.style.zIndex = '100'
  el.style.paddingLeft = '0px'
  el.style.paddingRight = '0px'
  // keep a spacer in flow so layout doesn't collapse
  if (spacer) spacer.style.height = `${Math.round(ownRect.height)}px`
}

let handler = null
onMounted(async () => {
  await nextTick()
  // check clamped titles and align with header on mount
  checkClamped()
  applyHeaderRect()
  handler = () => {
    applyHeaderRect()
    checkClamped()
  }
  window.addEventListener('resize', handler)
  window.addEventListener('scroll', handler, { passive: true })
})

// Re-check clamped state when rows change
watch(sortedRows, () => { checkClamped() })

onBeforeUnmount(() => {
  if (handler) {
    window.removeEventListener('resize', handler)
    window.removeEventListener('scroll', handler)
  }
})
</script>

<style scoped>
.mobile-daily { width: 100%; box-sizing: border-box; }

/* Constrain mirrors header inner padding so left/right edges align */
.mobile-daily__constrain {
  max-width: min(var(--page-max-width), 100%);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--page-hpad);
  padding-right: var(--page-hpad);
  box-sizing: border-box;
}

.mobile-daily__card {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  box-sizing: border-box;
}
.mobile-daily__header { margin-bottom: calc(var(--gap-sm)); }
.mobile-daily__date { margin-top: 2px; color: inherit; font-size: inherit; line-height: 1.05; }
.mobile-daily__spacer { width: 100%; height: 0px; }

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
.smeta-details-mobile .smeta-mobile-row-title {
  background-color: rgba(0,0,0,0.05);
  padding: 8px 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.smeta-mobile-item { border-radius: 8px; }
.smeta-mobile-totals .totals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: transparent;
}
.smeta-mobile-totals .totals-label {
  grid-column: 1 / span 2;
  color: var(--color-text-muted, #6b6b6b);
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
}
.smeta-mobile-totals .totals-value {
  text-align: center;
  grid-column: 3 / 4;
  font-variant-numeric: tabular-nums;
}

/* Truncate to 2 lines and expanded state */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.truncate-2.is-expanded {
  -webkit-line-clamp: unset;
  display: block;
}

/* Chevron / toggle styles (same look as other tables) */
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
