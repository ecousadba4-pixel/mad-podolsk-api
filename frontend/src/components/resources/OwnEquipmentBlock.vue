<script setup lang="ts">
/**
 * OwnEquipmentBlock — блок "Собственная техника" с кнопками операций
 */
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { useToast } from '@/composables/useToast'
import { UiButton, UiCard } from '@/components/ui'
import EquipmentForm from './EquipmentForm.vue'
import ShiftSearchForm from './ShiftSearchForm.vue'
import DeleteReasonModal from './DeleteReasonModal.vue'

type OperationMode = 'none' | 'create' | 'edit' | 'delete'

const store = useResourcesStore()
const { currentEquipmentShift, isOperationLoading, operationError } = storeToRefs(store)
const toast = useToast()

const activeMode = ref<OperationMode>('none')
const showDeleteModal = ref(false)
const foundShiftForEdit = ref(false)
const foundShiftForDelete = ref(false)

const editInitialData = computed(() => {
  if (!currentEquipmentShift.value) return undefined
  const shift = currentEquipmentShift.value
  return {
    equipmentTypeId: shift.equipment_type_id,
    vehicleId: shift.vehicle_id ?? undefined,
    plateNumber: shift.plate_number,
    driverId: shift.driver_id ?? undefined,
    driverName: shift.driver_name ?? undefined,
    shiftStartDate: shift.shift_start_date,
    shiftStartTime: shift.shift_start_time.slice(0, 5),
    shiftDurationHours: shift.shift_duration_hours,
  }
})

function startCreate() {
  activeMode.value = 'create'
  store.clearCurrentShifts()
}

function startEdit() {
  activeMode.value = 'edit'
  foundShiftForEdit.value = false
  store.clearCurrentShifts()
}

function startDelete() {
  activeMode.value = 'delete'
  foundShiftForDelete.value = false
  store.clearCurrentShifts()
}

function cancelOperation() {
  activeMode.value = 'none'
  foundShiftForEdit.value = false
  foundShiftForDelete.value = false
  store.clearCurrentShifts()
}

async function handleCreate(data: any) {
  const result = await store.createEquipmentShift(data)
  if (result) {
    toast.success('Запись техники окончена')
    cancelOperation()
  } else {
    toast.error(operationError.value || 'Ошибка создания записи')
  }
}

async function handleCreateAndNext(data: any) {
  const result = await store.createEquipmentShift(data)
  if (result) {
    toast.success('Запись сохранена')
    store.clearCurrentShifts()
    // Form will reset itself as initialData is now undefined
  } else {
    toast.error(operationError.value || 'Ошибка создания записи')
  }
}

async function handleSearch(data: { identifier: string | number; date: string }) {
  const result = await store.searchEquipmentShift(data.identifier as string, data.date)
  if (result) {
    if (activeMode.value === 'edit') {
      foundShiftForEdit.value = true
    } else if (activeMode.value === 'delete') {
      foundShiftForDelete.value = true
    }
  } else {
    toast.error('Запись не найдена')
  }
}

async function handleUpdate(data: any) {
  if (!currentEquipmentShift.value) return
  
  const result = await store.updateEquipmentShift(currentEquipmentShift.value.id, {
    equipment_type_id: data.equipment_type_id,
    driver_id: data.driver_id,
    driver_name: data.driver_name,
    shift_start_time: data.shift_start_time,
    shift_duration_hours: data.shift_duration_hours,
  })
  
  if (result) {
    toast.success('Запись обновлена')
    cancelOperation()
  } else {
    toast.error(operationError.value || 'Ошибка обновления записи')
  }
}

function openDeleteModal() {
  showDeleteModal.value = true
}

async function handleDelete(reason: string) {
  if (!currentEquipmentShift.value) return
  
  const success = await store.deleteEquipmentShift(currentEquipmentShift.value.id, reason)
  if (success) {
    toast.success('Запись удалена')
    showDeleteModal.value = false
    cancelOperation()
  } else {
    toast.error(operationError.value || 'Ошибка удаления записи')
  }
}
</script>

<template>
  <UiCard class="equipment-block">
    <div class="equipment-block__header">
      <h3 class="equipment-block__title">Собственная техника</h3>
    </div>

    <!-- Action buttons -->
    <div v-if="activeMode === 'none'" class="equipment-block__actions">
      <UiButton variant="primary" @click="startCreate">
        Новая запись
      </UiButton>
      <UiButton variant="secondary" @click="startEdit">
        Редактирование
      </UiButton>
      <UiButton variant="secondary" @click="startDelete">
        Удалить запись
      </UiButton>
    </div>

    <!-- Create mode -->
    <div v-else-if="activeMode === 'create'" class="equipment-block__form-area">
      <EquipmentForm
        :isOwn="true"
        mode="create"
        @submit="handleCreate"
        @cancel="cancelOperation"
      >
        <template #extra-actions>
          <UiButton 
            variant="secondary" 
            :disabled="isOperationLoading"
            @click.prevent="(e: Event) => {
              e.preventDefault()
              const form = (e.target as HTMLElement).closest('form')
              if (form) {
                const formData = new FormData(form)
                // Trigger form validation and get data through custom event
              }
            }"
          >
            Записать и добавить следующую
          </UiButton>
        </template>
      </EquipmentForm>
    </div>

    <!-- Edit mode - Search -->
    <div v-else-if="activeMode === 'edit' && !foundShiftForEdit" class="equipment-block__form-area">
      <ShiftSearchForm
        type="equipment"
        @search="handleSearch"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Edit mode - Edit form -->
    <div v-else-if="activeMode === 'edit' && foundShiftForEdit" class="equipment-block__form-area">
      <EquipmentForm
        :isOwn="true"
        mode="edit"
        :initialData="editInitialData"
        @submit="handleUpdate"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Delete mode - Search -->
    <div v-else-if="activeMode === 'delete' && !foundShiftForDelete" class="equipment-block__form-area">
      <ShiftSearchForm
        type="equipment"
        @search="handleSearch"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Delete mode - Show record and delete button -->
    <div v-else-if="activeMode === 'delete' && foundShiftForDelete" class="equipment-block__form-area">
      <div class="equipment-block__found-record">
        <h4>Найденная запись:</h4>
        <dl class="equipment-block__record-details">
          <div>
            <dt>Гос. номер:</dt>
            <dd>{{ currentEquipmentShift?.plate_number }}</dd>
          </div>
          <div>
            <dt>Тип:</dt>
            <dd>{{ currentEquipmentShift?.equipment_type_name }}</dd>
          </div>
          <div>
            <dt>Дата:</dt>
            <dd>{{ currentEquipmentShift?.shift_start_date }}</dd>
          </div>
          <div>
            <dt>Время:</dt>
            <dd>{{ currentEquipmentShift?.shift_start_time.slice(0, 5) }}</dd>
          </div>
          <div>
            <dt>Продолжительность:</dt>
            <dd>{{ currentEquipmentShift?.shift_duration_hours }} ч</dd>
          </div>
        </dl>
        <div class="equipment-block__delete-actions">
          <UiButton variant="ghost" @click="cancelOperation">
            Отмена
          </UiButton>
          <UiButton variant="danger" @click="openDeleteModal">
            Удалить запись
          </UiButton>
        </div>
      </div>
    </div>

    <DeleteReasonModal
      :isOpen="showDeleteModal"
      :isLoading="isOperationLoading"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </UiCard>
</template>

<style scoped lang="scss">
.equipment-block {
  padding: var(--card-padding);
}

.equipment-block__header {
  margin-bottom: var(--gap-lg);
}

.equipment-block__title {
  margin: 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.equipment-block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-md);
}

.equipment-block__form-area {
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}

.equipment-block__found-record {
  h4 {
    margin: 0 0 var(--gap-md) 0;
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--text-main);
  }
}

.equipment-block__record-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--gap-sm) var(--gap-lg);
  margin: 0 0 var(--gap-lg) 0;

  > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  dt {
    font-size: var(--font-size-caption);
    color: var(--text-muted);
  }

  dd {
    margin: 0;
    font-size: var(--font-size-body-sm);
    font-weight: 500;
    color: var(--text-main);
  }
}

.equipment-block__delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}
</style>
