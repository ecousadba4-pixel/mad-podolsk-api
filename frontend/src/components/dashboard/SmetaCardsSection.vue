<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../store/dashboardStore.js'
import { CardsGrid, PageSection } from '../layouts'
import { formatNumber } from '../../utils/format.js'

const store = useDashboardStore()
// use storeToRefs to subscribe only to specific refs, reducing re-renders
const { smetaCards, smetaCardsLoading, selectedSmeta } = storeToRefs(store)

const emit = defineEmits(['select'])
const cards = computed(() => smetaCards.value || [])
const isInitialLoading = computed(() => smetaCardsLoading.value && cards.value.length === 0)

function onCardClick(key) {
  // Notify parent to load details and update store; keeps this component presentational
  emit('select', key)
}
</script>

<template>
  <PageSection title="Работы в разрезе смет" variant="panel" class="smeta-panel">
    <div v-if="isInitialLoading" class="dashboard__state">Загружаем карточки…</div>

    <CardsGrid v-else :loading="smetaCardsLoading" min-width="280px">
      <article v-for="c in cards" :key="c.smeta_key" :class="['smeta-card','smeta-card--large','card--interactive','p-md', { 'is-selected': selectedSmeta === c.smeta_key } ]" @click="onCardClick(c.smeta_key)">
        <!-- Информационная плашка для Внерегламента (верхний правый угол) -->
        <div v-if="String(c.smeta_key).toLowerCase().includes('vne')" class="smeta-card__info-badge">
          30% от плана
        </div>

        <div class="smeta-card__body">
          <header class="smeta-card__head">
            <h3 class="smeta-card__title text-h3">{{ c.label }}</h3>
            <div class="smeta-card__meta-pill" v-if="c.count">{{ c.count }} работ</div>
          </header>

          <div class="smeta-card__numbers">
            <div class="smeta-card__col card-col">
              <div class="smeta-card__label text-label">ПЛАН</div>
              <div class="smeta-card__value text-body">{{ formatNumber(c.plan) }}</div>
            </div>
            <div class="smeta-card__col card-col">
              <div class="smeta-card__label text-label">ФАКТ</div>
              <div class="smeta-card__value text-body">{{ formatNumber(c.fact) }}</div>
            </div>
            <div class="smeta-card__col card-col">
              <div class="smeta-card__label text-label">ОТКЛОНЕНИЕ</div>
              <div class="smeta-card__value text-body" :class="{'delta-negative': c.delta < 0}">{{ formatNumber(c.delta) }}</div>
            </div>
          </div>

          <div class="smeta-card__progress">
            <div class="smeta-progress-labels">
              <span>ИСПОЛНЕНИЕ</span>
              <strong>{{ c.progressPercent || 0 }}%</strong>
            </div>
            <div class="smeta-progress__bar">
              <div class="smeta-progress__fill progress__fill" :style="{ '--progress': (c.progressPercent || 0) + '%' }"></div>
            </div>
          </div>
        </div>
      </article>
    </CardsGrid>
  </PageSection>
</template>
