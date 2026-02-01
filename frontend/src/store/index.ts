/**
 * Store module exports
 * 
 * Модульная архитектура:
 * - dashboardStore: главный координатор (обратная совместимость)
 * - monthlyStore: данные месячного дашборда
 * - dailyStore: данные дневного дашборда  
 * - smetaStore: данные смет
 * - authStore: аутентификация и управление пользователями
 * - helpers: общие утилиты и типы
 */

// Main store (backward compatible API)
export { useDashboardStore, isVneregKey } from './dashboardStore'
export type { DashboardMode, NormalizedDailyRow, DailyData, SmetaDetailsWithTypesRow } from './dashboardStore'

// Feature stores (for direct access when needed)
export { useMonthlyStore } from './monthlyStore'
export { useDailyStore } from './dailyStore'
export { useSmetaStore } from './smetaStore'
export { useAuthStore } from './authStore'

// Shared helpers
export {
  fallbackMonths,
  normalizeSmetaCards,
  normalizeSmetaDetails,
  normalizeDailyRows,
  SMETA_LABELS
} from './helpers'
