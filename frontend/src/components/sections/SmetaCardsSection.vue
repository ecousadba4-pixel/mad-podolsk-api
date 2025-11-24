<script setup>
import { computed } from 'vue'
import { useDashboardStore } from '../../store/dashboardStore.js'

const store = useDashboardStore()

const cards = computed(() => store.smetaCards)

function onCardClick(key) {
  store.setSelectedSmeta(key)
  store.fetchSmetaDetails(key)
}
</script>

<template>
  <section class="smeta-cards">
    <div v-if="store.smetaCardsLoading">Загрузка карточек…</div>

    <div v-else class="smeta-cards__list">
      <article v-for="c in cards" :key="c.smeta_key" class="smeta-card" @click="onCardClick(c.smeta_key)">
        <h3 class="smeta-card__title">{{ c.label }}</h3>
        <div class="smeta-card__row"><span>План</span><strong>{{ c.plan?.toLocaleString() }}</strong></div>
        <div class="smeta-card__row"><span>Факт</span><strong>{{ c.fact?.toLocaleString() }}</strong></div>
        <div class="smeta-card__row"><span>Отклонение</span><strong>{{ c.delta?.toLocaleString() }}</strong></div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.smeta-cards__list { display: flex; gap: 16px; flex-wrap: wrap }
.smeta-card { width: 220px; padding: 14px; background: #fff; border-radius: 10px; border: 1px solid #e6e6e6; cursor: pointer }
.smeta-card__title { margin: 0 0 8px; font-size: 16px }
.smeta-card__row { display:flex; justify-content: space-between; padding: 4px 0 }
</style>
