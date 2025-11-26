<template>
  <Teleport to="body" v-if="visible">
    <div class="modal-backdrop visible" @click.self="$emit('close')">
      <div class="modal p-md" :class="{ 'is-mobile': isMobile }" role="dialog" aria-modal="true">
        <header class="modal-header items-center row-between">
          <h3 class="modal-title text-h2">Расшифровка — {{ description }}</h3>
          <button class="modal-close control-sm" @click="$emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div v-if="loading">Загрузка…</div>
          <table v-else class="smeta-breakdown-table modal-table" :class="{ 'is-mobile': isMobile }">
            <thead>
              <tr>
                <th>Дата</th>
                <th class="numeric">Объём</th>
                <th class="numeric">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rowsList" :key="r.date">
                <td class="modal-row-date">{{ formatDate(r.date) }}</td>
                <td class="numeric">{{ r.volume }} <span class="modal-value-unit">{{ r.unit }}</span></td>
                <td class="numeric modal-row-value">{{ formatMoney(r.amount) }}</td>
              </tr>
              <tr v-if="rowsList.length === 0">
                <td colspan="3" class="muted">Нет данных за выбранный период</td>
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

const props = defineProps({ visible: Boolean, month: String, smeta_key: String, description: String })
const emit = defineEmits(['close'])

const { isMobile } = useIsMobile()

const { data: rows, loading, execute } = useAsyncData(async () => {
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
}, { initialValue: [] })

const rowsList = computed(() => rows.value || [])

function formatDate(d){
  if (!d) return '-'
  const s = String(d).slice(0,10)
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

watch(()=>props.visible, v=>{ if (v) execute().catch(()=>{}) })
watch(() => [props.month, props.smeta_key, props.description], () => {
  if (props.visible) execute().catch(()=>{})
})

function formatMoney(v){
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}
</script>
