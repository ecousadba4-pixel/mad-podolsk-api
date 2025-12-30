/**
 * HTTP клиент с retry логикой и обработкой ошибок
 */

const DEFAULT_BASE = 'https://api.podolsk.mad.moclean.ru'

const BASE: string = import.meta.env.VITE_API_BASE ?? DEFAULT_BASE

const RETRY_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 500

const RETRYABLE_STATUSES = new Set([500, 502, 503, 504, 425])

function isRetryableStatus(status: number | undefined): boolean {
  if (!status) return false
  return RETRYABLE_STATUSES.has(status) || status >= 500
}

const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * API Error с дополнительными полями
 */
export class ApiError extends Error {
  status?: number
  url?: string

  constructor(message: string, status?: number, url?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

export interface RequestOptions extends RequestInit {
  signal?: AbortSignal
}

/**
 * Выполняет HTTP запрос с retry логикой
 */
export async function request<T = unknown>(
  path: string, 
  options: RequestOptions = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`

  const cfg: RequestInit = { 
    headers: {} as Record<string, string>, 
    ...options 
  }

  // Content-Type только когда есть JSON body
  if (cfg.body && typeof cfg.body === 'object') {
    (cfg.headers as Record<string, string>)['Content-Type'] = 'application/json'
    cfg.body = JSON.stringify(cfg.body)
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    // Проверяем отмену перед запросом
    if (options.signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }

    let res: Response | undefined
    
    try {
      res = await fetch(url, cfg)
    } catch (fetchErr) {
      // Если запрос был отменён - не ретраим
      if ((fetchErr as Error)?.name === 'AbortError') throw fetchErr
      
      const errorMessage = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      lastError = new ApiError(
        `Network error while fetching ${url}: ${errorMessage}`,
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
      return res.json() as Promise<T>
    }

    return res.text() as unknown as T
  }

  if (lastError) throw lastError
  throw new ApiError('Unknown request error', undefined, url)
}
