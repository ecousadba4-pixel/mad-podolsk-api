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
import { useIsMobile } from '../../composables/useIsMobile.js'
import { useQuery } from '../../composables/useQueryClient.js'

const props = defineProps({ visible: Boolean, month: String, smeta_key: String, description: String })
const emit = defineEmits(['close'])

const { isMobile } = useIsMobile()

const smetaDescriptionQuery = useQuery({
  queryKey: () => ['smeta-description-daily', props.month, props.smeta_key, props.description],
  queryFn: async () => {
    if (!props.month || !props.smeta_key || !props.description) return []
    try {
      const api = await import('../../api/dashboard.js')
      const res = await api.getSmetaDescriptionDaily(props.month, props.smeta_key, props.description)
      return res.rows || []
    } catch (err) {
      const api2 = await import('../../api/dashboard.js')
      const r = await api2.getSmetaDetails(props.month, props.smeta_key)
      return (r && r.rows) || []
    }
  },
  enabled: computed(() => Boolean(props.visible && props.month && props.smeta_key && props.description)),
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

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}
</script>

<style scoped>
/* Base table layout: keep compact look but allow overrides for mobile */
.smeta-breakdown-table.modal-table {
  table-layout: auto;
  width: auto;
  max-width: calc(100% - 24px);
  margin: 0 auto;
  border-collapse: collapse;
  display: inline-table;
}

.modal-body {
  overflow-x: auto; /* horizontal scrolling when needed */
  text-align: center; /* center inline-table inside modal body */
  padding-bottom: 1.2rem; /* reserve space so scrollbar doesn't overlap content */
  scrollbar-gutter: stable both-edges; /* reserves space for scrollbar in supported browsers */
}

/* Cells: compact padding and centered content */
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

/* Mobile-specific: make columns equal width and ensure scrollbar space reserved */

/* Mobile — self-contained rules for modal table (no !important) */
.modal.is-mobile .modal-body {
  overflow-x: visible; /* не прячем правый край таблицы: данные влезают */
  padding-bottom: 0; /* убираем лишний отступ под воображаемый скролл */
}

.modal.is-mobile .smeta-breakdown-table__modal-wrapper {
  overflow: visible; /* скрываем искусственную границу справа в мобильном модальном окне */
  padding-bottom: 0;
}

.modal.is-mobile .smeta-breakdown-table--modal {
  table-layout: fixed;
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
}

/* Expect 3 visible columns on mobile (date / volume / amount). Equal widths, centered content */
.modal.is-mobile .smeta-breakdown-table--modal thead th,
.modal.is-mobile .smeta-breakdown-table--modal tbody td {
  width: calc(100% / 3);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal.is-mobile .smeta-breakdown-table--modal thead th.date-col,
.modal.is-mobile .smeta-breakdown-table--modal tbody td.date-col {
  min-width: 0;
  text-align: center;
}

/* Cell inner wrapper: use flex centering so header and data are aligned
   even when global rules set different text-align on th/td */
.smeta-breakdown-table--modal th .cell-inner,
.smeta-breakdown-table--modal td .cell-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* Keep date column centered too */
.smeta-breakdown-table--modal td.date-col .cell-inner,
.smeta-breakdown-table--modal th.date-col .cell-inner {
  justify-content: center;
}

/* Desktop / non-mobile: when 4 columns are present, distribute equally but keep date min-width */
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

/* Mobile: reduce modal title font to match column headers */
.modal.is-mobile .modal-title {
  font-size: 0.875rem;
  line-height: 1.2;
}
</style>
