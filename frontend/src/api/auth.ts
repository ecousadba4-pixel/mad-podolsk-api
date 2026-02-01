/**
 * API functions for authentication and user management
 */

import { request, API_VERSION } from './client'

const API_BASE = `/api/${API_VERSION}/auth`

// --- Types ---

export interface UserInfo {
  user_id: number
  login: string
  full_name: string | null
  role: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user: UserInfo | null
}

export interface CurrentUserResponse {
  user: UserInfo
  role: string
}

export interface UserListItem {
  user_id: number
  login: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string | null
}

export interface UserListResponse {
  users: UserListItem[]
  total: number
}

export interface UserResponse {
  success: boolean
  message: string
  user: UserListItem | null
}

export interface UserCreateData {
  login: string
  full_name?: string
  password: string
  role: string
  is_active?: boolean
}

export interface UserUpdateData {
  login?: string
  full_name?: string
  role?: string
  is_active?: boolean
}

// --- API Functions ---

/**
 * Login with credentials
 */
export async function login(loginName: string, password: string): Promise<LoginResponse> {
  return await request<LoginResponse>(`${API_BASE}/login`, {
    method: 'POST',
    body: { login: loginName, password } as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ success: boolean; message: string }> {
  return await request<{ success: boolean; message: string }>(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return await request<CurrentUserResponse>(`${API_BASE}/me`, {
    credentials: 'include',
  })
}

/**
 * Get list of users (admin only)
 */
export async function getUsers(params?: {
  search?: string
  role?: string
  is_active?: boolean
}): Promise<UserListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.set('search', params.search)
  if (params?.role) queryParams.set('role', params.role)
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  
  const queryString = queryParams.toString()
  const url = queryString ? `${API_BASE}/users?${queryString}` : `${API_BASE}/users`
  
  return await request<UserListResponse>(url, {
    credentials: 'include',
  })
}

/**
 * Create new user (admin only)
 */
export async function createUser(data: UserCreateData): Promise<UserResponse> {
  return await request<UserResponse>(`${API_BASE}/users`, {
    method: 'POST',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Update user (admin only)
 */
export async function updateUser(userId: number, data: UserUpdateData): Promise<UserResponse> {
  return await request<UserResponse>(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    body: data as unknown as BodyInit,
    credentials: 'include',
  })
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(userId: number, newPassword: string): Promise<UserResponse> {
  return await request<UserResponse>(`${API_BASE}/users/${userId}/reset-password`, {
    method: 'POST',
    body: { new_password: newPassword } as unknown as BodyInit,
    credentials: 'include',
  })
}
