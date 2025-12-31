<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../store/dashboardStore'
import { CardsGrid, PageSection } from '../layouts'
import { formatNumber } from '../../utils/format'
import { UiText, UiLabel, UiBadge, UiProgress } from '../ui'

const store = useDashboardStore()
// use storeToRefs to subscribe only to specific refs, reducing re-renders
const { smetaCards, smetaCardsLoading, selectedSmeta } = storeToRefs(store)

/** @type {(key: string) => void} */
const emit = defineEmits(['select'])

// Используем ?? вместо || для корректной обработки пустого массива
const cards = computed(() => smetaCards.value ?? [])
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
            <UiText tag="h3" variant="body" weight="bold" class="smeta-card__title">{{ c.label }}</UiText>
            <UiBadge v-if="c.count" variant="muted" size="sm">{{ c.count }} работ</UiBadge>
          </header>

          <div class="smeta-card__numbers">
            <div class="smeta-card__col card-col">
              <UiLabel class="smeta-card__label">ПЛАН</UiLabel>
              <UiText variant="body" weight="bold" class="smeta-card__value">{{ formatNumber(c.plan) }}</UiText>
            </div>
            <div class="smeta-card__col card-col">
              <UiLabel class="smeta-card__label">ФАКТ</UiLabel>
              <UiText variant="body" weight="bold" class="smeta-card__value">{{ formatNumber(c.fact) }}</UiText>
            </div>
            <div class="smeta-card__col card-col">
              <UiLabel class="smeta-card__label">ОТКЛОНЕНИЕ</UiLabel>
              <UiText variant="body" weight="bold" :color="c.delta < 0 ? 'danger' : 'main'" class="smeta-card__value">{{ formatNumber(c.delta) }}</UiText>
            </div>
          </div>

          <UiProgress
            :value="c.progressPercent || 0"
            :labels="{ left: 'ИСПОЛНЕНИЕ', right: `${c.progressPercent || 0}%` }"
            class="smeta-card__progress"
          />
        </div>
      </article>
    </CardsGrid>
  </PageSection>
</template>
