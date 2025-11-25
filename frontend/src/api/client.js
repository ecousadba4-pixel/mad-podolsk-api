// Простая обёртка над fetch с базовым URL и обработкой ошибок
// В development можно переопределить базу через Vite: VITE_API_BASE
//
// Прод-домен бэкенда используется как значение по умолчанию, чтобы UI,
// размещённый на podolsk.mad.moclean.ru, ходил сразу на рабочий API
// mad-podolsk-karinausadba.amvera.io и не пытался слать запросы на свой
// собственный origin.
const DEFAULT_BASE = 'https://mad-podolsk-karinausadba.amvera.io'

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
  ? import.meta.env.VITE_API_BASE
  : DEFAULT_BASE

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`

  // Only set Content-Type when there's a JSON body to send.
  const cfg = { headers: {}, ...options }

  if (cfg.body && typeof cfg.body === 'object') {
    cfg.headers['Content-Type'] = 'application/json'
    cfg.body = JSON.stringify(cfg.body)
  }

  const res = await fetch(url, cfg)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const message = text || `${res.status} ${res.statusText}`
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  return res.text()
}

export { request }
