/**
 * Централизованный экспорт composables
 * @module composables
 */

// Async data loading
export { useAsyncData } from './useAsyncData'
export type { UseAsyncDataOptions, UseAsyncDataReturn } from './useAsyncData'

// Debounced search
export { useDebouncedSearch } from './useDebouncedSearch'
export type { UseDebouncedSearchOptions, UseDebouncedSearchReturn } from './useDebouncedSearch'

// Body class management
export { useBodyClass } from './useBodyClass'

// Mobile detection
export { useIsMobile } from './useIsMobile'
export type { UseIsMobileReturn } from './useIsMobile'

// Modal management
export { useModal } from './useModal'
export type { UseModalOptions, UseModalReturn } from './useModal'

// Theme management
export { usePreferredTheme } from './usePreferredTheme'
export type { UsePreferredThemeOptions, UsePreferredThemeReturn } from './usePreferredTheme'

// Query client (like TanStack Query lite)
export { useQueryClient, useQuery, useInvalidateQueries, installQueryClient } from './useQueryClient'
export type { QueryClientOptions, UseQueryOptions, UseQueryReturn } from './useQueryClient'

// Sorting
export { useSort } from './useSort'
export type { UseSortOptions, UseSortReturn, SortCompareFn } from './useSort'

// Smeta breakdown
export { useSmetaBreakdown, isVneregKey } from './useSmetaBreakdown'
export type { SmetaTotals, UseSmetaBreakdownReturn } from './useSmetaBreakdown'

// Title expansion (text clamping)
export { useTitleExpansion } from './useTitleExpansion'
export type { TitleItem, UseTitleExpansionReturn } from './useTitleExpansion'

// Calendar logic
export { useCalendar, WEEKDAYS } from './useCalendar'
export type { CalendarDay, UseCalendarOptions, UseCalendarReturn } from './useCalendar'

// Toast notifications
export { useToast, provideToast, toast } from './useToast'
export type { Toast, ToastType, ToastOptions, ToastContext } from './useToast'

// Error handling
export { useErrorHandler, handleError, clearErrors, withErrorHandling } from './useErrorHandler'
export type { AppError, ErrorHandlerOptions, UseErrorHandlerReturn } from './useErrorHandler'
