<template>
  <Teleport to="body" v-if="visible">
    <div class="modal-backdrop visible" @click.self="$emit('close')">
      <div class="modal p-md" :class="{ 'is-mobile': isMobile }" role="dialog" aria-modal="true">
        <header class="modal-header items-center row-between">
          <h3 class="modal-title text-h2">Выручка по дням</h3>
          <button class="modal-close control-sm" @click="$emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div v-if="loading">Загрузка…</div>
          <div v-else-if="error" class="dashboard__state dashboard__state--error">Ошибка: {{ error }}</div>
          <table v-else class="smeta-breakdown-table modal-table" :class="{ 'is-mobile': isMobile }">
            <colgroup>
              <col class="col-date" />
              <col class="col-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>Дата</th>
                <th class="numeric">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rowsList" :key="r.date">
                <td class="modal-row-date">{{ formatDate(r.date) }}</td>
                <td class="numeric modal-row-value">{{ formatMoney(r.amount) }}</td>
              </tr>
              <tr v-if="rowsList.length === 0">
                <td colspan="2" class="muted">Нет данных за выбранный месяц</td>
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
import { useAsyncData } from '../../composables/useAsyncData.js'

const props = defineProps({ visible: Boolean, month: String })
const emit = defineEmits(['close'])

const { isMobile } = useIsMobile()

const { data: rows, loading, error, execute } = useAsyncData(async () => {
  if (!props.month) return []
  const api = await import('../../api/dashboard.js')
  const res = await api.getMonthlyDailyRevenue(props.month)
  return res.rows || []
}, { initialValue: [] })

const rowsList = computed(() => rows.value || [])

function formatDate(d){
  if (!d) return '-'
  // expected input: YYYY-MM-DD or ISO date string
  const s = String(d).slice(0,10)
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

watch(()=>props.visible, v=>{ if (v) execute().catch(()=>{}) })
watch(()=>props.month, (v)=>{ if (props.visible && v) execute().catch(()=>{}) })

function formatMoney(v){ if (v === null || v === undefined) return '-'; return Number(v).toLocaleString('ru-RU') }
</script>
