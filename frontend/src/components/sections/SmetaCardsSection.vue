<script setup>
import { computed } from 'vue'
import { useDashboardStore } from '../../store/dashboardStore.js'

const store = useDashboardStore()

const cards = computed(() => store.smetaCards)

function onCardClick(key) {
  store.setSelectedSmeta(key)
  store.fetchSmetaDetails(key)
}

function formatNumber(v){ if (v === null || v === undefined) return '-'; return Number(v).toLocaleString('ru-RU') }
</script>

<template>
  <section class="smeta-cards">
    <div v-if="store.smetaCardsLoading">Загрузка карточек…</div>

    <div v-else class="smeta-cards__list">
      <article v-for="c in cards" :key="c.smeta_key" class="smeta-card smeta-card--large card--interactive" @click="onCardClick(c.smeta_key)">
        <div class="smeta-card__accent" aria-hidden="true"></div>
        <div class="smeta-card__body">
          <header class="smeta-card__head">
            <h3 class="smeta-card__title">{{ c.label }}</h3>
            <div class="smeta-card__meta-pill" v-if="c.count">{{ c.count }} работ</div>
          </header>

          <div class="smeta-card__numbers">
            <div class="smeta-card__col">
              <div class="smeta-card__label">ПЛАН</div>
              <div class="smeta-card__value">{{ formatNumber(c.plan) }}</div>
            </div>
            <div class="smeta-card__col">
              <div class="smeta-card__label">ФАКТ</div>
              <div class="smeta-card__value">{{ formatNumber(c.fact) }}</div>
            </div>
            <div class="smeta-card__col">
              <div class="smeta-card__label">ОТКЛОНЕНИЕ</div>
              <div class="smeta-card__value" :class="{'delta-negative': c.delta < 0}">{{ formatNumber(c.delta) }}</div>
            </div>
          </div>

          <div class="smeta-card__progress">
            <div class="smeta-card__progress-label">ИСПОЛНЕНИЕ</div>
            <div class="smeta-progress__bar">
              <div class="smeta-progress__fill" :style="{ width: (c.progressPercent || 0) + '%' }"></div>
            </div>
            <div class="smeta-card__progress-percent">{{ c.progressPercent || 0 }}%</div>
          </div>
        </div>
      </article>
    </div>
  </section>

</template>
