<template>
  <div>
    <div v-if="!items || items.length === 0" class="empty-state">Нет данных по смете</div>

    <table v-else class="smeta-breakdown-table">
        <colgroup>
          <col />
          <col style="width:140px" />
          <col style="width:140px" />
          <col style="width:140px" />
        </colgroup>
        <thead>
          <tr>
            <th>Работы</th>
            <th class="numeric sortable" @click="toggleSort('plan')">План <span class="sort-indicator">{{ sortKey === 'plan' ? (sortDir < 0 ? '▼' : '▲') : '' }}</span></th>
            <th class="numeric sortable" @click="toggleSort('fact')">Факт <span class="sort-indicator">{{ sortKey === 'fact' ? (sortDir < 0 ? '▼' : '▲') : '' }}</span></th>
            <th class="numeric sortable" @click="toggleSort('delta')">Отклонение <span class="sort-indicator">{{ sortKey === 'delta' ? (sortDir < 0 ? '▼' : '▲') : '' }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in sortedItems" :key="item.title || item.description || item.work_name || idx" @click="$emit('select', item)" style="cursor:pointer">
            <td>{{ item.title || item.description || item.work_name }}</td>
            <td class="numeric">{{ formatMoney(item.plan) }}</td>
            <td class="numeric">{{ formatMoney(item.fact) }}</td>
            <td :class="{'negative': (Number(item.fact || 0) - Number(item.plan || 0)) < 0}" class="numeric">{{ formatMoney(Number(item.fact || 0) - Number(item.plan || 0)) }}</td>
          </tr>
        </tbody>
      </table>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] }
})
const emit = defineEmits(['select'])

import { computed, ref } from 'vue'

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}

// Sorting state: default by plan desc
const sortKey = ref('plan')
const sortDir = ref(-1) // -1 desc, 1 asc

function toggleSort(key){
  if (sortKey.value === key){
    sortDir.value = -sortDir.value
  } else {
    sortKey.value = key
    // default direction: desc
    sortDir.value = -1
  }
}

const sortedItems = computed(() => {
  const arr = (props.items || []).slice()
  const k = sortKey.value
  const dir = sortDir.value
  arr.sort((a, b) => {
    const va = k === 'delta' ? (Number(a.fact || 0) - Number(a.plan || 0)) : Number(a[k] || 0)
    const vb = k === 'delta' ? (Number(b.fact || 0) - Number(b.plan || 0)) : Number(b[k] || 0)
    if (va === vb) return 0
    // descending when dir === -1
    return (va > vb ? -1 : 1) * dir
  })
  return arr
})
</script>
