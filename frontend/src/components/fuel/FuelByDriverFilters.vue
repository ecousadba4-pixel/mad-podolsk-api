<script setup lang="ts">
/**
 * FuelByDriverFilters — блок фильтров для подраздела "По водителям"
 *
 * Паттерн: аналогичен MileageByVehicleFilters.vue
 */
import { ref, computed, onMounted } from 'vue'
import { UiButton } from '@/components/ui'
import { CalendarDropdown } from '@/components/pickers'
import type { FuelDriverItem } from '@/api/fuel'
import { formatDateShort } from '@/utils/format'

const props = defineProps<{
  drivers: FuelDriverItem[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', filters: { employeeId: number; dateFrom: string; dateTo: string }): void
}>()

// Form state
const selectedDriverId = ref<number | null>(null)
const dateFrom = ref('')
const dateTo = ref('')

// Calendar states
const isCalendarFromOpen = ref(false)
const calendarFromAnchorRect = ref<DOMRect | null>(null)
const dateFromRef = ref<HTMLElement | null>(null)

const isCalendarToOpen = ref(false)
const calendarToAnchorRect = ref<DOMRect | null>(null)
const dateToRef = ref<HTMLElement | null>(null)

// Computed
const formattedDateFrom = computed(() => dateFrom.value ? formatDateShort(dateFrom.value) : '')
const formattedDateTo = computed(() => dateTo.value ? formatDateShort(dateTo.value) : '')

const canApply = computed(() => {
  return selectedDriverId.value !== null && dateFrom.value && dateTo.value
})

// Initialize dates
onMounted(() => {
  const today = new Date()
  dateTo.value = today.toISOString().slice(0, 10)
  // Default date_from = 7 days ago
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  dateFrom.value = weekAgo.toISOString().slice(0, 10)
})

// Methods
function openCalendarFrom() {
  if (dateFromRef.value) {
    calendarFromAnchorRect.value = dateFromRef.value.getBoundingClientRect()
  }
  isCalendarFromOpen.value = true
}

function openCalendarTo() {
  if (dateToRef.value) {
    calendarToAnchorRect.value = dateToRef.value.getBoundingClientRect()
  }
  isCalendarToOpen.value = true
}

function onDateFromSelect(dateStr: string) {
  dateFrom.value = dateStr
  isCalendarFromOpen.value = false
}

function onDateToSelect(dateStr: string) {
  dateTo.value = dateStr
  isCalendarToOpen.value = false
}

function handleApply() {
  if (!canApply.value) return
  emit('apply', {
    employeeId: selectedDriverId.value!,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
  })
}
</script>

<template>
  <div class="fuel-filters">
    <div class="fuel-filters__fields">
      <!-- Driver select -->
      <div class="fuel-filters__select-group">
        <div class="fuel-filters__field">
          <label class="fuel-filters__label">Водитель</label>
          <select
            v-model="selectedDriverId"
            class="fuel-filters__select"
          >
            <option :value="null" disabled>Выберите водителя</option>
            <option 
              v-for="d in drivers" 
              :key="d.employee_id" 
              :value="d.employee_id"
            >
              {{ d.employee_name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Date range container -->
      <div class="fuel-filters__date-group">
        <!-- Date From -->
        <div class="fuel-filters__field">
          <label class="fuel-filters__label">Дата с</label>
          <button
            ref="dateFromRef"
            type="button"
            class="fuel-filters__date-btn"
            @click="openCalendarFrom"
          >
            <span>{{ formattedDateFrom || 'Начало' }}</span>
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
            :maxDate="dateTo"
            @select="onDateFromSelect"
          />
        </div>

        <!-- Date To -->
        <div class="fuel-filters__field">
          <label class="fuel-filters__label">Дата по</label>
          <button
            ref="dateToRef"
            type="button"
            class="fuel-filters__date-btn"
            @click="openCalendarTo"
          >
            <span>{{ formattedDateTo || 'Конец' }}</span>
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
            :minDate="dateFrom"
            @select="onDateToSelect"
          />
        </div>
      </div>

      <!-- Apply -->
      <div class="fuel-filters__action-group">
        <div class="fuel-filters__field fuel-filters__field--action">
          <UiButton 
            variant="primary" 
            :loading="isLoading"
            :disabled="!canApply"
            @click="handleApply"
          >
            Применить
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fuel-filters {
  padding: var(--gap-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
}

.fuel-filters__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--gap-md) var(--gap-lg);
}

.fuel-filters__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &--action {
    margin-left: auto;
  }
}

.fuel-filters__select-group {
  display: contents;
}

.fuel-filters__date-group {
  display: contents;
}

.fuel-filters__action-group {
  display: contents;
}

.fuel-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.fuel-filters__select {
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
  min-width: 200px;
  appearance: auto;

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
}

.fuel-filters__date-btn {
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
  min-width: 160px;

  &:hover:not(:disabled) {
    border-color: var(--border-strong);
  }

  svg {
    flex-shrink: 0;
    color: var(--text-muted);
  }
}

@media (max-width: 768px) {
  .fuel-filters {
    padding: var(--gap-md);
  }

  .fuel-filters__fields {
    flex-direction: column;
    align-items: stretch;
  }

  .fuel-filters__select-group {
    display: flex;
    gap: var(--gap-md);
  }

  .fuel-filters__select-group .fuel-filters__field {
    flex: 1;
    min-width: 0;
  }

  .fuel-filters__date-group {
    display: flex;
    gap: var(--gap-md);
  }

  .fuel-filters__date-group .fuel-filters__field {
    flex: 1;
    min-width: 0;
  }

  .fuel-filters__select {
    min-width: 0;
    width: 100%;
  }

  .fuel-filters__date-btn {
    min-width: 0;
    width: 100%;
  }

  .fuel-filters__action-group {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
  }

  .fuel-filters__field--action {
    margin-left: auto;
    margin-top: 0;
  }
}
</style>
