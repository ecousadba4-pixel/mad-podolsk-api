<template>
  <section
    class="panel contract-execution contract-execution--compact p-md"
    :class="{ 'is-mobile': isMobile }"
  >
    <div class="panel-header row-between">
      <div class="panel-title-group">
        <UiText tag="h3" variant="h3" class="panel-title">Исполнение контракта</UiText>
      </div>
      <div class="panel-meta">
        <div class="panel-meta-row panel-meta-labels">
          <div class="panel-meta-item"><UiLabel class="panel-meta-label">Контракт</UiLabel></div>
          <div class="panel-meta-item"><UiLabel class="panel-meta-label">Выполнено</UiLabel></div>
          <div class="panel-meta-item"><UiLabel class="panel-meta-label">Исполнение</UiLabel></div>
        </div>
        <div class="panel-meta-row panel-meta-values">
          <div class="panel-meta-item"><UiText weight="bold" class="panel-meta-value">{{ formatMoney(contract?.summa_contract) }}</UiText></div>
          <div class="panel-meta-item"><UiText weight="bold" class="panel-meta-value">{{ formatMoney(contract?.fact_total) }}</UiText></div>
          <div class="panel-meta-item"><UiText weight="bold" class="panel-meta-value">{{ percent(contract?.contract_planfact_pct) }}</UiText></div>
        </div>
      </div>
    </div>

    <div class="contract-execution__body">
      <UiProgress :value="progressPercent" class="contract-progress" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useIsMobile } from '../../composables/useIsMobile'
import { formatMoney, formatPercent } from '../../utils/format'
import { UiText, UiLabel, UiProgress } from '../ui'

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

