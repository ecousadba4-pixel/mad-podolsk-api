/**
 * Smeta Store - управление данными смет
 * 
 * Отвечает за:
 * - Сметные карточки (cards)
 * - Детали смет (details)
 * - Детали с группировкой по типам работ
 * - Выбор текущей сметы и описания
 */

import { computed, ref, watch, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useInvalidateQueries } from '../composables/useQueryClient'
import { getBySmeta, getSmetaDetails, getSmetaDetailsWithTypes } from '../api/dashboard'
import type { SmetaCard, SmetaDetailRow } from '@/types/dashboard'
import {
  normalizeSmetaCards,
  normalizeSmetaDetails,
  isVneregKey,
  SMETA_LABELS,
  type SmetaDetailsWithTypesRow
} from './helpers'
import { useDashboardUiStore } from './dashboardUiStore'

export const useSmetaStore = defineStore('smeta', () => {
  const invalidateQueries = useInvalidateQueries()
  const uiStore = useDashboardUiStore()

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const selectedSmeta: Ref<string | null> = ref(null)
  const selectedDescription: Ref<string | null> = ref(null)
  const selectedDescriptionId: Ref<string | null> = ref(null)

  // --------------------------------------------------------------------------
  // QUERIES (use selectedMonth from UI store)
  // --------------------------------------------------------------------------
  
  const smetaCardsQuery = useQuery<SmetaCard[]>({
    queryKey: () => ['smeta-cards', uiStore.selectedMonth],
    queryFn: async () => {
      const res = await getBySmeta(uiStore.selectedMonth)
      const raw = res?.cards || []
      return normalizeSmetaCards(raw)
    },
    enabled: computed(() => Boolean(uiStore.selectedMonth)),
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  const smetaDetailsQuery = useQuery<SmetaDetailRow[]>({
    queryKey: () => ['smeta-details', uiStore.selectedMonth, selectedSmeta.value ?? ''],
    queryFn: async () => {
      if (!selectedSmeta.value) return []
      const res = await getSmetaDetails(uiStore.selectedMonth, selectedSmeta.value)
      const raw = res?.rows || []
      return normalizeSmetaDetails(raw)
    },
    enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(uiStore.selectedMonth)),
    staleTime: 2 * 60 * 1000
  })

  const smetaDetailsWithTypesQuery = useQuery<SmetaDetailsWithTypesRow[] | null>({
    queryKey: () => ['smeta-details-with-types', uiStore.selectedMonth, selectedSmeta.value ?? ''],
    queryFn: async () => {
      if (!selectedSmeta.value) return null
      const res = await getSmetaDetailsWithTypes(uiStore.selectedMonth, selectedSmeta.value)
      
      // API returns flat rows with all calculated fields (delta, progress_percent)
      if (!res?.rows || !Array.isArray(res.rows)) return null
      
      const resultRows: SmetaDetailsWithTypesRow[] = res.rows.map(r => ({
        type_of_work: r.type_of_work || null,
        description: r.description || r.title || '',
        description_id: r.description_id || '',
        plan: Number(r.plan || 0),
        fact: Number(r.fact || 0),
        delta: Number(r.delta || 0)
      }))
      
      return resultRows.length ? resultRows : null
    },
    enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(uiStore.selectedMonth)),
    staleTime: 2 * 60 * 1000
  })

  // --------------------------------------------------------------------------
  // WATCHERS
  // --------------------------------------------------------------------------

  // Auto-select first smeta when cards change
  watch(() => smetaCardsQuery.data.value, (cards) => {
    const list = cards || []
    const hasSelected = list.some(c => c && c.smeta_key === selectedSmeta.value)
    if (!hasSelected) {
      const first = list[0]
      selectedSmeta.value = first ? first.smeta_key : null
    }
  }, { immediate: true })

  // Clear description when month changes
  watch(() => uiStore.selectedMonth, () => {
    clearDescription()
    invalidateSmetaDetails()
  })

  // --------------------------------------------------------------------------
  // COMPUTED GETTERS
  // --------------------------------------------------------------------------
  
  const smetaCards = computed(() => smetaCardsQuery.data.value || [])
  const smetaCardsLoading = computed(() => smetaCardsQuery.isLoading.value || smetaCardsQuery.isFetching.value)
  const smetaDetails = computed(() => smetaDetailsQuery.data.value || [])
  const smetaDetailsLoading = computed(() => smetaDetailsQuery.isLoading.value || smetaDetailsQuery.isFetching.value)
  const smetaDetailsWithTypes = computed(() => smetaDetailsWithTypesQuery.data.value || null)
  const smetaDetailsWithTypesLoading = computed(() => smetaDetailsWithTypesQuery.isLoading.value || smetaDetailsWithTypesQuery.isFetching.value)

  // Check if selected smeta is vnereg type
  const isSelectedSmetaVnereg = computed(() => isVneregKey(selectedSmeta.value))

  // Default sort key based on smeta type (plan for regular, fact for vnereg)
  const defaultSmetaSortKey = computed(() => isSelectedSmetaVnereg.value ? 'fact' : 'plan')

  // Centralized smeta label
  const selectedSmetaLabel = computed(() => getSmetaLabel(selectedSmeta.value, smetaCards.value))

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  
  function setSelectedSmeta(key: string | null): void {
    selectedSmeta.value = key
  }

  function setSelectedDescription(desc: string | null, descId: string | null = null): void {
    selectedDescription.value = desc
    selectedDescriptionId.value = descId
  }

  function clearDescription(): void {
    selectedDescription.value = null
    selectedDescriptionId.value = null
  }

  function invalidateSmetaDetails(): void {
    invalidateQueries(['smeta-details'])
  }

  /**
   * Получает человекочитаемое название сметы
   */
  function getSmetaLabel(key: string | null, cards: SmetaCard[] = []): string {
    if (!key) return ''
    if (SMETA_LABELS[key]) return SMETA_LABELS[key]
    const found = cards.find(c => c.smeta_key === key)
    return found?.label || key
  }

  const fetchSmetaCards = () => smetaCardsQuery.refetch()
  const fetchSmetaDetails = (key?: string) => {
    if (key) selectedSmeta.value = key
    return smetaDetailsQuery.refetch()
  }

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    // State
    selectedSmeta,
    selectedDescription,
    selectedDescriptionId,
    
    // Computed
    smetaCards,
    smetaCardsLoading,
    smetaDetails,
    smetaDetailsLoading,
    smetaDetailsWithTypes,
    smetaDetailsWithTypesLoading,
    isSelectedSmetaVnereg,
    defaultSmetaSortKey,
    selectedSmetaLabel,
    
    // Actions
    setSelectedSmeta,
    setSelectedDescription,
    clearDescription,
    invalidateSmetaDetails,
    getSmetaLabel,
    fetchSmetaCards,
    fetchSmetaDetails
  }
})

// Re-export utility function
export { isVneregKey }
