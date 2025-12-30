<template>
  <Teleport to="body">
    <Transition name="calendar-fade">
      <div v-if="isOpen" class="calendar-overlay" @click.self="close">
        <div ref="dropdownRef" class="calendar-dropdown" :style="dropdownStyle">
          <!-- Header with navigation -->
          <CalendarHeader
            :label="monthYearLabel"
            :can-prev="canGoPrev"
            :can-next="canGoNext"
            @prev="prevMonth"
            @next="nextMonth"
          />
          
          <!-- Weekday labels -->
          <div class="calendar-weekdays">
            <span v-for="day in weekdays" :key="day" class="calendar-weekday">
              {{ day }}
            </span>
          </div>
          
          <!-- Calendar grid -->
          <div class="calendar-grid">
            <CalendarDayCell
              v-for="(day, index) in calendarDays"
              :key="index"
              :day="day"
              @select="selectDay"
            />
          </div>
          
          <!-- Footer with today button -->
          <div class="calendar-footer">
            <button type="button" class="calendar-today-btn" @click="goToToday">
              Сегодня
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, toRef } from 'vue'
import { useCalendar, WEEKDAYS, type CalendarDay } from '../../composables/useCalendar'
import CalendarHeader from './CalendarHeader.vue'
import CalendarDayCell from './CalendarDayCell.vue'

// ─────────────────────────────────────────────────────────────────────────────
// Props & Emits
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isOpen?: boolean
  modelValue?: string
  minDate?: string
  maxDate?: string
  anchorRect?: { top: number; left: number; bottom: number; width: number; height: number } | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  modelValue: '',
  minDate: '',
  maxDate: '',
  anchorRect: null
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'update:modelValue': [value: string]
  select: [value: string]
}>()

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Logic (composable)
// ─────────────────────────────────────────────────────────────────────────────

const {
  monthYearLabel,
  calendarDays,
  canGoPrev,
  canGoNext,
  prevMonth,
  nextMonth,
  goToDate,
  formatDateISO,
  isDateDisabled
} = useCalendar({
  modelValue: toRef(props, 'modelValue'),
  minDate: toRef(props, 'minDate'),
  maxDate: toRef(props, 'maxDate')
})

const weekdays = WEEKDAYS

// ─────────────────────────────────────────────────────────────────────────────
// Positioning
// ─────────────────────────────────────────────────────────────────────────────

const DROPDOWN_WIDTH = 320

const dropdownStyle = computed(() => {
  if (!props.anchorRect) return {}
  
  const { bottom, left, width } = props.anchorRect
  const padding = 16
  
  // Center dropdown under trigger
  let leftPos = left + (width / 2) - (DROPDOWN_WIDTH / 2)
  
  // Keep within viewport
  const maxLeft = window.innerWidth - DROPDOWN_WIDTH - padding
  leftPos = Math.max(padding, Math.min(leftPos, maxLeft))
  
  return {
    position: 'fixed' as const,
    top: `${bottom + 8}px`,
    left: `${leftPos}px`,
    width: `${DROPDOWN_WIDTH}px`
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

function selectDay(day: CalendarDay): void {
  if (day.disabled) return
  emit('update:modelValue', day.dateStr)
  emit('select', day.dateStr)
  close()
}

function goToToday(): void {
  const today = new Date()
  const todayStr = formatDateISO(today)
  
  if (!isDateDisabled(today)) {
    goToDate(today)
    emit('update:modelValue', todayStr)
    emit('select', todayStr)
    close()
  } else {
    // Just navigate to today's month
    goToDate(today)
  }
}

function close(): void {
  emit('update:isOpen', false)
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard handling
// ─────────────────────────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.calendar-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.15);
  backdrop-filter: blur(2px);
}

.calendar-dropdown {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-strong);
  padding: var(--gap-md);
  z-index: 10000;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: var(--gap-sm);
}

.calendar-weekday {
  font-family: var(--font-sans);
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  padding: var(--gap-xs) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-footer {
  display: flex;
  justify-content: center;
  margin-top: var(--gap-md);
  padding-top: var(--gap-sm);
  border-top: 1px solid var(--border-soft);
}

.calendar-today-btn {
  font-family: var(--font-sans);
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--accent);
  background: transparent;
  border: none;
  padding: var(--gap-sm) var(--gap-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.15s ease;
  
  &:hover {
    background: var(--surface-highlight);
  }
}

// Transition
.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: opacity 0.2s ease;
  
  .calendar-dropdown {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.calendar-fade-enter-from,
.calendar-fade-leave-to {
  opacity: 0;
  
  .calendar-dropdown {
    transform: translateY(-8px);
    opacity: 0;
  }
}
</style>
