<script setup lang="ts">
/**
 * EquipmentForm — форма для создания/редактирования смены техники
 * 
 * Переиспользуется для собственной и арендованной техники.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { UiInput, UiButton } from '@/components/ui'
import { TimePicker } from '@/components/pickers'
import { CalendarDropdown } from '@/components/pickers'

const props = defineProps<{
  isOwn: boolean
  mode: 'create' | 'edit'
  initialData?: {
    equipmentTypeId?: number
    vehicleId?: number
    plateNumber?: string
    driverId?: number
    driverName?: string
    shiftStartDate?: string
    shiftStartTime?: string
    shiftDurationHours?: number
  }
}>()

const emit = defineEmits<{
  (e: 'submit', data: {
    is_own: boolean
    equipment_type_id: number
    vehicle_id?: number
    plate_number: string
    driver_id?: number
    driver_name?: string
    shift_start_date: string
    shift_start_time: string
    shift_duration_hours: number
  }): void
  (e: 'cancel'): void
}>()

const store = useResourcesStore()
const { equipmentTypes, vehicles, drivers, isOperationLoading } = storeToRefs(store)

// Form state
const selectedTypeId = ref<number | null>(null)
const selectedVehicleId = ref<number | null>(null)
const plateNumber = ref('')
const selectedDriverId = ref<number | null>(null)
const driverName = ref('')
const shiftStartDate = ref('')
const shiftStartTime = ref('')
const shiftDurationHours = ref<number | string>('')

// Calendar state
const isCalendarOpen = ref(false)
const calendarAnchorRect = ref<DOMRect | null>(null)
const datePickerRef = ref<HTMLElement | null>(null)

// Computed
const filteredVehicles = computed(() => {
  if (!selectedTypeId.value) return []
  return vehicles.value.filter(v => v.equipment_type_id === selectedTypeId.value)
})

const formattedDate = computed(() => {
  if (!shiftStartDate.value) return ''
  const d = new Date(shiftStartDate.value)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const isValid = computed(() => {
  if (!selectedTypeId.value) return false
  if (!plateNumber.value.trim()) return false
  if (!shiftStartDate.value) return false
  if (!shiftStartTime.value) return false
  const duration = Number(shiftDurationHours.value)
  if (!duration || duration <= 0) return false
  
  if (props.isOwn) {
    if (!selectedVehicleId.value) return false
    if (!selectedDriverId.value) return false
  }
  
  return true
})

// Watchers
watch(selectedTypeId, () => {
  // Reset vehicle when type changes (for own equipment)
  if (props.isOwn) {
    selectedVehicleId.value = null
    plateNumber.value = ''
  }
})

watch(selectedVehicleId, (vehicleId) => {
  // Auto-fill plate number from selected vehicle
  if (props.isOwn && vehicleId) {
    const vehicle = vehicles.value.find(v => v.id === vehicleId)
    if (vehicle) {
      plateNumber.value = vehicle.plate_number
    }
  }
})

// Initialize from initial data
onMounted(() => {
  if (props.initialData) {
    selectedTypeId.value = props.initialData.equipmentTypeId ?? null
    selectedVehicleId.value = props.initialData.vehicleId ?? null
    plateNumber.value = props.initialData.plateNumber ?? ''
    selectedDriverId.value = props.initialData.driverId ?? null
    driverName.value = props.initialData.driverName ?? ''
    shiftStartDate.value = props.initialData.shiftStartDate ?? ''
    shiftStartTime.value = props.initialData.shiftStartTime ?? ''
    shiftDurationHours.value = props.initialData.shiftDurationHours ?? ''
  } else {
    // Set default date to today
    const today = new Date()
    shiftStartDate.value = today.toISOString().slice(0, 10)
  }
})

// Methods
function openCalendar() {
  if (datePickerRef.value) {
    calendarAnchorRect.value = datePickerRef.value.getBoundingClientRect()
  }
  isCalendarOpen.value = true
}

function onDateSelect(dateStr: string) {
  shiftStartDate.value = dateStr
  isCalendarOpen.value = false
}

function handleSubmit() {
  if (!isValid.value) return
  
  emit('submit', {
    is_own: props.isOwn,
    equipment_type_id: selectedTypeId.value!,
    vehicle_id: props.isOwn ? selectedVehicleId.value ?? undefined : undefined,
    plate_number: plateNumber.value.trim().toUpperCase(),
    driver_id: props.isOwn ? selectedDriverId.value ?? undefined : undefined,
    driver_name: props.isOwn ? undefined : driverName.value.trim() || undefined,
    shift_start_date: shiftStartDate.value,
    shift_start_time: shiftStartTime.value,
    shift_duration_hours: Number(shiftDurationHours.value),
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <form class="equipment-form" @submit.prevent="handleSubmit">
    <div class="equipment-form__grid">
      <!-- Equipment Type -->
      <div class="equipment-form__field">
        <label class="equipment-form__label">Тип</label>
        <select 
          v-model="selectedTypeId" 
          class="equipment-form__select"
          :disabled="mode === 'edit'"
        >
          <option :value="null" disabled>Выберите тип</option>
          <option 
            v-for="type in equipmentTypes" 
            :key="type.id" 
            :value="type.id"
          >
            {{ type.name }}
          </option>
        </select>
      </div>

      <!-- Vehicle (for own) or Plate Number (for rented) -->
      <template v-if="isOwn">
        <div class="equipment-form__field">
          <label class="equipment-form__label">Гос. номер</label>
          <select 
            v-model="selectedVehicleId" 
            class="equipment-form__select"
            :disabled="!selectedTypeId || mode === 'edit'"
          >
            <option :value="null" disabled>Выберите технику</option>
            <option 
              v-for="vehicle in filteredVehicles" 
              :key="vehicle.id" 
              :value="vehicle.id"
            >
              {{ vehicle.plate_number }}
            </option>
          </select>
        </div>
      </template>
      <template v-else>
        <div class="equipment-form__field">
          <label class="equipment-form__label">Гос. номер</label>
          <UiInput 
            v-model="plateNumber" 
            placeholder="Введите гос. номер"
            :disabled="mode === 'edit'"
          />
        </div>
      </template>

      <!-- Driver -->
      <template v-if="isOwn">
        <div class="equipment-form__field">
          <label class="equipment-form__label">ФИО водителя</label>
          <select 
            v-model="selectedDriverId" 
            class="equipment-form__select"
          >
            <option :value="null" disabled>Выберите водителя</option>
            <option 
              v-for="driver in drivers" 
              :key="driver.id" 
              :value="driver.id"
            >
              {{ driver.full_name }}
            </option>
          </select>
        </div>
      </template>
      <template v-else>
        <div class="equipment-form__field">
          <label class="equipment-form__label">ФИО водителя</label>
          <UiInput 
            v-model="driverName" 
            placeholder="Введите ФИО водителя"
          />
        </div>
      </template>

      <!-- Date -->
      <div class="equipment-form__field">
        <label class="equipment-form__label">Дата начала работы</label>
        <button 
          ref="datePickerRef"
          type="button" 
          class="equipment-form__date-btn"
          :disabled="mode === 'edit'"
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
          :modelValue="shiftStartDate"
          :anchorRect="calendarAnchorRect"
          @select="onDateSelect"
        />
      </div>

      <!-- Time -->
      <div class="equipment-form__field">
        <label class="equipment-form__label">Время начала работы</label>
        <TimePicker 
          v-model="shiftStartTime"
          placeholder="Выберите время"
          :minuteStep="15"
        />
      </div>

      <!-- Duration -->
      <div class="equipment-form__field">
        <label class="equipment-form__label">Продолжительность (ч)</label>
        <UiInput 
          v-model="shiftDurationHours"
          type="number"
          placeholder="Например: 8"
          :min="0.5"
          :max="24"
          :step="0.5"
        />
      </div>
    </div>

    <div class="equipment-form__actions">
      <UiButton variant="ghost" @click="handleCancel">
        Отмена
      </UiButton>
      <slot name="extra-actions" />
      <UiButton 
        variant="primary" 
        :disabled="!isValid || isOperationLoading"
        :loading="isOperationLoading"
        type="submit"
      >
        {{ mode === 'edit' ? 'Сохранить' : 'Записать' }}
      </UiButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.equipment-form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.equipment-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--gap-md);
}

.equipment-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.equipment-form__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.equipment-form__select {
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

  &:hover:not(:disabled) {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-muted);
  }
}

.equipment-form__date-btn {
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

  &:hover:not(:disabled) {
    border-color: var(--border-strong);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-muted);
  }

  svg {
    flex-shrink: 0;
    color: var(--text-muted);
  }
}

.equipment-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}
</style>
