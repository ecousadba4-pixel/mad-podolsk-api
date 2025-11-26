<template>
  <section class="panel contract-execution contract-execution--compact p-md">
    <div class="panel-header row-between">
      <div class="panel-title-group">
        <h3 class="panel-title">Исполнение контракта</h3>
      </div>
      <div class="panel-meta">
        <div class="panel-meta-row panel-meta-labels">
          <div class="panel-meta-item"><div class="panel-meta-label">Контракт</div></div>
          <div class="panel-meta-item"><div class="panel-meta-label">Выполнено</div></div>
          <div class="panel-meta-item"><div class="panel-meta-label">Исполнение</div></div>
        </div>
        <div class="panel-meta-row panel-meta-values">
          <div class="panel-meta-item"><div class="panel-meta-value">{{ formatMoney(contract?.summa_contract) }}</div></div>
          <div class="panel-meta-item"><div class="panel-meta-value">{{ formatMoney(contract?.fact_total) }}</div></div>
          <div class="panel-meta-item"><div class="panel-meta-value">{{ percent(contract?.contract_planfact_pct) }}</div></div>
        </div>
      </div>
    </div>

    <div class="contract-execution__body">
      <div class="contract-progress">
        <div class="contract-progress__bar">
          <div class="contract-progress__fill progress__fill" :style="{ '--progress': progressPercent + '%' }" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({ contract: { type: Object, default: () => ({}) } })

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

function percent(v){
  if (v === undefined || v === null) return '-'
  return Math.round(v * 100) + ' %'
}

const progressPercent = computed(()=>{
  const v = props.contract && props.contract.contract_planfact_pct
  if (v === undefined || v === null) return 0
  return Math.round(v * 100)
})

import { computed } from 'vue'
</script>

