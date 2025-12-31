<template>
  <Teleport to="body" v-if="visible">
    <div class="modal-backdrop visible" @click.self="$emit('close')">
      <div class="modal p-md" :class="{ 'is-mobile': isMobile }" role="dialog" aria-modal="true">
        <header class="modal-header items-center row-between">
          <h3 class="modal-title text-h2">{{ description }}</h3>
          <button class="modal-close control-sm" @click="$emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div class="modal-subtitle muted" v-if="isMobile">
            Единица измерения: <span v-if="loading">Загрузка…</span><span v-else>{{ unitValue || '-' }}</span>
          </div>
          <div v-if="loading">Загрузка…</div>
          <div v-else class="smeta-breakdown-table__modal-wrapper">
            <table class="smeta-breakdown-table modal-table smeta-breakdown-table--modal" :class="{ 'is-mobile': isMobile }">
            <thead>
              <tr>
                <th class="date-col"><div class="cell-inner">Дата</div></th>
                <th class="unit-col" v-if="!isMobile"><div class="cell-inner">Ед.изм.</div></th>
                <th class="numeric"><div class="cell-inner">Объём</div></th>
                <th class="numeric"><div class="cell-inner">Сумма</div></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rowsList" :key="r.date">
                <td class="modal-row-date date-col"><div class="cell-inner">{{ formatDate(r.date) }}</div></td>
                <td class="unit-col" v-if="!isMobile"><div class="cell-inner">{{ r.unit || '-' }}</div></td>
                <td class="numeric"><div class="cell-inner">{{ r.volume }}</div></td>
                <td class="numeric modal-row-value"><div class="cell-inner">{{ formatMoney(r.amount) }}</div></td>
              </tr>
              <tr v-if="rowsList.length === 0">
                <td :colspan="isMobile ? 3 : 4" class="muted">Нет данных за выбранный период</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useIsMobile } from '../../composables/useIsMobile'
import { useQuery } from '../../composables/useQueryClient'
import { formatMoney } from '../../utils/format'

const props = defineProps({ 
  visible: Boolean, 
  month: String, 
  smeta_key: String, 
  description: String,
  description_id: String  // Short hash ID for API calls
})
const emit = defineEmits(['close'])

const { isMobile } = useIsMobile()

const smetaDescriptionQuery = useQuery({
  // Use description_id in query key for better caching
  queryKey: () => ['smeta-description-daily', props.month, props.smeta_key, props.description_id || props.description],
  queryFn: async () => {
    if (!props.month || !props.smeta_key || (!props.description_id && !props.description)) return []
    try {
      const api = await import('../../api/dashboard')
      // Use description_id for API call (shorter URL)
      const res = await api.getSmetaDescriptionDaily(props.month, props.smeta_key, props.description_id)
      return res.rows || []
    } catch (err) {
      const api2 = await import('../../api/dashboard')
      const r = await api2.getSmetaDetails(props.month, props.smeta_key)
      return (r && r.rows) || []
    }
  },
  enabled: computed(() => Boolean(props.visible && props.month && props.smeta_key && (props.description_id || props.description))),
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false
})

const rowsList = computed(() => smetaDescriptionQuery.data.value || [])
const loading = computed(() => smetaDescriptionQuery.isLoading.value || smetaDescriptionQuery.isFetching.value)

const unitValue = computed(() => {
  const rows = rowsList.value || []
  if (!rows.length) return ''
  const units = Array.from(new Set(rows.map(r => (r && r.unit) || '').filter(Boolean)))
  return units.length ? units[0] : ''
})

function formatDate(d){
  if (!d) return '-'
  const s = String(d).slice(0,10)
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

watch(()=>props.visible, v=>{ if (v) smetaDescriptionQuery.refetch() })
watch(() => [props.month, props.smeta_key, props.description], () => {
  if (props.visible) smetaDescriptionQuery.refetch()
})
</script>

<style scoped>
/* ===== DESKTOP STYLES ===== */
.smeta-breakdown-table.modal-table {
  table-layout: auto;
  width: auto;
  max-width: calc(100% - 24px);
  margin: 0 auto;
  border-collapse: collapse;
  display: inline-table;
}

.modal-body {
  overflow-x: auto;
  text-align: center;
  padding-bottom: 1.2rem;
  scrollbar-gutter: stable both-edges;
}

.smeta-breakdown-table.modal-table th,
.smeta-breakdown-table.modal-table td {
  padding: 0.32rem 0.5rem;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.smeta-breakdown-table.modal-table thead th {
  padding: 0.36rem 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Desktop media query */
@media (min-width: 641px) {
  .smeta-breakdown-table.modal-table {
    table-layout: fixed;
    width: 100%;
    display: table;
  }
  .smeta-breakdown-table.modal-table th,
  .smeta-breakdown-table.modal-table td {
    width: calc(100% / 4);
  }
  .smeta-breakdown-table.modal-table th.date-col,
  .smeta-breakdown-table.modal-table td.date-col {
    min-width: 110px;
    width: auto;
  }
}

/* Mobile subtitle styling */
.modal-subtitle {
  margin-bottom: 0.36rem;
  font-size: 0.875rem;
}

/* Mobile: reduce modal title font */
.modal.is-mobile .modal-title {
  font-size: 0.875rem;
  line-height: 1.2;
}
</style>

<!-- 
  Глобальные стили для мобильной версии модального окна.
  Без scoped, чтобы гарантированно переопределить глобальные стили _tables-modals.scss и _utilities.scss
-->
<style>
/* ===== MOBILE TABLE STYLES ===== */
/* Контейнер modal-body: без паддингов, без горизонтального скролла */
.modal.is-mobile .modal-body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  padding: 0 !important;
}

/* Wrapper таблицы */
.modal.is-mobile .smeta-breakdown-table__modal-wrapper {
  width: 100%;
  padding: 0;
  overflow: visible;
}

/* Таблица: фиксированная раскладка, 100% ширины */
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile {
  table-layout: fixed !important;
  width: 100% !important;
  max-width: 100% !important;
  border-collapse: collapse;
}

/* Все ячейки: равная ширина (3 колонки), центрирование */
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile th,
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile td {
  width: 33.333% !important;
  text-align: center !important;
  padding: 0.3rem 0.15rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}

/* Сбрасываем display: flex на .modal-row-value, чтобы td оставался table-cell */
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile td.modal-row-value {
  display: table-cell !important;
}

/* Убираем min-width из глобальных стилей */
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile th:first-child,
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile td:first-child,
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile th:nth-child(2),
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile td:nth-child(2) {
  min-width: 0 !important;
}

/* .cell-inner: flexbox с центрированием */
.modal.is-mobile .smeta-breakdown-table--modal.is-mobile .cell-inner {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100%;
  text-align: center !important;
}
</style>