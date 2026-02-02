<script setup lang="ts">
/**
 * MasterForm — форма для создания/редактирования смены мастера
 */
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { UiInput, UiButton } from '@/components/ui'
import { TimePicker } from '@/components/pickers'
import { CalendarDropdown } from '@/components/pickers'

const props = defineProps<{
  mode: 'create' | 'edit'
  initialData?: {
    masterId?: number
    workersCount?: number
    shiftStartDate?: string
    shiftStartTime?: string
    shiftDurationHours?: number
  }
}>()

const emit = defineEmits<{
  (e: 'submit', data: {
    master_id: number
    workers_count: number
    shift_start_date: string
    shift_start_time: string
    shift_duration_hours: number
  }): void
  (e: 'cancel'): void
}>()

const store = useResourcesStore()
const { masters, isOperationLoading } = storeToRefs(store)

// Form state
const selectedMasterId = ref<number | null>(null)
const workersCount = ref<number | string>('')
const shiftStartDate = ref('')
const shiftStartTime = ref('')
const shiftDurationHours = ref<number | string>('')

// Calendar state
const isCalendarOpen = ref(false)
const calendarAnchorRect = ref<DOMRect | null>(null)
const datePickerRef = ref<HTMLElement | null>(null)

// Computed
const formattedDate = computed(() => {
  if (!shiftStartDate.value) return ''
  const d = new Date(shiftStartDate.value)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const isValid = computed(() => {
  if (!selectedMasterId.value) return false
  const workers = Number(workersCount.value)
  if (workersCount.value === '' || isNaN(workers) || workers < 0) return false
  if (!shiftStartDate.value) return false
  if (!shiftStartTime.value) return false
  const duration = Number(shiftDurationHours.value)
  if (!duration || duration <= 0) return false
  
  return true
})

// Initialize from initial data
onMounted(() => {
  if (props.initialData) {
    selectedMasterId.value = props.initialData.masterId ?? null
    workersCount.value = props.initialData.workersCount ?? ''
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
    master_id: selectedMasterId.value!,
    workers_count: Number(workersCount.value),
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
  <form class="master-form" @submit.prevent="handleSubmit">
    <div class="master-form__grid">
      <!-- Master -->
      <div class="master-form__field">
        <label class="master-form__label">ФИО мастера</label>
        <select 
          v-model="selectedMasterId" 
          class="master-form__select"
          :disabled="mode === 'edit'"
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
      </div>

      <!-- Workers Count -->
      <div class="master-form__field">
        <label class="master-form__label">Количество рабочих</label>
        <UiInput 
          v-model="workersCount"
          type="number"
          placeholder="Без учета мастера"
          :min="0"
        />
      </div>

      <!-- Date -->
      <div class="master-form__field">
        <label class="master-form__label">Дата начала работы</label>
        <button 
          ref="datePickerRef"
          type="button" 
          class="master-form__date-btn"
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
      <div class="master-form__field">
        <label class="master-form__label">Время начала работы</label>
        <TimePicker 
          v-model="shiftStartTime"
          placeholder="Выберите время"
          :minuteStep="15"
        />
      </div>

      <!-- Duration -->
      <div class="master-form__field">
        <label class="master-form__label">Продолжительность (ч)</label>
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

    <div class="master-form__actions">
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
.master-form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.master-form__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gap-md) var(--gap-lg);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.master-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: 0;
}

/* Все блоки ввода одной ширины — растягиваем на всю ячейку грида */
.master-form__field .master-form__select,
.master-form__field .master-form__date-btn {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.master-form__field :deep(.time-picker),
.master-form__field :deep(.ui-input) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.master-form__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.master-form__select {
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

.master-form__date-btn {
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

.master-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}
</style>
