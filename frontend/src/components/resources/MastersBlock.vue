<script setup lang="ts">
/**
 * MastersBlock — блок "Мастера" с кнопками операций
 */
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useResourcesStore } from '@/store/resourcesStore'
import { useToast } from '@/composables/useToast'
import { UiButton, UiCard } from '@/components/ui'
import MasterForm from './MasterForm.vue'
import ShiftSearchForm from './ShiftSearchForm.vue'
import DeleteReasonModal from './DeleteReasonModal.vue'

type OperationMode = 'none' | 'create' | 'edit' | 'delete'

const store = useResourcesStore()
const { currentMasterShift, isOperationLoading, operationError } = storeToRefs(store)
const toast = useToast()

const activeMode = ref<OperationMode>('none')
const showDeleteModal = ref(false)
const foundShiftForEdit = ref(false)
const foundShiftForDelete = ref(false)

const editInitialData = computed(() => {
  if (!currentMasterShift.value) return undefined
  const shift = currentMasterShift.value
  return {
    masterId: shift.master_id,
    workersCount: shift.workers_count,
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
  const result = await store.createMasterShift(data)
  if (result) {
    toast.success('Запись техники окончена')
    cancelOperation()
  } else {
    toast.error(operationError.value || 'Ошибка создания записи')
  }
}

async function handleSearch(data: { identifier: string | number; date: string }) {
  const result = await store.searchMasterShift(data.identifier as number, data.date)
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
  if (!currentMasterShift.value) return
  
  const result = await store.updateMasterShift(currentMasterShift.value.id, {
    workers_count: data.workers_count,
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
  if (!currentMasterShift.value) return
  
  const success = await store.deleteMasterShift(currentMasterShift.value.id, reason)
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
  <UiCard class="masters-block">
    <div class="masters-block__header">
      <h3 class="masters-block__title">Мастера</h3>
    </div>

    <!-- Action buttons -->
    <div v-if="activeMode === 'none'" class="masters-block__actions">
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
    <div v-else-if="activeMode === 'create'" class="masters-block__form-area">
      <MasterForm
        mode="create"
        @submit="handleCreate"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Edit mode - Search -->
    <div v-else-if="activeMode === 'edit' && !foundShiftForEdit" class="masters-block__form-area">
      <ShiftSearchForm
        type="master"
        @search="handleSearch"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Edit mode - Edit form -->
    <div v-else-if="activeMode === 'edit' && foundShiftForEdit" class="masters-block__form-area">
      <MasterForm
        mode="edit"
        :initialData="editInitialData"
        @submit="handleUpdate"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Delete mode - Search -->
    <div v-else-if="activeMode === 'delete' && !foundShiftForDelete" class="masters-block__form-area">
      <ShiftSearchForm
        type="master"
        @search="handleSearch"
        @cancel="cancelOperation"
      />
    </div>

    <!-- Delete mode - Show record and delete button -->
    <div v-else-if="activeMode === 'delete' && foundShiftForDelete" class="masters-block__form-area">
      <div class="masters-block__found-record">
        <h4>Найденная запись:</h4>
        <dl class="masters-block__record-details">
          <div>
            <dt>Мастер:</dt>
            <dd>{{ currentMasterShift?.master_full_name }}</dd>
          </div>
          <div>
            <dt>Количество рабочих:</dt>
            <dd>{{ currentMasterShift?.workers_count }}</dd>
          </div>
          <div>
            <dt>Дата:</dt>
            <dd>{{ currentMasterShift?.shift_start_date }}</dd>
          </div>
          <div>
            <dt>Время:</dt>
            <dd>{{ currentMasterShift?.shift_start_time.slice(0, 5) }}</dd>
          </div>
          <div>
            <dt>Продолжительность:</dt>
            <dd>{{ currentMasterShift?.shift_duration_hours }} ч</dd>
          </div>
        </dl>
        <div class="masters-block__delete-actions">
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
.masters-block {
  padding: var(--card-padding);
}

.masters-block__header {
  margin-bottom: var(--gap-lg);
}

.masters-block__title {
  margin: 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.masters-block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-md);
}

.masters-block__form-area {
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}

.masters-block__found-record {
  h4 {
    margin: 0 0 var(--gap-md) 0;
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--text-main);
  }
}

.masters-block__record-details {
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

.masters-block__delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding-top: var(--gap-md);
  border-top: 1px solid var(--border-soft);
}
</style>
