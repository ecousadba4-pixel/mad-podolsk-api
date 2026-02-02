<script setup lang="ts">
/**
 * ShiftSearchForm — форма поиска записи по идентификатору + дате
 * 
 * Используется для поиска смен техники (тип + гос.номер + дата) и мастеров (ФИО + дата)
 */
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { UiButton } from '@/components/ui'
import { CalendarDropdown } from '@/components/pickers'

const props = defineProps<{
  type: 'equipment' | 'master'
  isOwn?: boolean  // For equipment: true = own, false = rented
}>()

const emit = defineEmits<{
  (e: 'search', data: { identifier: string | number; date: string }): void
  (e: 'cancel'): void
}>()

const store = useResourcesStore()
const { 
  masters, 
  equipmentTypes, 
  vehicles, 
  rentedPlateNumbers,
  isOperationLoading 
} = storeToRefs(store)

// Form state
const selectedTypeId = ref<number | null>(null)
const selectedPlateNumber = ref<string | null>(null)
const selectedMasterId = ref<number | null>(null)
const searchDate = ref('')

// Calendar state
const isCalendarOpen = ref(false)
const calendarAnchorRect = ref<DOMRect | null>(null)
const datePickerRef = ref<HTMLElement | null>(null)

// Computed
const filteredVehicles = computed(() => {
  if (!selectedTypeId.value) return []
  return vehicles.value.filter(v => v.equipment_type_id === selectedTypeId.value)
})

const filteredRentedPlateNumbers = computed(() => {
  if (!selectedTypeId.value) return []
  return rentedPlateNumbers.value.filter(p => p.equipment_type_id === selectedTypeId.value)
})

const formattedDate = computed(() => {
  if (!searchDate.value) return ''
  const d = new Date(searchDate.value)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const isValid = computed(() => {
  if (!searchDate.value) return false
  
  if (props.type === 'equipment') {
    return selectedTypeId.value !== null && selectedPlateNumber.value !== null
  } else {
    return selectedMasterId.value !== null
  }
})

// Watchers
watch(selectedTypeId, async (newTypeId) => {
  // Reset plate number when type changes
  selectedPlateNumber.value = null
  
  // For rented equipment, fetch plate numbers for this type
  if (props.type === 'equipment' && !props.isOwn && newTypeId) {
    await store.fetchRentedPlateNumbers(newTypeId)
  }
})

// Initialize
onMounted(async () => {
  // Set default date to today
  const today = new Date()
  searchDate.value = today.toISOString().slice(0, 10)
  
  // Pre-fetch all rented plate numbers if needed
  if (props.type === 'equipment' && !props.isOwn) {
    await store.fetchRentedPlateNumbers()
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
  searchDate.value = dateStr
  isCalendarOpen.value = false
}

function handleSearch() {
  if (!isValid.value) return
  
  if (props.type === 'equipment') {
    emit('search', {
      identifier: selectedPlateNumber.value!,
      date: searchDate.value,
    })
  } else {
    emit('search', {
      identifier: selectedMasterId.value!,
      date: searchDate.value,
    })
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <form class="search-form" @submit.prevent="handleSearch">
    <div class="search-form__fields">
      <!-- Equipment Type (only for equipment search) -->
      <template v-if="type === 'equipment'">
        <div class="search-form__field">
          <label class="search-form__label">Тип техники</label>
          <select 
            v-model="selectedTypeId" 
            class="search-form__select"
          >
            <option :value="null" disabled>Выберите тип</option>
            <option 
              v-for="eqType in equipmentTypes" 
              :key="eqType.id" 
              :value="eqType.id"
            >
              {{ eqType.name }}
            </option>
          </select>
        </div>
      </template>

      <!-- Identifier field -->
      <div class="search-form__field">
        <label class="search-form__label">
          {{ type === 'equipment' ? 'Гос. номер' : 'ФИО мастера' }}
        </label>
        <template v-if="type === 'equipment'">
          <!-- Own equipment: select from vehicles -->
          <template v-if="isOwn">
            <select 
              v-model="selectedPlateNumber" 
              class="search-form__select"
              :disabled="!selectedTypeId"
            >
              <option :value="null" disabled>
                {{ selectedTypeId ? 'Выберите гос. номер' : 'Сначала выберите тип' }}
              </option>
              <option 
                v-for="vehicle in filteredVehicles" 
                :key="vehicle.id" 
                :value="vehicle.plate_number"
              >
                {{ vehicle.plate_number }}
              </option>
            </select>
          </template>
          <!-- Rented equipment: select from rented plate numbers -->
          <template v-else>
            <select 
              v-model="selectedPlateNumber" 
              class="search-form__select"
              :disabled="!selectedTypeId"
            >
              <option :value="null" disabled>
                {{ selectedTypeId ? 'Выберите гос. номер' : 'Сначала выберите тип' }}
              </option>
              <option 
                v-for="item in filteredRentedPlateNumbers" 
                :key="item.plate_number" 
                :value="item.plate_number"
              >
                {{ item.plate_number }}
              </option>
            </select>
          </template>
        </template>
        <template v-else>
          <select 
            v-model="selectedMasterId" 
            class="search-form__select"
          >
            <option :value="null" disabled>Выберите мастера</option>
            <option 
              v-for="master in masters" 
              :key="master.id" 
              :value="master.id"
            >
              {{ master.full_name }}
            </option>
          </select>
        </template>
      </div>

      <!-- Date field -->
      <div class="search-form__field">
        <label class="search-form__label">Дата начала работы</label>
        <button 
          ref="datePickerRef"
          type="button" 
          class="search-form__date-btn"
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
          :modelValue="searchDate"
          :anchorRect="calendarAnchorRect"
          @select="onDateSelect"
        />
      </div>
    </div>

    <div class="search-form__actions">
      <UiButton variant="ghost" @click="handleCancel">
        Отмена
      </UiButton>
      <UiButton 
        variant="primary" 
        :disabled="!isValid || isOperationLoading"
        :loading="isOperationLoading"
        type="submit"
      >
        Найти запись
      </UiButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.search-form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.search-form__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--gap-md);
}

.search-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: 0;
}

.search-form__field .search-form__select,
.search-form__field .search-form__date-btn {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.search-form__field :deep(.ui-input) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.search-form__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.search-form__select {
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
}

.search-form__date-btn {
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

  svg {
    flex-shrink: 0;
    color: var(--text-muted);
  }
}

.search-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}
</style>
