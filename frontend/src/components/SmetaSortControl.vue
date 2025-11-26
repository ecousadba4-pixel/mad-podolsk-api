<template>
  <div class="smeta-sort__control month-select-control month-select" ref="root">
    <button
      type="button"
      class="month-picker__toggle control picker-toggle"
      @click="toggle"
      @keydown.prevent.stop="onToggleKeydown"
      :aria-expanded="String(open)"
      aria-haspopup="listbox"
      :aria-controls="panelId"
      :aria-label="`Выбор показателя, текущий: ${currentLabel}`"
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

    <Teleport to="body">
      <div v-if="open" :id="panelId" ref="panelRef" class="month-picker__panel month-picker__panel--floating" role="listbox" :aria-activedescendant="activeId" tabindex="-1" @keydown="onListKeydown" :style="panelStyle">
      <ul class="month-picker__list">
        <li class="month-picker__item" role="presentation">
          <button type="button" role="option" :id="itemId(0)" :aria-selected="modelValue==='plan'? 'true':'false'" @click="select('plan')" @keydown.prevent.stop="onItemKeydown($event,0)" :class="{ 'is-active': modelValue==='plan', 'is-focused': activeIndex===0 }">План</button>
        </li>
        <li class="month-picker__item" role="presentation">
          <button type="button" role="option" :id="itemId(1)" :aria-selected="modelValue==='fact'? 'true':'false'" @click="select('fact')" @keydown.prevent.stop="onItemKeydown($event,1)" :class="{ 'is-active': modelValue==='fact', 'is-focused': activeIndex===1 }">Факт</button>
        </li>
        <li class="month-picker__item" role="presentation">
          <button type="button" role="option" :id="itemId(2)" :aria-selected="modelValue==='delta'? 'true':'false'" @click="select('delta')" @keydown.prevent.stop="onItemKeydown($event,2)" :class="{ 'is-active': modelValue==='delta', 'is-focused': activeIndex===2 }">Отклонение</button>
        </li>
      </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({ modelValue: { type: String, default: 'plan' }, collapsible: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'change'])

const root = ref(null)
const toggleBtn = ref(null)
const panelRef = ref(null)
const open = ref(false)
const activeIndex = ref(-1)
const panelId = `smeta-sort-panel-${Math.random().toString(36).slice(2,8)}`
const panelWidth = ref(null)
const panelLeft = ref(0)
const panelTop = ref(0)

const panelStyle = computed(()=>{
  const style = {}
  if (panelWidth.value) style.width = panelWidth.value + 'px'
  // position fixed coordinates
  style.position = 'fixed'
  style.left = Math.round(panelLeft.value) + 'px'
  style.top = Math.round(panelTop.value) + 'px'
  style.zIndex = 600
  return style
})

const options = [ { value: 'plan', label: 'План' }, { value: 'fact', label: 'Факт' }, { value: 'delta', label: 'Отклонение' } ]

const currentLabel = computed(()=>{
  const v = props.modelValue || options[0].value
  const opt = options.find(o=>o.value===v)
  return opt ? opt.label : ''
})

function itemId(i){ return `smeta-sort-item-${i}-${panelId}` }
const activeId = computed(()=> activeIndex.value>=0 ? itemId(activeIndex.value) : null)

function setActiveByValue(val){
  const idx = options.findIndex(o=>o.value===val)
  activeIndex.value = idx >=0 ? idx : 0
}

function openPanel(){
  open.value = true
  setActiveByValue(props.modelValue)
  // set panel width to match toggle
  nextTick(()=>{
    updatePanelPosition()
    const btns = root.value?.querySelectorAll('.month-picker__item button') || []
    const idx = activeIndex.value>=0 ? activeIndex.value : 0
    if (btns[idx]){
      try{ btns[idx].focus({ preventScroll: true }) }catch(e){ try{ btns[idx].focus() }catch{} }
    }
  })
}

function closePanel(){
  open.value = false
  activeIndex.value = -1
  nextTick(()=>{ try{ toggleBtn.value?.focus({ preventScroll: true }) }catch(e){ try{ toggleBtn.value?.focus() }catch{} } })
}

function toggle(){ if (open.value) closePanel(); else openPanel() }

function select(value){ emit('update:modelValue', value); emit('change', value); closePanel() }

function onClickOutside(e){ if (!root.value) return; const isInsideRoot = root.value.contains(e.target); const isInsidePanel = panelRef.value ? panelRef.value.contains(e.target) : false; if (!isInsideRoot && !isInsidePanel) closePanel() }

function onToggleKeydown(e){ if (e.key==='ArrowDown' || e.key==='ArrowUp'){ openPanel(); e.preventDefault(); return } }

function onListKeydown(e){ const len = options.length; if (!len) return; if (e.key==='ArrowDown'){ activeIndex.value = (activeIndex.value+1)%len; focusActive(); e.preventDefault() } else if (e.key==='ArrowUp'){ activeIndex.value = (activeIndex.value-1+len)%len; focusActive(); e.preventDefault() } else if (e.key==='Enter'){ const o = options[activeIndex.value]; if (o) select(o.value); e.preventDefault() } else if (e.key==='Escape'){ closePanel(); e.preventDefault() } else if (e.key==='Home'){ activeIndex.value = 0; focusActive(); e.preventDefault() } else if (e.key==='End'){ activeIndex.value = options.length-1; focusActive(); e.preventDefault() } }

function onItemKeydown(e, idx){ if (e.key==='Enter'){ const o = options[idx]; if (o) select(o.value) } else if (e.key==='Escape'){ closePanel() } else if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)){ onListKeydown(e) } }

function focusActive(){ nextTick(()=>{ const btns = root.value?.querySelectorAll('.month-picker__item button') || []; const idx = activeIndex.value>=0 ? activeIndex.value : 0; if (btns[idx]){ try{ btns[idx].focus({ preventScroll: true }) }catch(e){ try{ btns[idx].focus() }catch{} } } }) }

function updatePanelPosition(){
  try{
    const el = toggleBtn.value || root.value?.querySelector('.month-picker__toggle')
    if (el && el.getBoundingClientRect){
      const rect = el.getBoundingClientRect()
      const offset = 8
      // default width match toggle
      const w = Math.round(rect.width)
      panelWidth.value = w
      // compute desired left so centers match
      let left = rect.left + rect.width/2 - (panelWidth.value/2)
      // clamp to viewport with small margin
      const margin = 8
      const vw = (typeof window !== 'undefined') ? window.innerWidth : left + panelWidth.value
      if (left < margin) left = margin
      if (left + panelWidth.value > vw - margin) left = Math.max(margin, vw - margin - panelWidth.value)
      panelLeft.value = left
      // preferred below the toggle; if not enough space, open above
      let top = rect.bottom + offset
      const vh = (typeof window !== 'undefined') ? window.innerHeight : top + 200
      // try to read panel height if available
      const panelH = panelRef.value?.getBoundingClientRect ? Math.round(panelRef.value.getBoundingClientRect().height) : null
      if (panelH && top + panelH > vh - margin){
        // open above
        top = rect.top - offset - (panelH || 0)
      }
      panelTop.value = top
      return
    }
  }catch(e){}
}

onMounted(async ()=>{ document.addEventListener('click', onClickOutside); updatePanelPosition(); if (typeof window !== 'undefined'){ window.addEventListener('resize', updatePanelPosition) } })
onBeforeUnmount(()=>{ document.removeEventListener('click', onClickOutside); if (typeof window !== 'undefined'){ window.removeEventListener('resize', updatePanelPosition) } })

// legacy: updatePanelPosition handles width/left/top now
</script>

<style scoped>
/* Reuse MonthPicker styles for the panel look */
.smeta-sort__control { position: relative; display: inline-block; }
.smeta-sort__control.month-select { border: none !important; box-shadow: none !important; }
.month-picker__toggle { display:flex; align-items:center; gap:var(--gap-sm); padding:var(--gap-sm) 14px; background:var(--bg-card); border-radius:var(--radius-md); border: none; box-shadow: var(--shadow-card), 0 0 0 1px var(--border-soft); min-height:var(--control-height); width:100% }
.month-picker__info { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px; width:100% }
.month-picker__current { font-family: var(--font-sans); font-weight:600 }
.month-picker__arrow { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:44px; height:44px; display:inline-flex; align-items:center; justify-content:center; pointer-events:auto }

.month-picker__panel { position: absolute; top: calc(100% + 8px); left: 0; right: auto; width: 100%; box-sizing: border-box; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 10px; box-shadow: var(--shadow-card); padding: 8px; z-index: 600; }
.month-picker__list { list-style:none; margin:0; padding:6px; display:flex; flex-direction:column; gap:8px }
.month-picker__item button { width:100%; display:inline-flex; align-items:center; padding:8px 12px; border-radius:8px; border:1px solid transparent; background:transparent; text-align:left; cursor:pointer; font-size:var(--font-size-body); font-family:var(--font-sans) }
.month-picker__item button:hover, .month-picker__item button.is-focused { background: var(--surface-highlight) }
.month-picker__item button.is-active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent-strong); font-weight:700 }
.month-picker__empty { padding:10px; color: var(--text-muted) }

@media (max-width: 640px){
  .month-picker__toggle { width:100%; min-width:0; padding: 0 var(--gap-sm); min-height: var(--control-height-mobile); height: var(--control-height-mobile); gap: var(--gap-sm) }
}

/* focus outline: stronger contour when keyboard-focused */
.smeta-sort__control:focus-within .month-picker__toggle{
  box-shadow: var(--shadow-card), 0 0 0 1px color-mix(in srgb, var(--accent) 30%, var(--border-soft));
}

/* Hide pseudo chevron from month-select-control (global) to avoid double chevrons */
.smeta-sort__control.month-select::after, .smeta-sort__control.month-select-control::after { display:none !important }
</style>

