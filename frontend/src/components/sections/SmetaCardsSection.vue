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
