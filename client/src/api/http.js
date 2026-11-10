// Тонкая обёртка над fetch: Bearer из памяти, один тихий refresh при 401, ошибки вида { error }
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

let accessToken = null
let refreshing = null
let onAuthLost = () => {}

// Недоступность сервера: хранится вне React, чтобы её мог выставить любой запрос
let serverDown = false
const downListeners = new Set()

function setServerDown(value) {
  if (serverDown === value) return
  serverDown = value
  downListeners.forEach((listener) => listener())
}

export function subscribeServerDown(listener) {
  downListeners.add(listener)
  return () => downListeners.delete(listener)
}

export const isServerDown = () => serverDown

// 502/503/504 — ответ прокси или шлюза. Наш API всегда отвечает JSON,
// поэтому 500 без JSON-тела тоже пришёл не от него (dev-прокси при отказе соединения)
function isGatewayError(status, data) {
  return status === 502 || status === 503 || status === 504 || (status === 500 && data === null)
}

// Единая точка fetch: сетевой сбой (сервер выключен, нет сети) — тоже «сервер недоступен»
async function safeFetch(url, init) {
  try {
    return await fetch(url, init)
  } catch {
    setServerDown(true)
    throw new ApiError(0, 'Сервер недоступен')
  }
}

// Опрос со страницы «сервер недоступен»: любой ответ самого API (даже 404) значит, что он поднялся
export async function pingServer() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' })
    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    return !isGatewayError(response.status, data)
  } catch {
    return false
  }
}

export function setAccessToken(token) {
  accessToken = token
}

export function setAuthLostHandler(handler) {
  onAuthLost = handler
}

async function parse(response) {
  if (response.status === 204) return null
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!response.ok) {
    if (isGatewayError(response.status, data)) {
      setServerDown(true)
      throw new ApiError(response.status, 'Сервер недоступен')
    }
    throw new ApiError(response.status, data?.error ?? `Ошибка запроса (${response.status})`)
  }
  return data
}

// Параллельные вызовы делят один refresh: старый refresh-токен после обмена недействителен
export function refreshSession() {
  refreshing ??= safeFetch('/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(parse)
    .then((data) => {
      accessToken = data.accessToken
      return data.accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

function buildUrl(path, params) {
  if (!params) return path
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

async function send(path, { method = 'GET', params, body, form }, token) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  return safeFetch(buildUrl(path, params), { method, headers, body: payload, credentials: 'include' })
}

export async function request(path, options = {}) {
  let response = await send(path, options, accessToken)

  if (response.status === 401 && accessToken && !options.noRefresh) {
    try {
      await refreshSession()
    } catch {
      accessToken = null
      onAuthLost()
      throw new ApiError(401, 'Сессия истекла, войдите снова')
    }
    response = await send(path, options, accessToken)
  }

  // raw: нужен сам ответ (файл), ошибки по-прежнему разбираются как { error }
  if (options.raw && response.ok) return response
  return parse(response)
}

export const get = (path, params) => request(path, { params })
export const post = (path, body) => request(path, { method: 'POST', body })
export const put = (path, body) => request(path, { method: 'PUT', body })
export const patch = (path, body) => request(path, { method: 'PATCH', body })
export const del = (path) => request(path, { method: 'DELETE' })
