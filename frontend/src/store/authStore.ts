/**
 * Authentication store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { UserInfo, UserListItem } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<UserInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const users = ref<UserListItem[]>([])
  const usersTotal = ref(0)

  // --- Computed ---
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userRole = computed(() => user.value?.role || null)

  // --- Actions ---

  /**
   * Initialize auth state by checking current session
   */
  async function init() {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.user
    } catch (e) {
      // Not authenticated - this is normal
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Login with credentials
   */
  async function login(loginName: string, password: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.login(loginName, password)
      if (response.success && response.user) {
        user.value = response.user
        return true
      } else {
        error.value = response.message
        return false
      }
    } catch (e) {
      error.value = 'Ошибка при входе в систему'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout current user
   */
  async function logout() {
    isLoading.value = true
    try {
      await authApi.logout()
    } catch (e) {
      // Ignore logout errors
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  /**
   * Fetch users list (admin only)
   */
  async function fetchUsers(params?: {
    search?: string
    role?: string
    is_active?: boolean
  }) {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.getUsers(params)
      users.value = response.users
      usersTotal.value = response.total
    } catch (e) {
      error.value = 'Ошибка при загрузке пользователей'
      users.value = []
      usersTotal.value = 0
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create new user (admin only)
   */
  async function createUser(data: authApi.UserCreateData): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.createUser(data)
      if (response.success) {
        await fetchUsers()
      }
      return { success: response.success, message: response.message }
    } catch (e) {
      return { success: false, message: 'Ошибка при создании пользователя' }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update user (admin only)
   */
  async function updateUser(userId: number, data: authApi.UserUpdateData): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.updateUser(userId, data)
      if (response.success) {
        await fetchUsers()
      }
      return { success: response.success, message: response.message }
    } catch (e) {
      return { success: false, message: 'Ошибка при обновлении пользователя' }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reset user password (admin only)
   */
  async function resetPassword(userId: number, newPassword: string): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    try {
      const response = await authApi.resetUserPassword(userId, newPassword)
      return { success: response.success, message: response.message }
    } catch (e) {
      return { success: false, message: 'Ошибка при сбросе пароля' }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    users,
    usersTotal,
    // Computed
    isAuthenticated,
    isAdmin,
    userRole,
    // Actions
    init,
    login,
    logout,
    fetchUsers,
    createUser,
    updateUser,
    resetPassword,
  }
})
