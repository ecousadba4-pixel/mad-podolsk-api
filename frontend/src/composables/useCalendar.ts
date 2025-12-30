import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarDay {
  /** Day of month (1-31) */
  date: number
  /** ISO date string YYYY-MM-DD */
  dateStr: string
  /** Is this day in the currently viewed month */
  currentMonth: boolean
  /** Is this today */
  isToday: boolean
  /** Is this the selected date */
  isSelected: boolean
  /** Is this day disabled (out of min/max range) */
  disabled: boolean
}

export interface UseCalendarOptions {
  /** Initial selected date (ISO string YYYY-MM-DD) */
  modelValue?: Ref<string>
  /** Minimum allowed date (ISO string) */
  minDate?: Ref<string>
  /** Maximum allowed date (ISO string) */
  maxDate?: Ref<string>
}

export interface UseCalendarReturn {
  /** Current view date (for navigation) */
  viewDate: Ref<Date>
  /** Formatted month/year label */
  monthYearLabel: ComputedRef<string>
  /** Array of 42 calendar days (6 weeks) */
  calendarDays: ComputedRef<CalendarDay[]>
  /** Can navigate to previous month */
  canGoPrev: ComputedRef<boolean>
  /** Can navigate to next month */
  canGoNext: ComputedRef<boolean>
  /** Navigate to previous month */
  prevMonth: () => void
  /** Navigate to next month */
  nextMonth: () => void
  /** Navigate to specific date */
  goToDate: (date: Date) => void
  /** Format date to ISO string */
  formatDateISO: (date: Date) => string
  /** Check if date is disabled */
  isDateDisabled: (date: Date) => boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Russian month names */
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
] as const

/** Russian weekday abbreviations (Monday first) */
export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

/** Total cells in calendar grid (6 rows × 7 days) */
const CALENDAR_CELLS = 42

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────

export function useCalendar(options: UseCalendarOptions = {}): UseCalendarReturn {
  const { modelValue, minDate, maxDate } = options

  // Current view month/year
  const viewDate = ref(new Date())

  // Sync view date with modelValue
  if (modelValue) {
    watch(modelValue, (val) => {
      if (val) {
        viewDate.value = new Date(val)
      }
    }, { immediate: true })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  function formatDateISO(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function isDateDisabled(date: Date): boolean {
    const minDateObj = parseDate(minDate?.value)
    const maxDateObj = parseDate(maxDate?.value)
    
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    
    if (minDateObj && normalized < minDateObj) return true
    if (maxDateObj && normalized > maxDateObj) return true
    return false
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────────────────────────────────────

  const monthYearLabel = computed(() => {
    const month = MONTH_NAMES[viewDate.value.getMonth()]
    const year = viewDate.value.getFullYear()
    return `${month} ${year}`
  })

  const calendarDays = computed((): CalendarDay[] => {
    const year = viewDate.value.getFullYear()
    const month = viewDate.value.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Get day of week for first day (convert Sunday=0 to Monday=0 format)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6
    
    const days: CalendarDay[] = []
    
    // Today for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()
    
    // Selected date for comparison
    const selectedDateStr = modelValue?.value ?? ''
    
    // Helper to create day object
    const createDay = (
      date: number,
      dateObj: Date,
      currentMonth: boolean
    ): CalendarDay => {
      const dateStr = formatDateISO(dateObj)
      dateObj.setHours(0, 0, 0, 0)
      return {
        date,
        dateStr,
        currentMonth,
        isToday: currentMonth && dateObj.getTime() === todayTime,
        isSelected: dateStr === selectedDateStr,
        disabled: isDateDisabled(dateObj)
      }
    }
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0)
    const prevMonthDays = prevMonthLastDay.getDate()
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthDays - i
      const dateObj = new Date(year, month - 1, date)
      days.push(createDay(date, dateObj, false))
    }
    
    // Current month days
    const daysInMonth = lastDay.getDate()
    for (let date = 1; date <= daysInMonth; date++) {
      const dateObj = new Date(year, month, date)
      days.push(createDay(date, dateObj, true))
    }
    
    // Next month days (fill to 42 cells)
    const remaining = CALENDAR_CELLS - days.length
    for (let date = 1; date <= remaining; date++) {
      const dateObj = new Date(year, month + 1, date)
      days.push(createDay(date, dateObj, false))
    }
    
    return days
  })

  const canGoPrev = computed(() => {
    if (!minDate?.value) return true
    const minDateObj = parseDate(minDate.value)
    if (!minDateObj) return true
    
    const prevMonthEnd = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), 0)
    return prevMonthEnd >= minDateObj
  })

  const canGoNext = computed(() => {
    if (!maxDate?.value) return true
    const maxDateObj = parseDate(maxDate.value)
    if (!maxDateObj) return true
    
    const nextMonthStart = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
    return nextMonthStart <= maxDateObj
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  function prevMonth(): void {
    viewDate.value = new Date(
      viewDate.value.getFullYear(),
      viewDate.value.getMonth() - 1,
      1
    )
  }

  function nextMonth(): void {
    viewDate.value = new Date(
      viewDate.value.getFullYear(),
      viewDate.value.getMonth() + 1,
      1
    )
  }

  function goToDate(date: Date): void {
    viewDate.value = new Date(date.getFullYear(), date.getMonth(), 1)
  }

  return {
    viewDate,
    monthYearLabel,
    calendarDays,
    canGoPrev,
    canGoNext,
    prevMonth,
    nextMonth,
    goToDate,
    formatDateISO,
    isDateDisabled
  }
}
