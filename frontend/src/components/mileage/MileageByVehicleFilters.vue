<script setup lang="ts">
/**
 * MileageByVehicleFilters — блок фильтров для подраздела "По машине"
 */
import { ref, computed, watch, onMounted } from 'vue'
import { UiButton } from '@/components/ui'
import { CalendarDropdown } from '@/components/pickers'
import type { EquipmentType, Vehicle } from '@/api/resources'
import { formatDateShort } from '@/utils/format'

const props = defineProps<{
  equipmentTypes: EquipmentType[]
  vehicles: Vehicle[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply', filters: { vehiclesId: number; dateFrom: string; dateTo: string; byHours: boolean }): void
  (e: 'typeChange', typeId: number): void
}>()

// Form state
const selectedTypeId = ref<number | null>(null)
const selectedVehicleId = ref<number | null>(null)
const dateFrom = ref('')
const dateTo = ref('')
const byHours = ref(false)

// Calendar states
const isCalendarFromOpen = ref(false)
const calendarFromAnchorRect = ref<DOMRect | null>(null)
const dateFromRef = ref<HTMLElement | null>(null)

const isCalendarToOpen = ref(false)
const calendarToAnchorRect = ref<DOMRect | null>(null)
const dateToRef = ref<HTMLElement | null>(null)

// Computed
const filteredVehicles = computed(() => {
  if (!selectedTypeId.value) return props.vehicles
  return props.vehicles.filter(v => v.equipment_type_id === selectedTypeId.value)
})

const formattedDateFrom = computed(() => dateFrom.value ? formatDateShort(dateFrom.value) : '')
const formattedDateTo = computed(() => dateTo.value ? formatDateShort(dateTo.value) : '')

const canApply = computed(() => {
  return selectedVehicleId.value !== null && dateFrom.value && dateTo.value
})

// Watch type change to reset vehicle and fetch filtered list
watch(selectedTypeId, (newVal) => {
  selectedVehicleId.value = null
  if (newVal !== null) {
    emit('typeChange', newVal)
  }
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
    vehiclesId: selectedVehicleId.value!,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    byHours: byHours.value,
  })
}
</script>

<template>
  <div class="mileage-filters">
    <div class="mileage-filters__fields">
      <!-- Equipment Type + Vehicle group -->
      <div class="mileage-filters__select-group">
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Тип техники</label>
          <select
            v-model="selectedTypeId"
            class="mileage-filters__select"
          >
            <option :value="null">Все типы</option>
            <option 
              v-for="et in equipmentTypes" 
              :key="et.id" 
              :value="et.id"
            >
              {{ et.name }}
            </option>
          </select>
        </div>

        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Номер машины</label>
          <select
            v-model="selectedVehicleId"
            class="mileage-filters__select"
          >
            <option :value="null" disabled>Выберите машину</option>
            <option 
              v-for="v in filteredVehicles" 
              :key="v.id" 
              :value="v.id"
            >
              {{ v.plate_number }}
            </option>
          </select>
        </div>
      </div>

      <!-- Date range container -->
      <div class="mileage-filters__date-group">
        <!-- Date From -->
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Дата с</label>
          <button
            ref="dateFromRef"
            type="button"
            class="mileage-filters__date-btn"
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
        <div class="mileage-filters__field">
          <label class="mileage-filters__label">Дата по</label>
          <button
            ref="dateToRef"
            type="button"
            class="mileage-filters__date-btn"
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

      <!-- Checkbox + Apply row -->
      <div class="mileage-filters__action-group">
        <div class="mileage-filters__field mileage-filters__field--checkbox">
          <label class="mileage-filters__checkbox-label">
            <input
              v-model="byHours"
              type="checkbox"
              class="mileage-filters__checkbox"
            />
            <span>По часам</span>
          </label>
        </div>

        <div class="mileage-filters__field mileage-filters__field--action">
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
.mileage-filters {
  padding: var(--gap-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
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

.mileage-filters__select-group {
  display: contents;
}

.mileage-filters__date-group {
  display: contents;
}

.mileage-filters__action-group {
  display: contents;
}

.mileage-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.mileage-filters__select {
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
  min-width: 160px;
  appearance: auto;

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
}

.mileage-filters__field--checkbox {
  justify-content: flex-end;
}

.mileage-filters__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  height: var(--control-height-sm);
  cursor: pointer;
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
  user-select: none;
}

.mileage-filters__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
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
  .mileage-filters {
    padding: var(--gap-md);
  }

  .mileage-filters__fields {
    flex-direction: column;
    align-items: stretch;
  }

  .mileage-filters__select-group {
    display: flex;
    gap: var(--gap-md);
  }

  .mileage-filters__select-group .mileage-filters__field {
    flex: 1;
    min-width: 0;
  }

  .mileage-filters__date-group {
    display: flex;
    gap: var(--gap-md);
  }

  .mileage-filters__date-group .mileage-filters__field {
    flex: 1;
    min-width: 0;
  }

  .mileage-filters__select {
    min-width: 0;
    width: 100%;
  }

  .mileage-filters__date-btn {
    min-width: 0;
    width: 100%;
  }

  .mileage-filters__action-group {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
  }

  .mileage-filters__field--action {
    margin-left: auto;
    margin-top: 0;
  }
}
</style>
