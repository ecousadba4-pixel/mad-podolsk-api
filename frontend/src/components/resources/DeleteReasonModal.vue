<script setup lang="ts">
/**
 * DeleteReasonModal — модальное окно для ввода причины удаления
 */
import { ref, computed } from 'vue'
import { UiInput, UiButton } from '@/components/ui'

const props = defineProps<{
  isOpen: boolean
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm', reason: string): void
  (e: 'cancel'): void
}>()

const reason = ref('')

const isValid = computed(() => {
  const trimmed = reason.value.trim()
  return trimmed.length >= 5 && trimmed.length <= 100
})

const errorMessage = computed(() => {
  const trimmed = reason.value.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.length < 5) return 'Минимум 5 символов'
  if (trimmed.length > 100) return 'Максимум 100 символов'
  return ''
})

function handleConfirm() {
  if (!isValid.value) return
  emit('confirm', reason.value.trim())
}

function handleCancel() {
  reason.value = ''
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="delete-modal-overlay" @click.self="handleCancel">
        <div class="delete-modal">
          <div class="delete-modal__header">
            <h3 class="delete-modal__title">Удаление записи</h3>
          </div>
          
          <div class="delete-modal__body">
            <p class="delete-modal__description">
              Укажите причину удаления записи (обязательно):
            </p>
            <div class="delete-modal__field">
              <UiInput
                v-model="reason"
                placeholder="Причина удаления (5-100 символов)"
                :error="!!errorMessage"
                :errorMessage="errorMessage"
                fullWidth
              />
              <span class="delete-modal__counter">{{ reason.trim().length }} / 100</span>
            </div>
          </div>

          <div class="delete-modal__actions">
            <UiButton variant="ghost" @click="handleCancel">
              Отмена
            </UiButton>
            <UiButton 
              variant="danger" 
              :disabled="!isValid || isLoading"
              :loading="isLoading"
              @click="handleConfirm"
            >
              Удалить запись
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.delete-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  padding: var(--gap-lg);
}

.delete-modal {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-strong);
  overflow: hidden;
}

.delete-modal__header {
  padding: var(--gap-lg);
  border-bottom: 1px solid var(--border-soft);
}

.delete-modal__title {
  margin: 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.delete-modal__body {
  padding: var(--gap-lg);
}

.delete-modal__description {
  margin: 0 0 var(--gap-md) 0;
  font-size: var(--font-size-body-sm);
  color: var(--text-muted);
}

.delete-modal__field {
  position: relative;
}

.delete-modal__counter {
  position: absolute;
  right: var(--gap-sm);
  bottom: calc(-1 * var(--gap-md) - var(--font-size-caption));
  font-size: var(--font-size-tiny);
  color: var(--text-faint);
}

.delete-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding: var(--gap-lg);
  border-top: 1px solid var(--border-soft);
  background: var(--bg-muted);
}

/* Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .delete-modal,
.modal-fade-leave-active .delete-modal {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .delete-modal,
.modal-fade-leave-to .delete-modal {
  transform: scale(0.95);
}
</style>
