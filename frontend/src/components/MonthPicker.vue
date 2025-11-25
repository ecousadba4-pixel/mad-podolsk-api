<template>
  <div class="month-picker" ref="root">
    <button
      type="button"
      class="month-picker__toggle"
      @click="toggle()"
      @keydown.prevent.stop="onToggleKeydown"
      :aria-expanded="String(open)"
      aria-haspopup="listbox"
      :aria-controls="panelId"
      :aria-label="`Выбор месяца, текущий: ${currentLabel}`"
      ref="toggleBtn"
    >
      <span class="month-picker__label">{{ label }}</span>
      <span class="month-picker__current">{{ currentLabel }}</span>
      <span class="month-picker__arrow">▾</span>
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
            :class="{ 'is-active': m.value === modelValue, 'is-focused': idx === activeIndex }">
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

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const store = useDashboardStore()
const open = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
const toggleBtn = ref(null)
const root = ref(null)

const months = computed(() => {
  // map store.availableMonths (array of YYYY-MM) to {value,label}
  const arr = (store.availableMonths || []).map(v => {
    const d = new Date(v + '-01')
    const label = d.toLocaleString('ru-RU', { year: 'numeric', month: 'long' })
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
  setActiveByValue(props.modelValue || store.selectedMonth)
  nextTick(()=>{
    // focus active item if exists
    const btns = root.value?.querySelectorAll('.month-picker__item button') || []
    const idx = activeIndex.value >=0 ? activeIndex.value : 0
    if (btns[idx]) btns[idx].focus()
  })
}

function closePanel(){
  open.value = false
  activeIndex.value = -1
  nextTick(()=>{ try{ toggleBtn.value?.focus() }catch(e){} })
}

function toggle(){
  if (open.value) closePanel(); else openPanel()
}

function select(value){
  emit('update:modelValue', value)
  store.setSelectedMonth(value)
  store.fetchMonthlySummary()
  store.fetchSmetaCards()
  closePanel()
}

function onClickOutside(e){
  if (!root.value) return
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
  if (!store.availableMonths || store.availableMonths.length === 0){
    loading.value = true
    await store.fetchAvailableMonths()
    loading.value = false
  }
})

onBeforeUnmount(()=>{
  document.removeEventListener('click', onClickOutside)
})

const label = 'Месяц'
const currentLabel = computed(()=>{
  const v = props.modelValue || store.selectedMonth
  if (!v) return ''
  const d = new Date(v + '-01')
  return d.toLocaleString('ru-RU', { year: 'numeric', month: 'long' })
})
</script>

<style scoped>
.month-picker { position: relative; display: inline-block; }
  .month-picker__toggle { display: inline-flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border-soft); padding: 0 12px; border-radius: var(--radius-md); cursor: pointer; min-width: 200px; min-height: var(--control-height); height: var(--control-height); }
.month-picker__label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; margin-right: 6px; }
.month-picker__current { font-weight: 700; color: var(--text-main); flex: 1; text-align: left; }
.month-picker__arrow { color: var(--text-muted); }
  .month-picker__panel { position: absolute; top: calc(100% + 8px); left: 0; background: var(--bg-card); border: 1px solid var(--border-soft); box-shadow: var(--shadow-soft); border-radius: var(--radius-md); z-index: 40; max-height: 320px; overflow: auto; padding: 8px; width: 100%; box-sizing: border-box; }
.month-picker__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.month-picker__item button { width: 100%; text-align: left; padding: 10px 12px; border-radius: 6px; background: transparent; border: none; cursor: pointer; font-size: var(--font-size-body); }
.month-picker__item button:hover, .month-picker__item button.is-focused { background: var(--bg-muted); }
.month-picker__item button.is-active { background: var(--accent-soft); color: var(--accent-strong); font-weight: 700; }
.month-picker__empty { padding: 12px; color: var(--text-muted); }
</style>
