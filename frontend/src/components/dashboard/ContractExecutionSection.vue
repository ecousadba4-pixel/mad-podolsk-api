<template>
  <section
    class="panel contract-execution contract-execution--compact p-md"
    :class="{ 'is-mobile': isMobile }"
  >
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
import { computed } from 'vue'
import { useIsMobile } from '../../composables/useIsMobile'
import { formatMoney, formatPercent } from '../../utils/format'

const props = defineProps({ contract: { type: Object, default: () => ({}) } })

const { isMobile } = useIsMobile()

function percent(v) {
  return formatPercent(v, true)
}

const progressPercent = computed(()=>{
  const v = props.contract && props.contract.contract_planfact_pct
  if (v === undefined || v === null) return 0
  return Math.round(v * 100)
})
</script>

