<script setup lang="ts">
/**
 * TimePicker — стилизованный выбор времени (часы:минуты)
 * 
 * Dropdown с двумя колонками для выбора часов и минут.
 * Поддерживает v-model для значения времени в формате HH:MM.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue?: string  // HH:MM format
  placeholder?: string
  disabled?: boolean
  minuteStep?: number  // 1, 5, 15, 30
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const dropdownStyle = ref<{ top: string; left: string } | null>(null)

// Parse current value
const selectedHour = ref<number | null>(null)
const selectedMinute = ref<number | null>(null)

const minuteStep = computed(() => props.minuteStep || 5)

// Generate hours (00-23)
const hours = computed(() => {
  return Array.from({ length: 24 }, (_, i) => i)
})

// Generate minutes based on step
const minutes = computed(() => {
  const step = minuteStep.value
  const result: number[] = []
  for (let i = 0; i < 60; i += step) {
    result.push(i)
  }
  return result
})

// Format display value
const displayValue = computed(() => {
  if (selectedHour.value !== null && selectedMinute.value !== null) {
    const h = String(selectedHour.value).padStart(2, '0')
    const m = String(selectedMinute.value).padStart(2, '0')
    return `${h}:${m}`
  }
  return ''
})

// Watch modelValue changes
watch(() => props.modelValue, (val) => {
  if (val) {
    const parts = val.split(':').map(Number)
    const h = parts[0]
    const m = parts[1]
    if (h !== undefined && m !== undefined && !isNaN(h) && !isNaN(m)) {
      selectedHour.value = h
      selectedMinute.value = m
    }
  } else {
    selectedHour.value = null
    selectedMinute.value = null
  }
}, { immediate: true })

// Update dropdown position
function updateDropdownPosition() {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 250 // approximate
  
  // Determine if dropdown should open above or below
  const spaceBelow = viewportHeight - rect.bottom
  const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight
  
  dropdownStyle.value = {
    top: openAbove ? `${rect.top - dropdownHeight - 4}px` : `${rect.bottom + 4}px`,
    left: `${rect.left}px`
  }
}

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => updateDropdownPosition())
  }
}

function closeDropdown() {
  isOpen.value = false
}

function selectHour(hour: number) {
  selectedHour.value = hour
  emitValue()
}

function selectMinute(minute: number) {
  selectedMinute.value = minute
  emitValue()
  // Close dropdown after selecting minute
  closeDropdown()
}

function emitValue() {
  if (selectedHour.value !== null && selectedMinute.value !== null) {
    const h = String(selectedHour.value).padStart(2, '0')
    const m = String(selectedMinute.value).padStart(2, '0')
    emit('update:modelValue', `${h}:${m}`)
  }
}

function formatNumber(n: number): string {
  return String(n).padStart(2, '0')
}

// Click outside handler
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.time-picker') && !target.closest('.time-picker__dropdown')) {
    closeDropdown()
  }
}

// Keyboard handler
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeDropdown()
  }
}

// Position update on scroll/resize
function handlePositionUpdate() {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handlePositionUpdate)
  window.addEventListener('scroll', handlePositionUpdate, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handlePositionUpdate)
  window.removeEventListener('scroll', handlePositionUpdate, true)
})
</script>

<template>
  <div class="time-picker" ref="root">
    <button
      type="button"
      class="time-picker__toggle"
      :class="{ 'time-picker__toggle--disabled': disabled }"
      :disabled="disabled"
      @click.stop="toggleDropdown"
      :aria-expanded="isOpen"
      :aria-label="`Выбор времени${displayValue ? `, текущее: ${displayValue}` : ''}`"
    >
      <span class="time-picker__icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="time-picker__value">
        {{ displayValue || placeholder || 'Выберите время' }}
      </span>
      <span class="time-picker__arrow" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <Teleport to="body">
      <Transition name="time-dropdown">
        <div 
          v-if="isOpen" 
          class="time-picker__dropdown"
          :style="dropdownStyle"
          @click.stop
        >
          <div class="time-picker__columns">
            <!-- Hours column -->
            <div class="time-picker__column">
              <div class="time-picker__column-header">Часы</div>
              <div class="time-picker__column-list">
                <button
                  v-for="hour in hours"
                  :key="hour"
                  type="button"
                  class="time-picker__option"
                  :class="{ 'time-picker__option--selected': selectedHour === hour }"
                  @click="selectHour(hour)"
                >
                  {{ formatNumber(hour) }}
                </button>
              </div>
            </div>
            
            <!-- Minutes column -->
            <div class="time-picker__column">
              <div class="time-picker__column-header">Минуты</div>
              <div class="time-picker__column-list">
                <button
                  v-for="minute in minutes"
                  :key="minute"
                  type="button"
                  class="time-picker__option"
                  :class="{ 'time-picker__option--selected': selectedMinute === minute }"
                  @click="selectMinute(minute)"
                >
                  {{ formatNumber(minute) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.time-picker {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
}

.time-picker__toggle {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  width: 100%;
  min-width: 0;
  height: var(--control-height-sm);
  padding: 0 var(--gap-md);
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--border-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-muted);
  }
}

.time-picker__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.time-picker__value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
}

.time-picker__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
</style>

<!-- Global styles for teleported dropdown -->
<style lang="scss">
.time-picker__dropdown {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-strong);
  overflow: hidden;
  z-index: 1000;
}

.time-picker__columns {
  display: flex;
}

.time-picker__column {
  display: flex;
  flex-direction: column;
  width: 80px;

  &:not(:last-child) {
    border-right: 1px solid var(--border-soft);
  }
}

.time-picker__column-header {
  padding: var(--gap-sm) var(--gap-md);
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  background: var(--bg-muted);
  text-align: center;
  border-bottom: 1px solid var(--border-soft);
}

.time-picker__column-list {
  max-height: 200px;
  overflow-y: auto;
  padding: var(--gap-xs) 0;
}

.time-picker__option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--gap-sm) var(--gap-md);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--overlay-dark-hover);
  }

  &--selected {
    background: var(--overlay-accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
}

/* Dropdown animation */
.time-dropdown-enter-active,
.time-dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.time-dropdown-enter-from,
.time-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
