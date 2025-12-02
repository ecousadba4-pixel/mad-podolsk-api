<template>
  <div class="smeta-details-desktop">
    <div v-if="!groupedData.length" class="empty-state">Нет данных по смете</div>

    <table v-else :class="['smeta-breakdown-table', `sorted-by-${sortKey}`]">
      <colgroup>
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>Работы</th>
          <th :class="['numeric','sortable', { sorted: sortKey === 'plan' } ]" @click="toggleSort('plan')">
            План
            <span class="sort-indicator">
              <span v-if="sortKey === 'plan'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
              <span v-else class="inactive">▲▼</span>
            </span>
          </th>
          <th :class="['numeric','sortable', { sorted: sortKey === 'fact' } ]" @click="toggleSort('fact')">
            Факт
            <span class="sort-indicator">
              <span v-if="sortKey === 'fact'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
              <span v-else class="inactive">▲▼</span>
            </span>
          </th>
          <th :class="['numeric','sortable', { sorted: sortKey === 'delta' } ]" @click="toggleSort('delta')">
            Отклонение
            <span class="sort-indicator">
              <span v-if="sortKey === 'delta'" class="active">{{ sortDir < 0 ? '▼' : '▲' }}</span>
              <span v-else class="inactive">▲▼</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(group, gIdx) in sortedGroups" :key="group.type_of_work">
          <!-- Type of work group header (subtotal) -->
          <tr 
            class="smeta-breakdown-table__row smeta-breakdown-table__row--group-header"
            :class="{ 'is-expanded': isGroupExpanded(group.type_of_work) }"
            @click="toggleGroup(group.type_of_work)"
          >
            <td>
              <div class="group-header-content">
                <button 
                  class="group-toggle-btn"
                  :aria-expanded="isGroupExpanded(group.type_of_work)"
                  :aria-label="isGroupExpanded(group.type_of_work) ? 'Свернуть' : 'Развернуть'"
                >
                  <span class="chev" :class="{ rotated: isGroupExpanded(group.type_of_work) }" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                      <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                </button>
                <strong class="group-title">{{ group.type_of_work }}</strong>
              </div>
            </td>
            <td class="numeric"><strong>{{ formatMoney(group.totals.plan) }}</strong></td>
            <td class="numeric"><strong>{{ formatMoney(group.totals.fact) }}</strong></td>
            <td :class="{'negative': group.totals.delta < 0}" class="numeric"><strong>{{ formatMoney(group.totals.delta) }}</strong></td>
          </tr>
          <!-- Work items within this type (shown when expanded) -->
          <template v-if="isGroupExpanded(group.type_of_work)">
            <tr
              v-for="(item, idx) in group.sortedItems"
              :key="`${group.type_of_work}-${item.description || idx}`"
              class="smeta-breakdown-table__row smeta-breakdown-table__row--interactive smeta-breakdown-table__row--child"
              @click="$emit('select', { title: item.description, description: item.description, ...item })"
            >
              <td>
                <div class="smeta-title-wrapper child-item" :data-id="idFor(item, gIdx, idx)">
                  <div
                    :ref="el => registerTitleRef(el, idFor(item, gIdx, idx))"
                    class="truncate-2"
                    :class="{ 'is-expanded': isTitleExpanded(idFor(item, gIdx, idx)) }"
                  >
                    {{ item.description }}
                  </div>
                  <button
                    v-if="isClamped(idFor(item, gIdx, idx))"
                    class="smeta-title-toggle"
                    @click.stop="toggleTitleExpand(idFor(item, gIdx, idx))"
                    :aria-expanded="isTitleExpanded(idFor(item, gIdx, idx))"
                    :aria-label="isTitleExpanded(idFor(item, gIdx, idx)) ? 'Свернуть' : 'Развернуть'"
                  >
                    <span class="chev" :class="{ rotated: isTitleExpanded(idFor(item, gIdx, idx)) }" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                        <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </button>
                </div>
              </td>
              <td class="numeric">{{ formatMoney(item.plan) }}</td>
              <td class="numeric">{{ formatMoney(item.fact) }}</td>
              <td :class="{'negative': item.delta < 0}" class="numeric">{{ formatMoney(item.delta) }}</td>
            </tr>
          </template>
        </template>
      </tbody>
      <tfoot>
        <tr class="smeta-breakdown-table__totals">
          <td><strong>Итого</strong></td>
          <td class="numeric"><strong>{{ formatMoney(grandTotals.plan) }}</strong></td>
          <td class="numeric"><strong>{{ formatMoney(grandTotals.fact) }}</strong></td>
          <td :class="{'negative': grandTotals.delta < 0}" class="numeric"><strong>{{ formatMoney(grandTotals.delta) }}</strong></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup>
import { computed, ref, watch, reactive, onMounted, nextTick } from 'vue'
import { formatMoney } from '../../utils/format.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  sortKey: { type: String, default: 'plan' },
  sortDir: { type: Number, default: -1 },
  smetaKey: { type: String, default: '' }
})

const emit = defineEmits(['select', 'sort-changed'])

// Expanded groups state (all groups expanded by default)
const expandedGroups = reactive(new Set())

// Title expansion state for clamped descriptions
const expandedTitles = reactive(new Set())
const titleRefs = reactive({})
const clampedTitles = reactive(new Set())

// Initialize all groups as expanded on mount
onMounted(() => {
  groupedData.value.forEach(g => expandedGroups.add(g.type_of_work))
})

// Group items by type_of_work
const groupedData = computed(() => {
  const items = props.items || []
  const groups = {}
  
  for (const item of items) {
    const typeKey = item.type_of_work || 'Прочее'
    if (!groups[typeKey]) {
      groups[typeKey] = {
        type_of_work: typeKey,
        items: [],
        totals: { plan: 0, fact: 0, delta: 0 }
      }
    }
    groups[typeKey].items.push(item)
    groups[typeKey].totals.plan += Number(item.plan || 0)
    groups[typeKey].totals.fact += Number(item.fact || 0)
  }
  
  // Calculate delta for each group
  for (const g of Object.values(groups)) {
    g.totals.delta = g.totals.fact - g.totals.plan
  }
  
  return Object.values(groups)
})

// When groupedData changes, ensure all new groups are expanded
watch(groupedData, (newGroups) => {
  newGroups.forEach(g => {
    if (!expandedGroups.has(g.type_of_work)) {
      expandedGroups.add(g.type_of_work)
    }
  })
}, { immediate: true })

// Sort groups by subtotal (sortKey), and items within groups also by sortKey
const sortedGroups = computed(() => {
  const key = props.sortKey
  const dir = props.sortDir
  
  const getGroupValue = (g) => {
    if (key === 'delta') return g.totals.delta
    return g.totals[key] || 0
  }
  
  const getItemValue = (item) => {
    if (key === 'delta') return item.delta
    return item[key] || 0
  }
  
  // Sort groups by subtotal
  const sortedGrps = [...groupedData.value].sort((a, b) => {
    const diff = getGroupValue(a) - getGroupValue(b)
    return dir * (diff === 0 ? 0 : Math.sign(diff))
  })
  
  // Sort items within each group by the same key (always desc for items within group)
  return sortedGrps.map(g => ({
    ...g,
    sortedItems: [...g.items].sort((a, b) => {
      const diff = getItemValue(a) - getItemValue(b)
      // Items within group are always sorted descending by the selected column
      return -1 * (diff === 0 ? 0 : Math.sign(diff))
    })
  }))
})

// Grand totals
const grandTotals = computed(() => {
  const items = props.items || []
  const plan = items.reduce((s, it) => s + Number(it.plan || 0), 0)
  const fact = items.reduce((s, it) => s + Number(it.fact || 0), 0)
  return { plan, fact, delta: fact - plan }
})

// Toggle sort
function toggleSort(key) {
  let newDir = -1
  if (props.sortKey === key) {
    newDir = props.sortDir === -1 ? 1 : -1
  }
  emit('sort-changed', { key, dir: newDir })
}

// Group expansion
function isGroupExpanded(typeOfWork) {
  return expandedGroups.has(typeOfWork)
}

function toggleGroup(typeOfWork) {
  if (expandedGroups.has(typeOfWork)) {
    expandedGroups.delete(typeOfWork)
  } else {
    expandedGroups.add(typeOfWork)
  }
}

// Title expansion logic
function idFor(item, gIdx, idx) {
  return `${gIdx}-${idx}-${item.description?.substring(0, 20) || ''}`
}

function registerTitleRef(el, id) {
  if (el) {
    titleRefs[id] = el
    nextTick(() => {
      if (el.scrollHeight > el.clientHeight + 2) {
        clampedTitles.add(id)
      } else {
        clampedTitles.delete(id)
      }
    })
  }
}

function isTitleExpanded(id) {
  return expandedTitles.has(id)
}

function isClamped(id) {
  return clampedTitles.has(id)
}

function toggleTitleExpand(id) {
  if (expandedTitles.has(id)) {
    expandedTitles.delete(id)
  } else {
    expandedTitles.add(id)
  }
}
</script>

<style scoped>
.smeta-details-desktop {
  width: 100%;
}

.smeta-breakdown-table__row--group-header {
  background-color: var(--color-surface-elevated, #f5f5f5);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.smeta-breakdown-table__row--group-header:hover {
  background-color: var(--color-surface-hover, #ebebeb);
}

.group-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-toggle-btn {
  background: transparent;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.group-toggle-btn .chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--chevron-color, rgb(94 100 115 / 60%));
  transition: transform 0.15s ease, color 0.15s ease;
  transform: rotate(-90deg);
}

.group-toggle-btn .chev.rotated {
  transform: rotate(0deg);
  color: var(--color-text-primary, #333);
}

.group-toggle-btn .chev svg {
  width: 16px;
  height: 16px;
}

.group-title {
  font-weight: 600;
  color: var(--color-text-primary, #333);
}

.smeta-breakdown-table__row--child td:first-child {
  padding-left: 44px;
}

.child-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.smeta-title-toggle {
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
}

.smeta-title-toggle .chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--chevron-color, rgb(94 100 115 / 50%));
  transition: background-color 0.12s ease, transform 0.12s ease, color 0.12s ease;
  border-radius: 8px;
}

.smeta-title-toggle .chev svg {
  width: 14px;
  height: 14px;
}

.smeta-title-toggle .chev.rotated {
  transform: rotate(180deg);
  color: #6b7280;
}

.truncate-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.truncate-2.is-expanded {
  display: block;
  -webkit-line-clamp: unset;
  line-clamp: unset;
  overflow: visible;
}

.smeta-breakdown-table td.numeric,
.smeta-breakdown-table th.numeric {
  text-align: right;
  padding-right: 12px;
}

.smeta-breakdown-table tbody tr:nth-child(odd):not(.smeta-breakdown-table__row--group-header) {
  background-color: rgba(0, 0, 0, 0.02);
}

.smeta-breakdown-table__row--interactive:hover {
  background-color: var(--color-surface-hover, rgba(0, 0, 0, 0.04));
}
</style>
