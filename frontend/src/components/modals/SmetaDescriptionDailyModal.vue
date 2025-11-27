<template>
  <Teleport to="body" v-if="visible">
    <div class="modal-backdrop visible" @click.self="$emit('close')">
      <div class="modal p-md" :class="{ 'is-mobile': isMobile }" role="dialog" aria-modal="true">
        <header class="modal-header items-center row-between">
          <h3 class="modal-title text-h2">{{ description }}</h3>
          <button class="modal-close control-sm" @click="$emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div v-if="loading">Загрузка…</div>
          <table v-else class="smeta-breakdown-table modal-table" :class="{ 'is-mobile': isMobile }">
            <thead>
              <tr>
                <th class="date-col">Дата</th>
                <th class="unit-col">Ед.изм.</th>
                <th class="numeric">Объём</th>
                <th class="numeric">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rowsList" :key="r.date">
                <td class="modal-row-date date-col">{{ formatDate(r.date) }}</td>
                <td class="unit-col">{{ r.unit || '-' }}</td>
                <td class="numeric">{{ r.volume }}</td>
                <td class="numeric modal-row-value">{{ formatMoney(r.amount) }}</td>
              </tr>
              <tr v-if="rowsList.length === 0">
                <td colspan="4" class="muted">Нет данных за выбранный период</td>
              </tr>
            </tbody>
          </table>
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
/* Reduce horizontal gaps: table sizes to content and paddings are smaller */
.smeta-breakdown-table.modal-table {
  table-layout: auto; /* allow columns to size to content */
  width: auto; /* don't stretch to full modal width */
  max-width: calc(100% - 24px);
  margin: 0 auto;
  border-collapse: collapse; /* remove default cell spacing */
}

.modal-body {
  overflow-x: auto; /* keep horizontal scroll if content still wider */
  text-align: center; /* center inline-table inside modal body */
}

/* Reduce paddings to shrink inter-column gaps */
.smeta-breakdown-table.modal-table {
  display: inline-table; /* allow centering via text-align on parent */
}

.smeta-breakdown-table.modal-table th,
.smeta-breakdown-table.modal-table td {
  padding: 0.32rem 0.5rem;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.smeta-breakdown-table.modal-table thead th {
  padding: 0.36rem 0.5rem;
  font-weight: 600;
}

/* Keep date column wide enough to show full date, but don't let it add extra spacing */
.smeta-breakdown-table.modal-table th.date-col,
.smeta-breakdown-table.modal-table td.date-col {
  min-width: 110px;
  width: auto;
}

.modal-table th.unit-col,
.modal-table td.unit-col {
  padding-left: 0.3rem;
  padding-right: 0.3rem;
}
</style>
