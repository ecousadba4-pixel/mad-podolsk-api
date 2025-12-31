/**
 * Общие хелперы для store модулей
 */

import type { SmetaCard, SmetaDetailRow } from '@/types/dashboard'

// ============================================================================
// TYPES (shared across stores)
// ============================================================================

export interface NormalizedDailyRow {
  date: string
  name: string
  unit: string
  volume: string
  amount: number
}

export interface DailyData {
  rows: NormalizedDailyRow[]
  total: number
  date: string
}

export interface SmetaDetailsWithTypesRow {
  type_of_work: string | null
  description: string
  description_id: string
  plan: number
  fact: number
  delta: number
}

export interface RawSmetaDetailRow {
  title?: string
  description?: string
  description_id?: string
  work_name?: string
  name?: string
  plan?: number
  fact?: number
  delta?: number
  progress_percent?: number
  progressPercent?: number
  type_of_work?: string | null
}

export interface RawDailyRow {
  description?: string
  name?: string
  work_name?: string
  unit?: string
  volume?: number | string
  amount?: number | string
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Маппинг ключей смет на человекочитаемые названия
 */
export const SMETA_LABELS: Record<string, string> = {
  leto: 'Лето',
  zima: 'Зима',
  vnereg: 'Внерегламент',
  vner1: 'Внерегламент',
  vner2: 'Внерегламент',
  vnereglement: 'Внерегламент'
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Генерирует fallback список месяцев (последние 6 месяцев)
 */
export function fallbackMonths(): string[] {
  const list: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(d.toISOString().slice(0, 7))
  }
  return list
}

/**
 * Проверяет, является ли ключ сметы "внерегламентом"
 */
export function isVneregKey(key: string | null | undefined): boolean {
  if (!key) return false
  const k = String(key).toLowerCase()
  return k.includes('vne') || k === 'vnereg' || k === 'vner1' || k === 'vner2' || k === 'vnereglement'
}

/**
 * Нормализует данные сметных карточек.
 * API уже возвращает все вычисленные поля (delta, progress_percent).
 * Здесь только сортировка и маппинг snake_case -> camelCase.
 */
export function normalizeSmetaCards(raw: SmetaCard[]): SmetaCard[] {
  const mapped = raw.map(c => ({
    ...c,
    // API возвращает progress_percent, маппим в progressPercent для совместимости
    progressPercent: (c as unknown as { progress_percent?: number }).progress_percent ?? c.progressPercent ?? 0
  }))
  // Сортировка по факту (убывание)
  mapped.sort((a, b) => (Number(b.fact) || 0) - (Number(a.fact) || 0))
  return mapped
}

/**
 * Нормализует данные деталей сметы.
 * API уже возвращает все вычисленные поля (delta, progress_percent).
 * Здесь только маппинг названий полей для совместимости.
 */
export function normalizeSmetaDetails(raw: RawSmetaDetailRow[]): SmetaDetailRow[] {
  return raw.map(r => ({
    title: r.title || r.description || r.work_name || r.name || '',
    description: r.description,
    description_id: r.description_id,
    plan: Number(r.plan ?? 0),
    fact: Number(r.fact ?? 0),
    delta: Number(r.delta ?? 0),
    progressPercent: r.progress_percent ?? r.progressPercent ?? 0,
    type_of_work: r.type_of_work
  }))
}

/**
 * Нормализует данные дневной таблицы
 */
export function normalizeDailyRows(rawRows: RawDailyRow[], dateValue: string): NormalizedDailyRow[] {
  return rawRows.map(r => {
    const unit = r.unit || ''
    const volumeNumber = Number(r.volume || 0)
    const amount = Number(r.amount || 0)
    return {
      date: dateValue,
      name: r.description || r.name || r.work_name || '',
      unit,
      volume: `${volumeNumber}${unit ? ` (${unit})` : ''}`,
      amount
    }
  })
}
