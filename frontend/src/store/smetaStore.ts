/**
 * Smeta Store - управление данными смет
 * 
 * Отвечает за:
 * - Сметные карточки (cards)
 * - Детали смет (details)
 * - Детали с группировкой по типам работ
 * - Выбор текущей сметы и описания
 */

import { computed, ref, type Ref } from 'vue'
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

export const useSmetaStore = defineStore('smeta', () => {
  const invalidateQueries = useInvalidateQueries()

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const selectedSmeta: Ref<string | null> = ref(null)
  const selectedDescription: Ref<string | null> = ref(null)
  const selectedDescriptionId: Ref<string | null> = ref(null)

  // --------------------------------------------------------------------------
  // QUERY FACTORIES
  // --------------------------------------------------------------------------
  
  function createSmetaCardsQuery(selectedMonth: () => string) {
    return useQuery<SmetaCard[]>({
      queryKey: () => ['smeta-cards', selectedMonth()],
      queryFn: async () => {
        const res = await getBySmeta(selectedMonth())
        const raw = res?.cards || []
        return normalizeSmetaCards(raw)
      },
      enabled: computed(() => Boolean(selectedMonth())),
      staleTime: 3 * 60 * 1000,
      refetchOnWindowFocus: true
    })
  }

  function createSmetaDetailsQuery(selectedMonth: () => string) {
    return useQuery<SmetaDetailRow[]>({
      queryKey: () => ['smeta-details', selectedMonth(), selectedSmeta.value ?? ''],
      queryFn: async () => {
        if (!selectedSmeta.value) return []
        const res = await getSmetaDetails(selectedMonth(), selectedSmeta.value)
        const raw = res?.rows || []
        return normalizeSmetaDetails(raw)
      },
      enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(selectedMonth())),
      staleTime: 2 * 60 * 1000
    })
  }

  function createSmetaDetailsWithTypesQuery(selectedMonth: () => string) {
    return useQuery<SmetaDetailsWithTypesRow[] | null>({
      queryKey: () => ['smeta-details-with-types', selectedMonth(), selectedSmeta.value ?? ''],
      queryFn: async () => {
        if (!selectedSmeta.value) return null
        const res = await getSmetaDetailsWithTypes(selectedMonth(), selectedSmeta.value)
        
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
      enabled: computed(() => Boolean(selectedSmeta.value) && Boolean(selectedMonth())),
      staleTime: 2 * 60 * 1000
    })
  }

  // --------------------------------------------------------------------------
  // COMPUTED GETTERS
  // --------------------------------------------------------------------------
  
  // Check if selected smeta is vnereg type
  const isSelectedSmetaVnereg = computed(() => isVneregKey(selectedSmeta.value))

  // Default sort key based on smeta type (plan for regular, fact for vnereg)
  const defaultSmetaSortKey = computed(() => isSelectedSmetaVnereg.value ? 'fact' : 'plan')

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

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------
  return {
    // State
    selectedSmeta,
    selectedDescription,
    selectedDescriptionId,
    
    // Query factories
    createSmetaCardsQuery,
    createSmetaDetailsQuery,
    createSmetaDetailsWithTypesQuery,
    
    // Computed
    isSelectedSmetaVnereg,
    defaultSmetaSortKey,
    
    // Actions
    setSelectedSmeta,
    setSelectedDescription,
    clearDescription,
    invalidateSmetaDetails,
    getSmetaLabel
  }
})

// Re-export utility function
export { isVneregKey }
