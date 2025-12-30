<template>
  <button
    type="button"
    class="calendar-day"
    :class="dayClasses"
    :disabled="day.disabled"
    @click="$emit('select', day)"
  >
    {{ day.date }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarDay } from '../../composables/useCalendar'

interface Props {
  day: CalendarDay
}

const props = defineProps<Props>()

defineEmits<{
  select: [day: CalendarDay]
}>()

const dayClasses = computed(() => ({
  'calendar-day--other-month': !props.day.currentMonth,
  'calendar-day--today': props.day.isToday,
  'calendar-day--selected': props.day.isSelected,
  'calendar-day--disabled': props.day.disabled
}))
</script>

<style lang="scss" scoped>
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
</style>
