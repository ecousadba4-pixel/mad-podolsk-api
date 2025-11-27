<template>
  <div class="month-picker" ref="root">
    <button
      type="button"
      class="month-picker__toggle control picker-toggle"
      @click="toggle()"
      @keydown.prevent.stop="onToggleKeydown"
      :aria-expanded="String(open)"
      aria-haspopup="listbox"
      :aria-controls="panelId"
      :aria-label="`Выбор месяца, текущий: ${currentLabel}`"
      ref="toggleBtn"
    >
      <div class="month-picker__info">
        <span class="month-picker__current">{{ currentLabel }}</span>
      </div>
      <span class="month-picker__arrow" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <div v-if="open" :id="panelId" class="month-picker__panel" role="listbox" :aria-activedescendant="activeId" tabindex="-1" @keydown="onListKeydown">
      <div v-if="loading" class="month-picker__empty">Загрузка...</div>
      <div v-else-if="!months || months.length === 0" class="month-picker__empty">Нет доступных месяцев</div>
      <ul v-else class="month-picker__list">
        <li v-for="(m, idx) in months" :key="m.value" class="month-picker__item" role="presentation">
          <button
            type="button"
            role="option"
            :id="itemId(idx)"
            :aria-selected="m.value === modelValue ? 'true' : 'false'"
            @click="select(m.value)"
            @keydown.prevent.stop="onItemKeydown($event, idx)"
            :class="{ 'is-active': m.value === modelValue, 'is-focused': idx === activeIndex }" class="text-body">
            {{ m.label }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const store = useDashboardStore()
const { availableMonths, selectedMonth } = storeToRefs(store)
const open = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
const toggleBtn = ref(null)
const root = ref(null)

const months = computed(() => {
  // map store.availableMonths (array of YYYY-MM) to {value,label}
  const arr = (availableMonths.value || []).map(v => {
    const d = new Date(v + '-01')
    // produce "ноябрь 2025" (remove trailing " г.")
    const label = d.toLocaleString('ru-RU', { year: 'numeric', month: 'long' }).replace(/\s+г\.?$/i, '')
    return { value: v, label }
  })
  return arr
})

const panelId = `month-picker-panel-${Math.random().toString(36).slice(2,8)}`

function itemId(i){ return `month-picker-item-${i}-${panelId}` }
const activeId = computed(()=> activeIndex.value >=0 ? itemId(activeIndex.value) : null)

function setActiveByValue(val){
  const idx = (months.value || []).findIndex(m => m.value === val)
  activeIndex.value = idx >= 0 ? idx : 0
}

function openPanel(){
  open.value = true
  // set active index to current selection
  setActiveByValue(props.modelValue || selectedMonth.value)
  nextTick(()=>{
    // focus active item if exists
    const btns = root.value?.querySelectorAll('.month-picker__item button') || []
    const idx = activeIndex.value >=0 ? activeIndex.value : 0
    if (btns[idx]) btns[idx].focus()
  })
}

function closePanel({ restoreFocus = true } = {}){
  // Close only if the panel is actually open to avoid stealing focus on every page click.
  if (!open.value) return
  open.value = false
  activeIndex.value = -1
  if (restoreFocus) {
    nextTick(()=>{
      try {
        toggleBtn.value?.focus({ preventScroll: true })
      } catch (e) {
        try { toggleBtn.value?.focus() } catch (_) { /* ignore */ }
      }
    })
  }
}

function toggle(){
  if (open.value) closePanel(); else openPanel()
}

function select(value){
  // Emit selection; parent (header/view) should handle store updates
  emit('update:modelValue', value)
  closePanel()
}

function onClickOutside(e){
  if (!root.value || !open.value) return
  if (!root.value.contains(e.target)) closePanel()
}

function onToggleKeydown(e){
  // Open on ArrowDown/ArrowUp
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    openPanel()
    e.preventDefault()
    return
  }
}

function onListKeydown(e){
  const len = (months.value || []).length
  if (!len) return
  if (e.key === 'ArrowDown'){
    activeIndex.value = (activeIndex.value + 1) % len
    focusActive()
    e.preventDefault()
  } else if (e.key === 'ArrowUp'){
    activeIndex.value = (activeIndex.value - 1 + len) % len
    focusActive()
    e.preventDefault()
  } else if (e.key === 'Enter'){
    const m = months.value[activeIndex.value]
    if (m) select(m.value)
    e.preventDefault()
  } else if (e.key === 'Escape'){
    closePanel()
    e.preventDefault()
  } else if (e.key === 'Home'){
    activeIndex.value = 0; focusActive(); e.preventDefault()
  } else if (e.key === 'End'){
    activeIndex.value = (months.value || []).length -1; focusActive(); e.preventDefault()
  }
}

function onItemKeydown(e, idx){
  // delegate to list handler
  if (e.key === 'Enter'){
    const m = months.value[idx]
    if (m) select(m.value)
  } else if (e.key === 'Escape'){
    closePanel()
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End'){
    onListKeydown(e)
  }
}

function focusActive(){
  nextTick(()=>{
    const btns = root.value?.querySelectorAll('.month-picker__item button') || []
    const idx = activeIndex.value >=0 ? activeIndex.value : 0
    if (btns[idx]) btns[idx].focus()
  })
}

onMounted(async ()=>{
  document.addEventListener('click', onClickOutside)
  if (!availableMonths.value || availableMonths.value.length === 0){
    loading.value = true
    await store.fetchAvailableMonths()
    loading.value = false
  }
})

onBeforeUnmount(()=>{
  document.removeEventListener('click', onClickOutside)
})

const label = 'МЕСЯЦ'
const currentLabel = computed(()=>{
  const v = props.modelValue || selectedMonth.value
  if (!v) return ''
  const d = new Date(v + '-01')
  // produce "ноябрь 2025" (remove trailing " г.")
  const s = d.toLocaleString('ru-RU', { year: 'numeric', month: 'long' })
  return s.replace(/\s+г\.?$/i, '')
})
</script>

<style scoped lang="scss">
.month-picker {
  position: relative;
  display: inline-block;
}

/* Use centralized .picker-toggle and .month-picker__label/.month-picker__current
   provided by shared styles in _pickers.scss and _buttons-pills.scss */

.month-picker__panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  /* Force dropdown to match the width of the root picker element */
  width: 100%;
  /* Use a smaller base font for the dropdown so items and empty states start smaller */
  font-size: var(--font-size-small);
  box-sizing: border-box;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  box-shadow: var(--shadow-card);
  padding: 8px;
  z-index: 600;
}

.month-picker__list {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.month-picker__item { margin: 0; }

.month-picker__item button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  /* Desktop: smaller month label and no wrapping so it stays on one line */
  font-size: var(--font-size-small);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-sans);
}

.month-picker__item button:hover,
.month-picker__item button.is-focused { background: var(--surface-highlight); }

.month-picker__item button.is-active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
  font-weight: 700;
}

.month-picker__item button:focus { outline: 2px solid color-mix(in srgb, var(--accent) 20%, transparent); outline-offset: 2px; }

.month-picker__empty {
  padding: 10px;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .month-picker__toggle {
    width: 100%;
    min-width: 0;
    padding: 0 var(--gap-sm);
    min-height: var(--control-height-mobile);
    height: var(--control-height-mobile);
    gap: var(--gap-sm);
  }

  .month-picker__label { font-size: var(--font-size-tiny); }
  .month-picker__current { font-size: var(--font-size-body); }

  /* Mobile: keep month names on a single line in the dropdown */
  .month-picker__item button {
    font-size: var(--font-size-small);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>

