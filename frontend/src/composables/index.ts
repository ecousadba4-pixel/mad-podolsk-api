/**
 * Централизованный экспорт composables
 * @module composables
 */

// TypeScript версии (предпочтительно)
export { useAsyncData } from './useAsyncData'
export type { UseAsyncDataOptions, UseAsyncDataReturn } from './useAsyncData'

export { useBodyClass } from './useBodyClass'

export { useIsMobile } from './useIsMobile'
export type { UseIsMobileReturn } from './useIsMobile'

export { useModal } from './useModal'
export type { UseModalOptions, UseModalReturn } from './useModal'

export { usePreferredTheme } from './usePreferredTheme'
export type { UsePreferredThemeOptions, UsePreferredThemeReturn } from './usePreferredTheme'

export { useSort } from './useSort'
export type { UseSortOptions, UseSortReturn, SortCompareFn } from './useSort'

// JS версии (для обратной совместимости, пока не мигрированы)
// @ts-expect-error - JS modules without declarations
export { useQueryClient, useQuery, useInvalidateQueries, installQueryClient } from './useQueryClient.js'
// @ts-expect-error - JS modules without declarations
export { useSmetaBreakdown, isVneregKey } from './useSmetaBreakdown.js'
// @ts-expect-error - JS modules without declarations
export { useTitleExpansion } from './useTitleExpansion.js'
