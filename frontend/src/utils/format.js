/**
 * Утилиты форматирования чисел и валют
 * @module utils/format
 */

// Кэшируем Intl.NumberFormat для производительности (создание форматтера - дорогая операция)
const moneyFormatter = new Intl.NumberFormat('ru-RU', { 
  maximumFractionDigits: 0, 
  minimumFractionDigits: 0 
})

const numberFormatter = new Intl.NumberFormat('ru-RU')

const compactFormatter = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1
})

/**
 * Форматирует число как денежную сумму в русской локали
 * @param {number|string|null|undefined} value - значение для форматирования
 * @returns {string} отформатированная строка или '-' если значение невалидно
 */
export function formatMoney(value) {
  if (value == null) return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return moneyFormatter.format(n)
}

/**
 * Форматирует число в русской локали (алиас для formatMoney)
 * @param {number|string|null|undefined} value - значение для форматирования
 * @returns {string} отформатированная строка или '-' если значение невалидно
 */
export function formatNumber(value) {
  if (value == null) return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return numberFormatter.format(n)
}

/**
 * Форматирует большие числа в компактном виде (1.2 млн, 500 тыс)
 * @param {number|string|null|undefined} value - значение для форматирования
 * @returns {string} отформатированная строка или '-'
 */
export function formatCompact(value) {
  if (value == null) return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return compactFormatter.format(n)
}

/**
 * Форматирует число как процент
 * @param {number|null|undefined} value - значение (0-1 или 0-100)
 * @param {boolean} isDecimal - если true, умножает на 100
 * @returns {string} отформатированный процент или '-'
 */
export function formatPercent(value, isDecimal = true) {
  if (value == null) return '-'
  const n = isDecimal ? Math.round(value * 100) : Math.round(value)
  return `${n}\u00a0%` // Неразрывный пробел перед %
}

/**
 * Форматирует дату в русской локали
 * @param {string|Date|null|undefined} value - дата
 * @param {Intl.DateTimeFormatOptions} [options] - опции форматирования
 * @returns {string} отформатированная дата или '-'
 */
export function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (value == null) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('ru-RU', options)
}
