import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardUiStore } from '../store/dashboardUiStore.js'
import { useDashboardDataStore } from '../store/dashboardDataStore.js'

export function useSmetaSelection() {
  const uiStore = useDashboardUiStore()
  const dataStore = useDashboardDataStore()
  const { selectedSmeta, selectedMonth } = storeToRefs(uiStore)
  const { smetaCards, smetaDetails, smetaDetailsLoading } = storeToRefs(dataStore)

  const selectedSmetaLabel = computed(() => {
    const key = selectedSmeta.value
    if (!key) return ''
    const found = (smetaCards.value || []).find(s => s.smeta_key === key)
    const name = found ? found.label : key
    return name
  })

  const selectedSmetaDesktopTitle = computed(() => {
    const name = selectedSmetaLabel.value
    return name ? `Расшифровка работ по смете «${name}»` : 'Расшифровка работ по смете'
  })

  function selectSmeta(key) {
    uiStore.setSelectedSmeta(key)
  }

  async function ensureDetailsLoaded(key) {
    if (key) uiStore.setSelectedSmeta(key)
    return dataStore.refetchSmetaDetails()
  }

  return {
    selectedSmeta,
    selectedMonth,
    selectedSmetaLabel,
    selectedSmetaDesktopTitle,
    smetaDetails,
    smetaDetailsLoading,
    selectSmeta,
    ensureDetailsLoaded,
  }
}
