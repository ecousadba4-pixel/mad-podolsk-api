<script setup lang="ts">
/**
 * SummaryFilters — блок фильтров для сводки
 */
import { ref, computed, onMounted } from 'vue'
import { UiButton } from '@/components/ui'
import { TimePicker, CalendarDropdown } from '@/components/pickers'

const props = defineProps<{
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', filters: { date: string; timeFrom?: string; timeTo?: string }): void
}>()

// Form state
const selectedDate = ref('')
const timeFrom = ref('')
const timeTo = ref('')

// Calendar state
const isCalendarOpen = ref(false)
const calendarAnchorRect = ref<DOMRect | null>(null)
const datePickerRef = ref<HTMLElement | null>(null)

const formattedDate = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

// Initialize
onMounted(() => {
  // Set default date to today
  const today = new Date()
  selectedDate.value = today.toISOString().slice(0, 10)
  
  // Emit initial filters
  handleApply()
})

// Methods
function openCalendar() {
  if (datePickerRef.value) {
    calendarAnchorRect.value = datePickerRef.value.getBoundingClientRect()
  }
  isCalendarOpen.value = true
}

function onDateSelect(dateStr: string) {
  selectedDate.value = dateStr
  isCalendarOpen.value = false
}

function handleApply() {
  emit('apply', {
    date: selectedDate.value,
    timeFrom: timeFrom.value || undefined,
    timeTo: timeTo.value || undefined,
  })
}
</script>

<template>
  <div class="summary-filters">
    <div class="summary-filters__fields">
      <!-- Date -->
      <div class="summary-filters__field">
        <label class="summary-filters__label">Дата</label>
        <button 
          ref="datePickerRef"
          type="button" 
          class="summary-filters__date-btn"
          @click="openCalendar"
        >
          <span>{{ formattedDate || 'Выберите дату' }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
        <CalendarDropdown
          v-model:isOpen="isCalendarOpen"
          :modelValue="selectedDate"
          :anchorRect="calendarAnchorRect"
          @select="onDateSelect"
        />
      </div>

      <!-- Time fields container -->
      <div class="summary-filters__time-group">
        <!-- Time From -->
        <div class="summary-filters__field">
          <label class="summary-filters__label">Время с</label>
          <TimePicker 
            v-model="timeFrom"
            placeholder="—"
            :minuteStep="15"
          />
        </div>

        <!-- Time To -->
        <div class="summary-filters__field">
          <label class="summary-filters__label">Время по</label>
          <TimePicker 
            v-model="timeTo"
            placeholder="—"
            :minuteStep="15"
          />
        </div>
      </div>

      <!-- Apply button -->
      <div class="summary-filters__field summary-filters__field--action">
        <UiButton 
          variant="primary" 
          :loading="isLoading"
          @click="handleApply"
        >
          Применить
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.summary-filters {
  padding: var(--gap-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
}

.summary-filters__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--gap-md) var(--gap-lg);
}

.summary-filters__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &--action {
    margin-left: auto;
  }
}

.summary-filters__time-group {
  display: contents;
}

.summary-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.summary-filters__date-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
  height: var(--control-height-sm);
  padding: 0 var(--gap-md);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  cursor: pointer;
  transition: border-color 0.2s ease;
  text-align: left;
  min-width: 200px;

  &:hover:not(:disabled) {
    border-color: var(--border-strong);
  }

  svg {
    flex-shrink: 0;
    color: var(--text-muted);
  }
}

@media (max-width: 768px) {
  .summary-filters {
    padding: var(--gap-md);
  }

  .summary-filters__fields {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-filters__time-group {
    display: flex;
    gap: var(--gap-md);
  }

  .summary-filters__time-group .summary-filters__field {
    flex: 1;
    min-width: 0;
  }

  .summary-filters__field--action {
    margin-left: 0;
    margin-top: var(--gap-sm);
  }
}
</style>
