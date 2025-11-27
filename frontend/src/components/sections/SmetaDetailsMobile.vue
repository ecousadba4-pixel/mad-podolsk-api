<template>
  <div class="smeta-details-mobile">
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
    <div class="smeta-mobile-totals p-sm smeta-mobile-totals--highlight">
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
</template>

<script setup>
const props = defineProps({
  sortedItems: { type: Array, default: () => [] },
  totalsPlan: { type: Number, default: 0 },
  totalsFact: { type: Number, default: 0 },
  totalsDelta: { type: Number, default: 0 },
  // functions passed from parent to handle clamping/expansion and refs
  registerTitleRef: { type: Function, required: true },
  isClamped: { type: Function, required: true },
  isExpanded: { type: Function, required: true },
  toggleExpand: { type: Function, required: true },
  idFor: { type: Function, required: true },
  formatMoney: { type: Function, required: true }
})
const emit = defineEmits(['select'])
</script>

<style scoped>
/* keep mobile styles scoped here; these were copied from original table file */
.smeta-mobile-row-labels,
.smeta-mobile-row-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-items: center;
}
.smeta-mobile-row-labels .lbl { text-align: center; font-weight: 600; color: var(--color-text-muted, #6b6b6b); }
.smeta-mobile-row-values .val { text-align: center; font-variant-numeric: tabular-nums; }
.smeta-details-mobile .smeta-mobile-row-title { background-color: rgba(0,0,0,0.05); padding: 8px 12px; border-top-left-radius: 8px; border-top-right-radius: 8px; }
.smeta-mobile-item { border-radius: 8px; }
.smeta-title-toggle { background: transparent; border: none; padding: 0; margin-left: 6px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 10px; }
.smeta-title-toggle .chev { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; color: var(--chevron-color, rgb(94 100 115 / 50%)); transition: background-color .12s ease, transform .12s ease, color .12s ease; border-radius: 10px; }
.smeta-title-toggle .chev svg { width: 18px; height: 18px; }
.smeta-title-toggle:hover .chev { background: var(--surface-highlight, rgba(0,0,0,0.04)); }
.smeta-title-toggle:active .chev { transform: scale(.98); }
.smeta-title-toggle:focus-visible { outline: 2px solid color-mix(in srgb, var(--accent, #6b77f4) 20%, transparent); outline-offset: 2px; }
.smeta-title-toggle .chev.rotated { transform: rotate(180deg); color: #6b7280; }
.smeta-mobile-totals--highlight { background-color: rgba(0,0,0,0.12); border-radius: 8px; padding: 12px; margin-top: 12px; }
.smeta-mobile-totals--highlight .smeta-mobile-row-labels .lbl { color: var(--color-text-muted, #4b5563); font-weight: 600; }
.smeta-mobile-totals--highlight .smeta-mobile-row-values .val { font-weight: 700; }
</style>
