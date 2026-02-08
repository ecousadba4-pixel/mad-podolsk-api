/**
 * Store module exports
 * 
 * Модульная архитектура:
 * - dashboardUiStore: UI state (режим, выбранный месяц)
 * - monthlyStore: данные месячного дашборда (summary, months)
 * - dailyStore: данные дневного дашборда (daily rows, dates)
 * - smetaStore: данные смет (cards, details)
 * - authStore: аутентификация и управление пользователями
 * - resourcesStore: учет техники и людей
 * - mileageStore: пробег машин
 * - pricesStore: расценки
 * - roadSectionsStore: участки дороги
 * - helpers: общие утилиты и типы
 */

// UI state store
export { useDashboardUiStore } from './dashboardUiStore'
export type { DashboardMode } from './dashboardUiStore'

// Feature stores
export { useMonthlyStore } from './monthlyStore'
export { useDailyStore } from './dailyStore'
export { useSmetaStore, isVneregKey } from './smetaStore'
export { useAuthStore } from './authStore'
export { useResourcesStore } from './resourcesStore'
export { useMileageStore } from './mileageStore'
export { usePricesStore } from './pricesStore'
export { useRoadSectionsStore } from './roadSectionsStore'

// Shared helpers
export {
  fallbackMonths,
  normalizeSmetaCards,
  normalizeSmetaDetails,
  normalizeDailyRows,
  SMETA_LABELS
} from './helpers'

export type { NormalizedDailyRow, DailyData, SmetaDetailsWithTypesRow } from './helpers'
