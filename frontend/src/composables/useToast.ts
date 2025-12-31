import { ref, type Ref, readonly, inject, provide, type InjectionKey } from 'vue'

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    handler: () => void
  }
}

export interface ToastOptions {
  type?: ToastType
  duration?: number
  dismissible?: boolean
  action?: Toast['action']
}

export interface ToastContext {
  toasts: Readonly<Ref<readonly Toast[]>>
  show: (message: string, options?: ToastOptions) => string
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => string
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => string
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => string
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOAST_KEY: InjectionKey<ToastContext> = Symbol('toast-context')

const DEFAULT_DURATION: Record<ToastType, number> = {
  info: 4000,
  success: 3000,
  warning: 5000,
  error: 6000
}

// ============================================================================
// STATE (singleton)
// ============================================================================

const toasts = ref<Toast[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

let idCounter = 0
const generateId = (): string => `toast-${++idCounter}-${Date.now()}`

// ============================================================================
// FUNCTIONS
// ============================================================================

function show(message: string, options: ToastOptions = {}): string {
  const {
    type = 'info',
    duration = DEFAULT_DURATION[type],
    dismissible = true,
    action
  } = options

  const id = generateId()

  const toast: Toast = {
    id,
    type,
    message,
    duration,
    dismissible,
    action
  }

  toasts.value = [...toasts.value, toast]

  // Автоматическое скрытие
  if (duration && duration > 0) {
    const timer = setTimeout(() => dismiss(id), duration)
    timers.set(id, timer)
  }

  return id
}

function dismiss(id: string): void {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function dismissAll(): void {
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
  toasts.value = []
}

function success(message: string, options?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...options, type: 'success' })
}

function error(message: string, options?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...options, type: 'error' })
}

function warning(message: string, options?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...options, type: 'warning' })
}

function info(message: string, options?: Omit<ToastOptions, 'type'>): string {
  return show(message, { ...options, type: 'info' })
}

// ============================================================================
// CONTEXT
// ============================================================================

const toastContext: ToastContext = {
  toasts: readonly(toasts),
  show,
  success,
  error,
  warning,
  info,
  dismiss,
  dismissAll
}

/**
 * Провайдер контекста toast (вызывать в App.vue)
 */
export function provideToast(): ToastContext {
  provide(TOAST_KEY, toastContext)
  return toastContext
}

/**
 * Хук для использования toast в компонентах
 */
export function useToast(): ToastContext {
  const ctx = inject(TOAST_KEY, null)
  // Fallback на глобальный контекст если inject не работает
  return ctx ?? toastContext
}

// Экспорт для прямого использования без inject
export const toast = toastContext
