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

type Formattable = number | string | null | undefined

/**
 * Форматирует число как денежную сумму в русской локали
 */
export function formatMoney(value: Formattable): string {
  if (value == null) return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return moneyFormatter.format(n)
}

/**
 * Форматирует число в русской локали
 */
export function formatNumber(value: Formattable): string {
  if (value == null) return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return numberFormatter.format(n)
}

/**
 * Форматирует большие числа в компактном виде (1.2 млн, 500 тыс)
 */
export function formatCompact(value: Formattable): string {
  if (value == null) return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return compactFormatter.format(n)
}

/**
 * Форматирует число как процент
 * @param value - значение (0-1 или 0-100)
 * @param isDecimal - если true, умножает на 100
 */
export function formatPercent(value: number | null | undefined, isDecimal = true): string {
  if (value == null) return '-'
  const n = isDecimal ? Math.round(value * 100) : Math.round(value)
  return `${n}\u00a0%` // Неразрывный пробел перед %
}

/**
 * Форматирует дату в русской локали
 */
export function formatDate(
  value: string | Date | null | undefined, 
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
): string {
  if (value == null) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('ru-RU', options)
}

/**
 * Форматирует дату в коротком формате ДД.ММ.ГГ (например 08.02.26)
 */
export function formatDateShort(value: string | Date | null | undefined): string {
  if (value == null) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  return `${dd}.${mm}.${yy}`
}

/**
 * Форматирует дату и время
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (value == null) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
