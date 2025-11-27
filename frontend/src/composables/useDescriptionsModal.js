import { storeToRefs } from 'pinia'
import { useDashboardUiStore } from '../store/dashboardUiStore.js'

export function useDescriptionsModal() {
  const uiStore = useDashboardUiStore()
  const { selectedDescription, isDescriptionModalOpen } = storeToRefs(uiStore)

  function open(description) {
    uiStore.setSelectedDescription(description)
    uiStore.openDescriptionModal()
  }

  function close() {
    uiStore.closeDescriptionModal()
  }

  return {
    selectedDescription,
    isDescriptionModalOpen,
    open,
    close,
  }
}
