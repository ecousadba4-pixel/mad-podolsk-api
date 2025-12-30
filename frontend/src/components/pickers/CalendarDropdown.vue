<template>
  <Teleport to="body">
    <Transition name="calendar-fade">
      <div v-if="isOpen" class="calendar-overlay" @click.self="close">
        <div 
          class="calendar-dropdown" 
          ref="dropdownRef"
          :style="dropdownStyle"
        >
          <div class="calendar-header">
            <button 
              type="button" 
              class="calendar-nav calendar-nav--prev" 
              @click="prevMonth"
              :disabled="!canGoPrev"
              aria-label="Предыдущий месяц"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="calendar-title">{{ monthYearLabel }}</span>
            <button 
              type="button" 
              class="calendar-nav calendar-nav--next" 
              @click="nextMonth"
              :disabled="!canGoNext"
              aria-label="Следующий месяц"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div class="calendar-weekdays">
            <span v-for="day in weekdays" :key="day" class="calendar-weekday">{{ day }}</span>
          </div>
          
          <div class="calendar-grid">
            <button
              v-for="(day, index) in calendarDays"
              :key="index"
              type="button"
              class="calendar-day"
              :class="{
                'calendar-day--other-month': !day.currentMonth,
                'calendar-day--today': day.isToday,
                'calendar-day--selected': day.isSelected,
                'calendar-day--disabled': day.disabled
              }"
              :disabled="day.disabled"
              @click="selectDay(day)"
            >
              {{ day.date }}
            </button>
          </div>
          
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

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
  minDate: { type: String, default: '' },
  maxDate: { type: String, default: '' },
  anchorRect: { type: Object, default: null }
})

const emit = defineEmits(['update:isOpen', 'update:modelValue', 'select'])

const dropdownRef = ref(null)

// Current view month/year
const viewDate = ref(new Date())

// Initialize view date from modelValue
watch(() => props.modelValue, (val) => {
  if (val) {
    viewDate.value = new Date(val)
  }
}, { immediate: true })

// Russian weekday abbreviations starting from Monday
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthYearLabel = computed(() => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return `${months[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get day of week for first day (0 = Sunday, convert to Monday = 0)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6
  
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const selectedDateStr = props.modelValue
  const minDateObj = props.minDate ? new Date(props.minDate) : null
  const maxDateObj = props.maxDate ? new Date(props.maxDate) : null
  
  if (minDateObj) minDateObj.setHours(0, 0, 0, 0)
  if (maxDateObj) maxDateObj.setHours(0, 0, 0, 0)
  
  // Previous month days
  const prevMonth = new Date(year, month, 0)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonth.getDate() - i
    const dateObj = new Date(year, month - 1, date)
    const dateStr = formatDateISO(dateObj)
    days.push({
      date,
      dateStr,
      currentMonth: false,
      isToday: false,
      isSelected: dateStr === selectedDateStr,
      disabled: isDateDisabled(dateObj, minDateObj, maxDateObj)
    })
  }
  
  // Current month days
  for (let date = 1; date <= lastDay.getDate(); date++) {
    const dateObj = new Date(year, month, date)
    const dateStr = formatDateISO(dateObj)
    dateObj.setHours(0, 0, 0, 0)
    days.push({
      date,
      dateStr,
      currentMonth: true,
      isToday: dateObj.getTime() === today.getTime(),
      isSelected: dateStr === selectedDateStr,
      disabled: isDateDisabled(dateObj, minDateObj, maxDateObj)
    })
  }
  
  // Next month days (fill to 42 cells = 6 rows)
  const remaining = 42 - days.length
  for (let date = 1; date <= remaining; date++) {
    const dateObj = new Date(year, month + 1, date)
    const dateStr = formatDateISO(dateObj)
    days.push({
      date,
      dateStr,
      currentMonth: false,
      isToday: false,
      isSelected: dateStr === selectedDateStr,
      disabled: isDateDisabled(dateObj, minDateObj, maxDateObj)
    })
  }
  
  return days
})

const canGoPrev = computed(() => {
  if (!props.minDate) return true
  const minDate = new Date(props.minDate)
  const prevMonth = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), 0)
  return prevMonth >= minDate
})

const canGoNext = computed(() => {
  if (!props.maxDate) return true
  const maxDate = new Date(props.maxDate)
  const nextMonth = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
  return nextMonth <= maxDate
})

const dropdownStyle = computed(() => {
  if (!props.anchorRect) return {}
  
  const { bottom, left, width } = props.anchorRect
  const dropdownWidth = 320
  
  // Center dropdown under the trigger
  let leftPos = left + (width / 2) - (dropdownWidth / 2)
  
  // Ensure it doesn't go off screen
  const padding = 16
  if (leftPos < padding) leftPos = padding
  if (leftPos + dropdownWidth > window.innerWidth - padding) {
    leftPos = window.innerWidth - dropdownWidth - padding
  }
  
  return {
    position: 'fixed',
    top: `${bottom + 8}px`,
    left: `${leftPos}px`,
    width: `${dropdownWidth}px`
  }
})

function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isDateDisabled(dateObj, minDateObj, maxDateObj) {
  if (minDateObj && dateObj < minDateObj) return true
  if (maxDateObj && dateObj > maxDateObj) return true
  return false
}

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function selectDay(day) {
  if (day.disabled) return
  emit('update:modelValue', day.dateStr)
  emit('select', day.dateStr)
  close()
}

function goToToday() {
  const today = new Date()
  const todayStr = formatDateISO(today)
  
  // Check if today is within allowed range
  const minDateObj = props.minDate ? new Date(props.minDate) : null
  const maxDateObj = props.maxDate ? new Date(props.maxDate) : null
  today.setHours(0, 0, 0, 0)
  
  if (!isDateDisabled(today, minDateObj, maxDateObj)) {
    viewDate.value = today
    emit('update:modelValue', todayStr)
    emit('select', todayStr)
    close()
  } else {
    // Just navigate to today's month without selecting
    viewDate.value = today
  }
}

function close() {
  emit('update:isOpen', false)
}

// Close on Escape key
function handleKeydown(e) {
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

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--gap-md);
  padding: 0 var(--gap-xs);
}

.calendar-title {
  font-family: var(--font-sans);
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--text-main);
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  
  &:hover:not(:disabled) {
    background: var(--surface-highlight);
    color: var(--accent);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
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

.calendar-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  min-height: 36px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
  
  &:hover:not(:disabled) {
    background: var(--surface-highlight);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  &--other-month {
    color: var(--text-faint);
  }
  
  &--today {
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 700;
  }
  
  &--selected {
    background: var(--accent) !important;
    color: var(--text-inverse) !important;
    font-weight: 700;
  }
  
  &--disabled {
    color: var(--text-faint);
    opacity: 0.4;
    cursor: not-allowed;
    
    &:hover {
      background: transparent;
    }
  }
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
