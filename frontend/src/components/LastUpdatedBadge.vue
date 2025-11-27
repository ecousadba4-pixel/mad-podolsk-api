<template>
  <div class="last-updated items-center p-sm" v-if="display">
    <span class="last-updated__dot" aria-hidden="true"></span>
    <div class="last-updated__text">
      <div class="last-updated__label text-label">ОБНОВЛЕНИЕ</div>
      <div class="last-updated__time text-body">{{ formatted }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDashboardDataStore } from '../store/dashboardDataStore.js'
import { storeToRefs } from 'pinia'

const props = defineProps({ loadedAt: { type: [String, Date], default: null } })

const store = useDashboardDataStore()
const { loadedAt, monthlySummary } = storeToRefs(store)

const source = computed(() => {
  if (props.loadedAt) return props.loadedAt
  if (loadedAt.value) return loadedAt.value
  const s = monthlySummary.value || {}
  return s.loaded_at || s.last_updated || s.updated_at || s.lastUpdated || s.timestamp || (s.meta && (s.meta.loaded_at || s.meta.last_updated)) || null
})

const display = computed(()=> !!source.value)

function pad(n){ return String(n).padStart(2,'0') }

const formatted = computed(()=>{
  const v = source.value
  if (!v) return ''
  const d = (typeof v === 'string') ? new Date(v) : new Date(v)
  if (isNaN(d)) return String(v)
  const day = pad(d.getDate())
  const month = pad(d.getMonth() + 1)
  const year = d.getFullYear()
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${day}.${month}.${year}, ${hh}:${mm}`
})
</script>

<style scoped lang="scss">
.last-updated {
  display: inline-flex;
  align-items: center;
  gap: 10px; /* уменьшенный горизонтальный gap между точкой и текстом */
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  padding: 6px 10px; /* уменьшенные внутренние отступы для экономии ширины */
  border-radius: 12px;
  box-shadow: var(--shadow-soft);
  min-height: var(--control-height);
  min-width: 0;
  width: auto;
  max-width: 100%;
}

.last-updated__dot {
  width: 10px;
  height: 10px;
  background: var(--success);
  flex: 0 0 10px;
  padding: 0;
  border-radius: 50%;
}

.last-updated__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px; /* уменьшенный вертикальный зазор */
  min-width: 0;
}

.last-updated__label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  /* allow wrapping to up to 2 lines instead of aggressive single-line shrinking */
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.05;
  width: 100%;
  box-sizing: border-box;
  font-size: clamp(0.64rem, 1.0vw, var(--font-size-caption));
}

.last-updated__time {
  font-weight: 600;
  color: var(--text-main);
  text-align: center;
  white-space: nowrap; /* keep single line */
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.05;
  width: 100%;
  box-sizing: border-box;
  font-size: clamp(0.78rem, 1.2vw, var(--font-size-body-sm));
}

@media (max-width: 640px) {
  .last-updated {
    flex: 1 1 40%;
    min-width: 0;
    justify-content: flex-end;
  }
}
</style>
