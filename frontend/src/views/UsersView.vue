<script setup lang="ts">
/**
 * UsersView — Раздел управления пользователями (только для админов)
 */
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import { storeToRefs } from 'pinia'
import { UiButton, UiInput, UiCard } from '@/components/ui'
import { TableSkeleton, EmptyState } from '@/components/common'
import type { UserListItem, UserCreateData, UserUpdateData } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()
const { users, usersTotal, isLoading, isAdmin } = storeToRefs(authStore)

// State
const searchQuery = ref('')
const roleFilter = ref<string | null>(null)
const statusFilter = ref<boolean | null>(null)

// Modal state
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingUser = ref<UserListItem | null>(null)

// Form state
const formLogin = ref('')
const formFullName = ref('')
const formPassword = ref('')
const formRole = ref<'admin' | 'user'>('user')
const formIsActive = ref(true)
const formError = ref<string | null>(null)

// Password reset modal
const showPasswordModal = ref(false)
const passwordResetUserId = ref<number | null>(null)
const newPassword = ref('')
const passwordError = ref<string | null>(null)

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function fetchUsers() {
  const params: { search?: string; role?: string; is_active?: boolean } = {}
  if (searchQuery.value.length >= 2) {
    params.search = searchQuery.value
  }
  if (roleFilter.value) {
    params.role = roleFilter.value
  }
  if (statusFilter.value !== null) {
    params.is_active = statusFilter.value
  }
  await authStore.fetchUsers(params)
}

// Watch for filter changes
watch([roleFilter, statusFilter], () => {
  fetchUsers()
})

// Debounced search
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchUsers()
  }, 300)
})

function openCreateModal() {
  modalMode.value = 'create'
  editingUser.value = null
  formLogin.value = ''
  formFullName.value = ''
  formPassword.value = ''
  formRole.value = 'user'
  formIsActive.value = true
  formError.value = null
  showModal.value = true
}

function openEditModal(user: UserListItem) {
  modalMode.value = 'edit'
  editingUser.value = user
  formLogin.value = user.login
  formFullName.value = user.full_name || ''
  formPassword.value = ''
  formRole.value = user.role as 'admin' | 'user'
  formIsActive.value = user.is_active
  formError.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
}

async function handleSubmit() {
  formError.value = null

  if (!formLogin.value.trim()) {
    formError.value = 'Логин обязателен'
    return
  }

  if (modalMode.value === 'create' && !formPassword.value) {
    formError.value = 'Пароль обязателен'
    return
  }

  if (modalMode.value === 'create' && formPassword.value.length < 4) {
    formError.value = 'Пароль должен быть минимум 4 символа'
    return
  }

  if (modalMode.value === 'create') {
    const data: UserCreateData = {
      login: formLogin.value.trim(),
      full_name: formFullName.value.trim() || undefined,
      password: formPassword.value,
      role: formRole.value,
      is_active: formIsActive.value,
    }
    const result = await authStore.createUser(data)
    if (result.success) {
      closeModal()
    } else {
      formError.value = result.message
    }
  } else if (editingUser.value) {
    const data: UserUpdateData = {
      login: formLogin.value.trim(),
      full_name: formFullName.value.trim() || undefined,
      role: formRole.value,
      is_active: formIsActive.value,
    }
    const result = await authStore.updateUser(editingUser.value.user_id, data)
    if (result.success) {
      closeModal()
    } else {
      formError.value = result.message
    }
  }
}

function openPasswordResetModal(user: UserListItem) {
  passwordResetUserId.value = user.user_id
  newPassword.value = ''
  passwordError.value = null
  showPasswordModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  passwordResetUserId.value = null
}

async function handlePasswordReset() {
  passwordError.value = null

  if (!newPassword.value || newPassword.value.length < 4) {
    passwordError.value = 'Пароль должен быть минимум 4 символа'
    return
  }

  if (passwordResetUserId.value) {
    const result = await authStore.resetPassword(passwordResetUserId.value, newPassword.value)
    if (result.success) {
      closePasswordModal()
    } else {
      passwordError.value = result.message
    }
  }
}

function getRoleLabel(role: string): string {
  return role === 'admin' ? 'Администратор' : 'Пользователь'
}

function getStatusLabel(isActive: boolean): string {
  return isActive ? 'Активен' : 'Заблокирован'
}

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  // Check if user is admin
  if (!isAdmin.value) {
    router.push('/')
    return
  }
  await fetchUsers()
})
</script>

<template>
  <div class="users-view">
    <div class="users-view__header">
      <div class="users-view__title-row">
        <h2 class="users-view__title">Пользователи</h2>
        <span class="users-view__count">{{ usersTotal }} записей</span>
      </div>
      <UiButton variant="primary" size="md" @click="openCreateModal">
        Создать пользователя
      </UiButton>
    </div>

    <!-- Filters -->
    <UiCard class="users-view__filters">
      <div class="users-filters">
        <div class="users-filters__item users-filters__item--search">
          <label class="users-filters__label">Поиск</label>
          <UiInput 
            v-model="searchQuery" 
            placeholder="Логин или ФИО..."
            class="users-filters__input"
          />
        </div>

        <div class="users-filters__item">
          <label class="users-filters__label">Роль</label>
          <select v-model="roleFilter" class="users-filters__select">
            <option :value="null">Все роли</option>
            <option value="admin">Администратор</option>
            <option value="user">Пользователь</option>
          </select>
        </div>

        <div class="users-filters__item">
          <label class="users-filters__label">Статус</label>
          <select v-model="statusFilter" class="users-filters__select">
            <option :value="null">Все статусы</option>
            <option :value="true">Активен</option>
            <option :value="false">Заблокирован</option>
          </select>
        </div>
      </div>
    </UiCard>

    <!-- Table -->
    <UiCard class="users-view__table-card">
      <TableSkeleton v-if="isLoading" :rows="10" :cols="6" />
      
      <EmptyState 
        v-else-if="users.length === 0" 
        title="Пользователи не найдены"
        description="Попробуйте изменить параметры поиска или фильтры"
      />

      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Последнее посещение</th>
              <th class="users-table__col-actions">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.user_id">
              <td>{{ user.full_name || '—' }}</td>
              <td>{{ user.login }}</td>
              <td>
                <span 
                  class="users-table__badge"
                  :class="user.role === 'admin' ? 'users-table__badge--admin' : 'users-table__badge--user'"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td>
                <span 
                  class="users-table__badge"
                  :class="user.is_active ? 'users-table__badge--active' : 'users-table__badge--blocked'"
                >
                  {{ getStatusLabel(user.is_active) }}
                </span>
              </td>
              <td class="users-table__col-last-visit">
                {{ formatLastVisit(user.last_visit) }}
              </td>
              <td class="users-table__col-actions">
                <div class="users-table__actions">
                  <button class="users-table__action-btn" @click="openEditModal(user)" title="Редактировать">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="users-table__action-btn" @click="openPasswordResetModal(user)" title="Сбросить пароль">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">
                {{ modalMode === 'create' ? 'Создание пользователя' : 'Редактирование пользователя' }}
              </h3>
              <button class="modal__close" @click="closeModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <form class="modal__form" @submit.prevent="handleSubmit">
              <div class="modal__field">
                <label class="modal__label">ФИО</label>
                <UiInput v-model="formFullName" placeholder="Иванов Иван Иванович" />
              </div>

              <div class="modal__field">
                <label class="modal__label">Логин *</label>
                <UiInput v-model="formLogin" placeholder="ivan.ivanov" />
              </div>

              <div v-if="modalMode === 'create'" class="modal__field">
                <label class="modal__label">Пароль *</label>
                <UiInput v-model="formPassword" type="password" placeholder="Минимум 4 символа" />
              </div>

              <div class="modal__field">
                <label class="modal__label">Роль</label>
                <select v-model="formRole" class="modal__select">
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div class="modal__field">
                <label class="modal__checkbox-label">
                  <input type="checkbox" v-model="formIsActive" />
                  <span>Активен</span>
                </label>
              </div>

              <div v-if="formError" class="modal__error">
                {{ formError }}
              </div>

              <div class="modal__actions">
                <UiButton variant="secondary" @click="closeModal" type="button">
                  Отмена
                </UiButton>
                <UiButton variant="primary" :loading="isLoading" type="submit">
                  {{ modalMode === 'create' ? 'Создать' : 'Сохранить' }}
                </UiButton>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Password Reset Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showPasswordModal" class="modal-overlay" @click.self="closePasswordModal">
          <div class="modal modal--small">
            <div class="modal__header">
              <h3 class="modal__title">Сброс пароля</h3>
              <button class="modal__close" @click="closePasswordModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <form class="modal__form" @submit.prevent="handlePasswordReset">
              <div class="modal__field">
                <label class="modal__label">Новый пароль *</label>
                <UiInput v-model="newPassword" type="password" placeholder="Минимум 4 символа" />
              </div>

              <div v-if="passwordError" class="modal__error">
                {{ passwordError }}
              </div>

              <div class="modal__actions">
                <UiButton variant="secondary" @click="closePasswordModal" type="button">
                  Отмена
                </UiButton>
                <UiButton variant="primary" :loading="isLoading" type="submit">
                  Сбросить
                </UiButton>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.users-view {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}

.users-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-md);
  flex-wrap: wrap;
}

.users-view__title-row {
  display: flex;
  align-items: baseline;
  gap: var(--gap-md);
}

.users-view__title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-main);
}

.users-view__count {
  font-size: var(--font-size-body-sm);
  color: var(--text-muted);
}

.users-view__filters {
  padding: var(--card-padding);
}

.users-filters {
  display: flex;
  align-items: flex-end;
  gap: var(--gap-lg);
  flex-wrap: wrap;
}

.users-filters__item {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: 150px;

  &--search {
    flex: 1;
    min-width: 200px;
    max-width: 300px;
  }
}

.users-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.users-filters__input {
  width: 100%;
}

.users-filters__select {
  height: var(--control-height-sm);
  padding: 0 var(--gap-md);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  cursor: pointer;
}

.users-view__table-card {
  padding: 0;
  overflow: hidden;
}

.users-table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-body-sm);

  th, td {
    padding: var(--gap-md) var(--gap-lg);
    text-align: left;
    border-bottom: 1px solid var(--border-soft);
  }

  th {
    background: var(--bg-muted);
    font-weight: 600;
    color: var(--text-muted);
    font-size: var(--font-size-caption);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  tbody tr {
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--overlay-dark-hover);
    }
  }

  td {
    color: var(--text-main);
  }
}

.users-table__col-actions {
  width: 100px;
  text-align: center;
}

.users-table__col-last-visit {
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--font-size-caption);
}

.users-table__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-sm);
}

.users-table__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--overlay-dark-hover);
    color: var(--text-main);
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

.users-table__badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-caption);
  font-weight: 500;

  &--admin {
    background: var(--overlay-accent-soft);
    color: var(--accent);
  }

  &--user {
    background: var(--overlay-dark-hover);
    color: var(--text-muted);
  }

  &--active {
    background: var(--overlay-success-soft);
    color: var(--success);
  }

  &--blocked {
    background: var(--overlay-dark-hover);
    color: var(--danger);
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay-backdrop);
  z-index: 1000;
  padding: var(--gap-lg);
}

.modal {
  width: 100%;
  max-width: 480px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-strong);
  overflow: hidden;

  &--small {
    max-width: 360px;
  }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-lg);
  border-bottom: 1px solid var(--border-soft);
}

.modal__title {
  margin: 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--overlay-dark-hover);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
  padding: var(--gap-lg);
}

.modal__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.modal__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.modal__select {
  height: var(--control-height-sm);
  padding: 0 var(--gap-md);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  cursor: pointer;
}

.modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.modal__error {
  padding: var(--gap-md);
  background: var(--overlay-dark-hover);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: var(--font-size-body-sm);
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-md);
  padding-top: var(--gap-md);
}

/* Modal animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .users-view__header {
    flex-direction: column;
    align-items: stretch;
  }

  .users-view__title-row {
    justify-content: space-between;
  }

  .users-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .users-filters__item {
    min-width: 100%;

    &--search {
      max-width: none;
    }
  }
}
</style>
