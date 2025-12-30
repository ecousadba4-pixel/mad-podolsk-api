/**
 * Централизованный экспорт утилит
 * @module utils
 */

// Форматирование чисел и валют
export { 
  formatMoney, 
  formatNumber, 
  formatPercent,
  formatCompact,
  formatDate,
  formatDateTime
} from './format'

/**
 * Debounce функция для оптимизации частых вызовов
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T, 
  ms = 300
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, ms)
  }) as T & { cancel: () => void }
  
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return debounced
}

/**
 * Throttle функция для ограничения частоты вызовов
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T, 
  ms = 100
): T {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = ms - (now - lastCall)
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      fn(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn(...args)
      }, remaining)
    }
  }) as T
}

/**
 * Проверяет, пустой ли объект
 */
export function isEmpty(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj) return true
  return Object.keys(obj).length === 0
}

/**
 * Глубокое клонирование объекта
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Безопасное получение значения из объекта по пути
 */
export function get<T = unknown>(
  obj: Record<string, unknown>, 
  path: string, 
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let result: unknown = obj
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue
    }
    result = (result as Record<string, unknown>)[key]
  }
  
  return (result as T) ?? defaultValue
}

/**
 * Группировка массива по ключу
 */
export function groupBy<T>(
  arr: T[], 
  keyFn: (item: T) => string
): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

/**
 * Уникальные элементы массива по ключу
 */
export function uniqBy<T>(arr: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set()
  return arr.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
