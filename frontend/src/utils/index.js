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
  formatDate
} from './format.js'

/**
 * Debounce функция для оптимизации частых вызовов
 * @template {(...args: any[]) => any} T
 * @param {T} fn - функция для debounce
 * @param {number} ms - задержка в мс
 * @returns {T & { cancel: () => void }}
 */
export function debounce(fn, ms = 300) {
  let timeoutId = null
  
  const debounced = (...args) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, ms)
  }
  
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
 * @template {(...args: any[]) => any} T
 * @param {T} fn - функция для throttle
 * @param {number} ms - минимальный интервал в мс
 * @returns {T}
 */
export function throttle(fn, ms = 100) {
  let lastCall = 0
  let timeoutId = null
  
  return (...args) => {
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
  }
}

/**
 * Проверяет, пустой ли объект
 * @param {Record<string, any>} obj 
 * @returns {boolean}
 */
export function isEmpty(obj) {
  if (!obj) return true
  return Object.keys(obj).length === 0
}

/**
 * Глубокое клонирование объекта (использует structuredClone если доступен)
 * @template T
 * @param {T} obj 
 * @returns {T}
 */
export function deepClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj))
}
