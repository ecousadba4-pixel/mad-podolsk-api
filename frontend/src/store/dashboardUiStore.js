import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function normalizeMonth(value) {
  if (!value) return null
  return String(value).slice(0, 7)
}

function normalizeDate(value) {
  if (!value) return null
  return String(value).slice(0, 10)
}

export const useDashboardUiStore = defineStore('dashboard-ui', () => {
  const router = useRouter()
  const route = useRoute()

  const mode = ref(route.name === 'daily' ? 'daily' : 'monthly')
  const selectedMonth = ref(normalizeMonth(route.query.month) || new Date().toISOString().slice(0, 7))
  const selectedDate = ref(normalizeDate(route.query.date) || new Date().toISOString().slice(0, 10))
  const selectedSmeta = ref(route.params.smetaKey || route.query.smeta || null)
  const selectedDescription = ref(route.query.description || null)

  const isDailyModalOpen = ref(false)
  const isDescriptionModalOpen = ref(false)

  const routeBase = computed(() => {
    if (mode.value === 'daily') return { name: 'daily' }
    if (route.name === 'smeta') return { name: 'smeta', params: { smetaKey: selectedSmeta.value || undefined } }
    return { name: 'monthly' }
  })

  function updateQuery(newQuery) {
    router.replace({
      ...routeBase.value,
      query: {
        ...route.query,
        ...newQuery,
      },
    }).catch(() => {})
  }

  watch(() => route.query.month, (val) => {
    const normalized = normalizeMonth(val)
    if (normalized && normalized !== selectedMonth.value) selectedMonth.value = normalized
  }, { immediate: true })

  watch(() => route.query.date, (val) => {
    const normalized = normalizeDate(val)
    if (normalized && normalized !== selectedDate.value) selectedDate.value = normalized
  }, { immediate: true })

  watch(() => route.query.smeta || route.params.smetaKey, (val) => {
    if (val && val !== selectedSmeta.value) selectedSmeta.value = val
  }, { immediate: true })

  watch(() => route.name, (name) => {
    mode.value = name === 'daily' ? 'daily' : 'monthly'
  }, { immediate: true })

  watch(selectedMonth, (value) => {
    if (value) updateQuery({ month: value })
  })

  watch(selectedDate, (value) => {
    if (value) updateQuery({ date: value })
  })

  watch(selectedSmeta, (value) => {
    updateQuery({ smeta: value || undefined })
  })

  function setMode(value) {
    mode.value = value
    if (value === 'daily') router.push({ name: 'daily', query: { ...route.query, date: selectedDate.value } }).catch(() => {})
    else router.push({ name: 'monthly', query: { ...route.query, month: selectedMonth.value } }).catch(() => {})
  }

  function setSelectedMonth(month) {
    if (month) selectedMonth.value = normalizeMonth(month)
  }

  function setSelectedDate(date) {
    if (date) selectedDate.value = normalizeDate(date)
  }

  function setSelectedSmeta(key) {
    selectedSmeta.value = key
  }

  function setSelectedDescription(description) {
    selectedDescription.value = description
  }

  function openDailyModal() { isDailyModalOpen.value = true }
  function closeDailyModal() { isDailyModalOpen.value = false }
  function openDescriptionModal() { isDescriptionModalOpen.value = true }
  function closeDescriptionModal() { isDescriptionModalOpen.value = false }

  return {
    mode,
    selectedMonth,
    selectedDate,
    selectedSmeta,
    selectedDescription,
    isDailyModalOpen,
    isDescriptionModalOpen,
    setMode,
    setSelectedMonth,
    setSelectedDate,
    setSelectedSmeta,
    setSelectedDescription,
    openDailyModal,
    closeDailyModal,
    openDescriptionModal,
    closeDescriptionModal,
  }
})
