<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
// Details table moved out to keep panels separate
import { useDashboardStore } from '../../store/dashboardStore.js'

const store = useDashboardStore()
// use storeToRefs to subscribe only to specific refs, reducing re-renders
const { smetaCards, smetaCardsLoading, selectedSmeta } = storeToRefs(store)

const emit = defineEmits(['select'])
const cards = smetaCards

function onCardClick(key) {
  // Notify parent to load details and update store; keeps this component presentational
  emit('select', key)
}

function formatNumber(v){ if (v === null || v === undefined) return '-'; return Number(v).toLocaleString('ru-RU') }
</script>

<template>
  <section class="panel smeta-panel">
    <div class="panel-header row-between">
      <div class="panel-title-group">
        <h3 class="panel-title text-h3">Работы в разрезе смет</h3>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="smetaCardsLoading">Загрузка карточек…</div>

      <div v-else class="smeta-cards__list">
      <article v-for="c in cards" :key="c.smeta_key" :class="['smeta-card','smeta-card--large','card--interactive','p-md', { 'is-selected': selectedSmeta === c.smeta_key } ]" @click="onCardClick(c.smeta_key)">
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
        </div>

        <!-- Details are rendered as a separate block in the parent view -->
      </div>
  </section>

</template>
