// Простая обёртка над fetch с базовым URL и обработкой ошибок
const BASE = 'https://mad-podolsk-karinausadba.amvera.io' // внешний домен backend

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`

  const cfg = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }

  if (cfg.body && typeof cfg.body === 'object') {
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
