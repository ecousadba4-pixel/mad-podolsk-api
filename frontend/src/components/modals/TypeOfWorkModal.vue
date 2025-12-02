<template>
  <Teleport to="body" v-if="visible">
    <div class="modal-backdrop visible" @click.self="$emit('close')">
      <div class="modal p-md" :class="{ 'is-mobile': isMobile }" role="dialog" aria-modal="true">
        <header class="modal-header items-center row-between">
          <h3 class="modal-title text-h2">По типу работ</h3>
          <button class="modal-close control-sm" @click="$emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div v-if="loading">Загрузка…</div>
          <div v-else-if="error" class="dashboard__state dashboard__state--error">Ошибка: {{ error }}</div>
          <table v-else class="smeta-breakdown-table modal-table" :class="{ 'is-mobile': isMobile }">
            <colgroup>
              <col class="col-type" />
              <col class="col-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>Тип работы</th>
                <th class="numeric">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in sortedRows" :key="r.type_of_work">
                <td class="modal-row-type">{{ r.type_of_work }}</td>
                <td class="numeric modal-row-value">{{ formatMoney(r.amount) }}</td>
              </tr>
              <tr v-if="sortedRows.length === 0">
                <td colspan="2" class="muted">Нет данных за выбранный месяц</td>
              </tr>
            </tbody>
            <tfoot v-if="sortedRows.length > 0">
              <tr class="smeta-breakdown-table__totals">
                <td><strong>Итого</strong></td>
                <td class="numeric"><strong>{{ formatMoney(total) }}</strong></td>
              </tr>
            </tfoot>
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
import { formatMoney } from '../../utils/format.js'

const props = defineProps({ visible: Boolean, month: String })
const emit = defineEmits(['close'])

const { isMobile } = useIsMobile()

const typeOfWorkQuery = useQuery({
  queryKey: () => ['fact-by-type-of-work', props.month],
  queryFn: async () => {
    if (!props.month) return { rows: [], total: 0 }
    const api = await import('../../api/dashboard.js')
    const res = await api.getFactByTypeOfWork(props.month)
    return res || { rows: [], total: 0 }
  },
  enabled: computed(() => Boolean(props.visible && props.month)),
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false
})

const rawRows = computed(() => typeOfWorkQuery.data.value?.rows || [])
const total = computed(() => typeOfWorkQuery.data.value?.total || 0)
const loading = computed(() => typeOfWorkQuery.isLoading.value || typeOfWorkQuery.isFetching.value)
const error = computed(() => typeOfWorkQuery.error.value ? (typeOfWorkQuery.error.value.message || 'Ошибка загрузки') : null)

// Sort by amount descending
const sortedRows = computed(() => {
  const rows = [...rawRows.value]
  return rows.sort((a, b) => (b.amount || 0) - (a.amount || 0))
})

watch(() => props.visible, v => { if (v) typeOfWorkQuery.refetch() })
watch(() => props.month, () => { if (props.visible) typeOfWorkQuery.refetch() })
</script>

<style scoped>
.modal-row-type {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-type {
  width: 70%;
}

.col-amount {
  width: 30%;
}

@media (max-width: 767px) {
  .col-type {
    width: 60%;
  }
  .col-amount {
    width: 40%;
  }
}
</style>
