import { computed, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore, isVneregKey } from '../store/dashboardStore'
import type { SmetaDetailRow } from '@/types/dashboard'

// Re-export isVneregKey for backward compatibility
export { isVneregKey }

export interface SmetaTotals {
  plan: number
  fact: number
  delta: number
}

export interface UseSmetaBreakdownReturn {
  loading: ComputedRef<boolean>
  filteredRows: ComputedRef<SmetaDetailRow[]>
  totals: ComputedRef<SmetaTotals>
  smetaLabel: ComputedRef<string>
}

/**
 * Composable для работы с данными расшифровки сметы
 */
export function useSmetaBreakdown(
  smetaKeyRef: Ref<string> | ComputedRef<string>
): UseSmetaBreakdownReturn {
  const store = useDashboardStore()
  const { smetaDetailsLoading, smetaDetails, selectedSmetaLabel } = storeToRefs(store)

  const loading = computed(() => smetaDetailsLoading.value as boolean)

  /**
   * Отфильтрованные строки сметы:
   * - Для внерегламента Plan = 0
   * - Показываем только строки где plan > 1 или fact > 1
   */
  const filteredRows = computed<SmetaDetailRow[]>(() => {
    const key = smetaKeyRef.value
    const isVnereg = isVneregKey(key)
    const src = (smetaDetails.value || []) as SmetaDetailRow[]

    return src
      .map(r => {
        const plan = Number(r.plan || 0)
        const fact = Number(r.fact || 0)
        return {
          ...r,
          plan: isVnereg ? 0 : plan,
          fact
        }
      })
      .filter(r => (Number(r.plan || 0) > 1) || (Number(r.fact || 0) > 1))
  })

  /**
   * Итоги по План / Факт / Дельта
   */
  const totals = computed<SmetaTotals>(() => {
    const arr = filteredRows.value
    const plan = arr.reduce((s, r) => s + (Number(r.plan) || 0), 0)
    const fact = arr.reduce((s, r) => s + (Number(r.fact) || 0), 0)
    const delta = fact - plan
    return { plan, fact, delta }
  })

  /**
   * Человекочитаемое название сметы
   */
  const smetaLabel = computed(() => selectedSmetaLabel.value as string)

  return {
    loading,
    filteredRows,
    totals,
    smetaLabel
  }
}
