<template>
  <section class="category-grid">
    <div v-if="!items || items.length === 0" class="empty-state">Нет данных по смете</div>

    <div v-else class="category-grid">
      <article v-for="item in items" :key="item.id" class="category-card" @click="$emit('select', item)">
        <div class="category-title">
          <div>{{ item.title }}</div>
          <div class="category-pill">{{ item.type }}</div>
        </div>

        <div class="category-values">
          <span>
            <div class="label">План</div>
            <strong>{{ formatMoney(item.plan) }}</strong>
          </span>
          <span>
            <div class="label">Факт</div>
            <strong>{{ formatMoney(item.fact) }}</strong>
          </span>
          <span>
            <div class="label">Отклонение</div>
            <strong :class="{'category-delta': true, 'delta-negative': item.delta < 0}">{{ formatMoney(item.delta) }}</strong>
          </span>
        </div>

        <div class="category-progress">
          <div class="category-progress-labels">
            <span class="category-progress-left">Выполнение</span>
            <strong>{{ item.progressPercent }}%</strong>
          </div>
          <div class="category-progress-bar">
            <div class="category-progress-fill" :style="{width: item.progressPercent + '%'}"></div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] }
})
const emit = defineEmits(['select'])

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  return Number(v).toLocaleString('ru-RU')
}
</script>
