<script setup lang="ts">
/**
 * MileageByDateFilters — блок фильтров для подраздела "По дате"
 *
 * Поддерживает два режима выбора даты:
 *   - single: одна конкретная дата
 *   - range:  период (дата с / дата по)
 *
 * Время выбирается только по часам (без минут) в формате HH:00.
 */
import { ref, computed, onMounted } from 'vue'
import { UiButton } from '@/components/ui'
import { TimePicker, CalendarDropdown } from '@/components/pickers'

export type DateMode = 'single' | 'range'

export interface MileageByDateFilterValues {
  dateMode: DateMode
  date: string
  dateFrom: string
  dateTo: string
  timeFrom?: string
  timeTo?: string
}

const props = defineProps<{
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', filters: MileageByDateFilterValues): void
}>()

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const dateMode = ref<DateMode>('single')

// Single date state
const selectedDate = ref('')

// Range date state
const dateFrom = ref('')
const dateTo = ref('')

// Time state
const timeFrom = ref('')
const timeTo = ref('')

// Calendar states
const isCalendarOpen = ref(false)
const calendarAnchorRect = ref<DOMRect | null>(null)
const datePickerRef = ref<HTMLElement | null>(null)

const isCalendarFromOpen = ref(false)
const calendarFromAnchorRect = ref<DOMRect | null>(null)
const dateFromPickerRef = ref<HTMLElement | null>(null)

const isCalendarToOpen = ref(false)
const calendarToAnchorRect = ref<DOMRect | null>(null)
const dateToPickerRef = ref<HTMLElement | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────────────────────────────────────

function formatDateRu(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formattedDate = computed(() => formatDateRu(selectedDate.value))
const formattedDateFrom = computed(() => formatDateRu(dateFrom.value))
const formattedDateTo = computed(() => formatDateRu(dateTo.value))

// ─────────────────────────────────────────────────────────────────────────────
// Initialize
// ─────────────────────────────────────────────────────────────────────────────

onMounted(() => {
  const today = new Date().toISOString().slice(0, 10)
  selectedDate.value = today
  dateFrom.value = today
  dateTo.value = today
  handleApply()
})

// ─────────────────────────────────────────────────────────────────────────────
// Calendar methods — single date
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Calendar methods — range: date from
// ─────────────────────────────────────────────────────────────────────────────

function openCalendarFrom() {
  if (dateFromPickerRef.value) {
    calendarFromAnchorRect.value = dateFromPickerRef.value.getBoundingClientRect()
  }
  isCalendarFromOpen.value = true
}

function onDateFromSelect(dateStr: string) {
  dateFrom.value = dateStr
  isCalendarFromOpen.value = false
  // Если дата "по" раньше даты "с" — подтянуть
  if (dateTo.value && dateTo.value < dateStr) {
    dateTo.value = dateStr
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar methods — range: date to
// ─────────────────────────────────────────────────────────────────────────────

function openCalendarTo() {
  if (dateToPickerRef.value) {
    calendarToAnchorRect.value = dateToPickerRef.value.getBoundingClientRect()
  }
  isCalendarToOpen.value = true
}

function onDateToSelect(dateStr: string) {
  dateTo.value = dateStr
  isCalendarToOpen.value = false
  // Если дата "с" позже даты "по" — подтянуть
  if (dateFrom.value && dateFrom.value > dateStr) {
    dateFrom.value = dateStr
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode toggle
// ─────────────────────────────────────────────────────────────────────────────

function setDateMode(mode: DateMode) {
  dateMode.value = mode
  // Синхронизируем даты при переключении режима
  if (mode === 'single' && dateFrom.value) {
    selectedDate.value = dateFrom.value
  } else if (mode === 'range' && selectedDate.value) {
    dateFrom.value = selectedDate.value
    dateTo.value = selectedDate.value
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────────────────────

function handleApply() {
  emit('apply', {
    dateMode: dateMode.value,
    date: selectedDate.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    timeFrom: timeFrom.value || undefined,
    timeTo: timeTo.value || undefined,
  })
}
</script>

<template>
  <div class="mileage-filters">
    <!-- Date mode toggle -->
    <div class="mileage-filters__mode-toggle">
      <button
        type="button"
        class="mileage-filters__mode-btn"
        :class="{ 'mileage-filters__mode-btn--active': dateMode === 'single' }"
        @click="setDateMode('single')"
      >
        Одна дата
      </button>
      <button
        type="button"
        class="mileage-filters__mode-btn"
        :class="{ 'mileage-filters__mode-btn--active': dateMode === 'range' }"
        @click="setDateMode('range')"
      >
        Период
      </button>
    </div>

    <div class="mileage-filters__fields">
      <!-- Single date -->
      <template v-if="dateMode === 'single'">
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Дата</label>
          <button 
            ref="datePickerRef"
            type="button" 
            class="mileage-filters__date-btn"
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
      </template>

      <!-- Date range -->
      <template v-else>
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Дата с</label>
          <button 
            ref="dateFromPickerRef"
            type="button" 
            class="mileage-filters__date-btn"
            @click="openCalendarFrom"
          >
            <span>{{ formattedDateFrom || 'Дата начала' }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <CalendarDropdown
            v-model:isOpen="isCalendarFromOpen"
            :modelValue="dateFrom"
            :anchorRect="calendarFromAnchorRect"
            @select="onDateFromSelect"
          />
        </div>

        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Дата по</label>
          <button 
            ref="dateToPickerRef"
            type="button" 
            class="mileage-filters__date-btn"
            @click="openCalendarTo"
          >
            <span>{{ formattedDateTo || 'Дата окончания' }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <CalendarDropdown
            v-model:isOpen="isCalendarToOpen"
            :modelValue="dateTo"
            :anchorRect="calendarToAnchorRect"
            @select="onDateToSelect"
          />
        </div>
      </template>

      <!-- Time fields container -->
      <div class="mileage-filters__time-group">
        <!-- Time From -->
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Время с</label>
          <TimePicker 
            v-model="timeFrom"
            placeholder="—"
            :hoursOnly="true"
          />
        </div>

        <!-- Time To -->
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Время по</label>
          <TimePicker 
            v-model="timeTo"
            placeholder="—"
            :hoursOnly="true"
          />
        </div>
      </div>

      <!-- Apply button -->
      <div class="mileage-filters__field mileage-filters__field--action">
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
.mileage-filters {
  padding: var(--gap-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
}

.mileage-filters__mode-toggle {
  display: inline-flex;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  padding: 2px;
  margin-bottom: var(--gap-md);
}

.mileage-filters__mode-btn {
  padding: var(--gap-xs) var(--gap-md);
  border: none;
  background: transparent;
  border-radius: calc(var(--radius-md) - 2px);
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(&--active) {
    color: var(--text-main);
  }

  &--active {
    background: var(--bg-card);
    color: var(--text-main);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }
}

.mileage-filters__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--gap-md) var(--gap-lg);
}

.mileage-filters__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &--action {
    margin-left: auto;
  }
}

.mileage-filters__time-group {
  display: contents;
}

.mileage-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.mileage-filters__date-btn {
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
  .mileage-filters {
    padding: var(--gap-md);
  }

  .mileage-filters__fields {
    flex-direction: column;
    align-items: stretch;
  }

  .mileage-filters__time-group {
    display: flex;
    gap: var(--gap-md);
  }

  .mileage-filters__time-group .mileage-filters__field {
    flex: 1;
    min-width: 0;
  }

  .mileage-filters__field--action {
    margin-left: 0;
    margin-top: var(--gap-sm);
  }
}
</style>
