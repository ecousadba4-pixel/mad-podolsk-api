<template>
    <div v-if="visible" class="modal-backdrop visible" @click.self="$emit('close')">
    <div class="modal p-md" role="dialog" aria-modal="true">
      <header class="modal-header items-center row-between">
        <h3 class="modal-title text-h2">Расшифровка — {{ description }}</h3>
        <button class="modal-close control-sm" @click="$emit('close')">✕</button>
      </header>

      <div class="modal-body">
        <div v-if="loading">Загрузка…</div>
        <table v-else class="smeta-breakdown-table modal-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th class="numeric">Объём</th>
              <th class="numeric">Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.date">
              <td class="modal-row-date">{{ formatDate(r.date) }}</td>
              <td class="numeric">{{ r.volume }} <span class="modal-value-unit">{{ r.unit }}</span></td>
              <td class="numeric modal-row-value">{{ formatMoney(r.amount) }}</td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="3" class="muted">Нет данных за выбранный период</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ visible: Boolean, month: String, smeta_key: String, description: String })
const emit = defineEmits(['close'])

const rows = ref([])
const loading = ref(false)

function formatDate(d){
  if (!d) return '-'
  const s = String(d).slice(0,10)
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

async function load(){
  if (!props.month || !props.smeta_key || !props.description) return
  loading.value = true
  try{
    const api = await import('../../api/dashboard.js')
    const res = await api.getSmetaDescriptionDaily(props.month, props.smeta_key, props.description)
    rows.value = res.rows || []
  }catch(err){
    // fallback via api helper (use getSmetaDetails then transform) — but keep simple
    const api2 = await import('../../api/dashboard.js')
    const r = await api2.getSmetaDetails(props.month, props.smeta_key)
    rows.value = (r && r.rows) || []
  }finally{ loading.value = false }
}

watch(()=>props.visible, v=>{ if (v) load() })

function formatMoney(v){ if (v === null || v === undefined) return '-'; const n = Number(v); if (Number.isNaN(n)) return '-'; return n.toLocaleString('ru-RU', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) }
</script>
