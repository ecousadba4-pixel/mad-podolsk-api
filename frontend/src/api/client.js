// Простая обёртка над fetch с базовым URL и обработкой ошибок
// В development можно переопределить базу через Vite: VITE_API_BASE
//
// Прод-домен бэкенда используется как значение по умолчанию, чтобы UI,
// размещённый на podolsk.mad.moclean.ru, ходил сразу на рабочий API
// https://api.podolsk.mad.moclean.ru и не пытался слать запросы на свой
// собственный origin.

/** @type {string} */
const DEFAULT_BASE = 'https://api.podolsk.mad.moclean.ru'

/** @type {string} */
const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE)
  || DEFAULT_BASE

const RETRY_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 500

/** @type {Set<number>} */
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504, 425])

/**
 * Проверяет, можно ли повторить запрос при данном статусе
 * @param {number|undefined} status 
 * @returns {boolean}
 */
function isRetryableStatus(status) {
  if (!status) return false
  return RETRYABLE_STATUSES.has(status) || status >= 500
}

/**
 * @param {number} ms 
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * API Error с дополнительными полями
 */
class ApiError extends Error {
  /**
   * @param {string} message 
   * @param {number} [status] 
   * @param {string} [url] 
   */
  constructor(message, status, url) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

/**
 * Выполняет HTTP запрос с retry логикой
 * @param {string} path - путь или полный URL
 * @param {RequestInit & { signal?: AbortSignal }} [options] - опции fetch
 * @returns {Promise<any>}
 * @throws {ApiError}
 */
async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`

  /** @type {RequestInit} */
  const cfg = { 
    headers: {}, 
    ...options,
    // Добавляем credentials для CORS если нужно
    // credentials: 'include'
  }

  // Content-Type только когда есть JSON body
  if (cfg.body && typeof cfg.body === 'object') {
    cfg.headers['Content-Type'] = 'application/json'
    cfg.body = JSON.stringify(cfg.body)
  }

  /** @type {Error|null} */
  let lastError = null

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    // Проверяем отмену перед запросом
    if (options.signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    /** @type {Response|undefined} */
    let res
    
    try {
      res = await fetch(url, cfg)
    } catch (fetchErr) {
      // Если запрос был отменён - не ретраим
      if (fetchErr?.name === 'AbortError') throw fetchErr
      
      // Сетевые ошибки — частый симптом "заснувшей" базы; пробуем ещё раз
      lastError = new ApiError(
        `Network error while fetching ${url}: ${fetchErr?.message || String(fetchErr)}`,
        undefined,
        url
      )
      lastError.cause = fetchErr
      
      if (attempt < RETRY_ATTEMPTS - 1) {
        await wait(RETRY_BASE_DELAY_MS * (attempt + 1))
        continue
      }
      throw lastError
    }

    if (!res.ok) {
      if (isRetryableStatus(res.status) && attempt < RETRY_ATTEMPTS - 1) {
        await wait(RETRY_BASE_DELAY_MS * (attempt + 1))
        continue
      }
      
      const text = await res.text().catch(() => '')
      const message = text || `${res.status} ${res.statusText}`
      throw new ApiError(message, res.status, url)
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return res.json()
    }

    return res.text()
  }

  // Теоретически недостижимо, но для TypeScript
  if (lastError) throw lastError
  throw new ApiError('Unknown request error', undefined, url)
}

export { request, ApiError }
