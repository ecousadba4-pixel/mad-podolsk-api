<template>
  <section class="panel contract-execution">
    <div class="panel-header">
      <div class="panel-title-group">
        <div class="panel-title">Исполнение контракта</div>
      </div>
      <div class="panel-meta">
        <div class="panel-meta-item"><div class="panel-meta-label">Контракт</div><div class="panel-meta-value">{{ formatMoney(contract?.summa_contract) }}</div></div>
        <div class="panel-meta-item"><div class="panel-meta-label">Выполнено</div><div class="panel-meta-value">{{ formatMoney(contract?.fact_total) }}</div></div>
        <div class="panel-meta-item"><div class="panel-meta-label">Исполнение</div><div class="panel-meta-value">{{ percent(contract?.contract_planfact_pct) }}</div></div>
      </div>
    </div>

    <div class="contract-execution__body">
      <div class="contract-progress">
        <div class="contract-progress__bar">
          <div class="contract-progress__fill" :style="{ width: progressPercent + '%' }" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({ contract: { type: Object, default: () => ({}) } })

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  return Number(v).toLocaleString('ru-RU')
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
