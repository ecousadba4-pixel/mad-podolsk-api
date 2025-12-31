import { ref, readonly, type Ref } from 'vue'
import { ApiError } from '../api/client'
import { toast } from './useToast'

// ============================================================================
// TYPES
// ============================================================================

export interface AppError {
  id: string
  message: string
  code?: string
  status?: number
  url?: string
  timestamp: number
  stack?: string
}

export interface ErrorHandlerOptions {
  /** Показывать toast автоматически */
  showToast?: boolean
  /** Логировать в консоль */
  logToConsole?: boolean
  /** Кастомное сообщение для пользователя */
  userMessage?: string
  /** Не показывать ошибку пользователю */
  silent?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос',
  401: 'Требуется авторизация',
  403: 'Доступ запрещён',
  404: 'Данные не найдены',
  408: 'Превышено время ожидания',
  429: 'Слишком много запросов, попробуйте позже',
  500: 'Ошибка сервера',
  502: 'Сервер временно недоступен',
  503: 'Сервис недоступен',
  504: 'Превышено время ожидания сервера'
}

const NETWORK_ERROR_MESSAGE = 'Проверьте подключение к интернету'
const UNKNOWN_ERROR_MESSAGE = 'Произошла непредвиденная ошибка'

// ============================================================================
// STATE
// ============================================================================

const errors = ref<AppError[]>([])
const lastError = ref<AppError | null>(null)

let errorIdCounter = 0
const generateErrorId = (): string => `err-${++errorIdCounter}-${Date.now()}`

// ============================================================================
// HELPERS
// ============================================================================

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) return true
  if (error instanceof ApiError && !error.status) return true
  return false
}

function getHumanReadableMessage(error: unknown, options?: ErrorHandlerOptions): string {
  if (options?.userMessage) return options.userMessage

  // ApiError с кодом статуса
  if (error instanceof ApiError) {
    if (error.status && error.status in ERROR_MESSAGES) {
      return ERROR_MESSAGES[error.status] as string
    }
    if (!error.status) {
      return NETWORK_ERROR_MESSAGE
    }
  }

  // Сетевые ошибки
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE
  }

  // AbortError игнорируем
  if (error instanceof Error && error.name === 'AbortError') {
    return '' // Пустая строка - не показываем
  }

  // Стандартная ошибка
  if (error instanceof Error) {
    // Не показываем технические сообщения пользователю
    const msg = error.message
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('CORS')) {
      return NETWORK_ERROR_MESSAGE
    }
    // Возвращаем сообщение только если оно понятное
    if (msg.length < 100 && !msg.includes('Error:')) {
      return msg
    }
  }

  return UNKNOWN_ERROR_MESSAGE
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Централизованная обработка ошибок
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): AppError | null {
  const {
    showToast = true,
    logToConsole = true,
    silent = false
  } = options

  // Игнорируем отменённые запросы
  if (error instanceof Error && error.name === 'AbortError') {
    return null
  }

  // Логируем в консоль
  if (logToConsole) {
    console.error('[ErrorHandler]', error)
  }

  // Формируем объект ошибки
  const appError: AppError = {
    id: generateErrorId(),
    message: getHumanReadableMessage(error, options),
    timestamp: Date.now(),
    status: error instanceof ApiError ? error.status : undefined,
    url: error instanceof ApiError ? error.url : undefined,
    stack: error instanceof Error ? error.stack : undefined
  }

  // Сохраняем в историю
  errors.value = [appError, ...errors.value].slice(0, 50) // Храним последние 50
  lastError.value = appError

  // Показываем toast если нужно
  if (!silent && showToast && appError.message) {
    const isNetworkErr = isNetworkError(error)
    toast.error(appError.message, {
      duration: isNetworkErr ? 8000 : 6000,
      action: isNetworkErr ? {
        label: 'Повторить',
        handler: () => window.location.reload()
      } : undefined
    })
  }

  return appError
}

/**
 * Обёртка для async функций с автоматической обработкой ошибок
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: ErrorHandlerOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, options)
      throw error
    }
  }) as T
}

/**
 * Очистить историю ошибок
 */
export function clearErrors(): void {
  errors.value = []
  lastError.value = null
}

// ============================================================================
// COMPOSABLE
// ============================================================================

export interface UseErrorHandlerReturn {
  errors: Readonly<Ref<readonly AppError[]>>
  lastError: Readonly<Ref<AppError | null>>
  handleError: typeof handleError
  clearErrors: typeof clearErrors
  withErrorHandling: typeof withErrorHandling
}

export function useErrorHandler(): UseErrorHandlerReturn {
  return {
    errors: readonly(errors),
    lastError: readonly(lastError),
    handleError,
    clearErrors,
    withErrorHandling
  }
}
