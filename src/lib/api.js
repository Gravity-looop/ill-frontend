const rawApiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const API_BASE = rawApiBase.replace(/\/+$/, '')
const ACCESS_KEY = 'ill_admin_access'
const REFRESH_KEY = 'ill_admin_refresh'
const USER_KEY = 'ill_admin_user'
const ADMIN_KEY = 'ill_admin_verified'
const ROLE_KEY = 'ill_portal_role'

function parseStoredValue(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const tokenStore = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  getUser() {
    return parseStoredValue(localStorage.getItem(USER_KEY))
  },
  getRole() {
    const role = localStorage.getItem(ROLE_KEY)
    if (role) return role
    return localStorage.getItem(ADMIN_KEY) === 'true' ? 'admin' : null
  },
  isAdmin() {
    return this.getRole() === 'admin'
  },
  isUser() {
    return this.getRole() === 'user'
  },
  setTokens({ access, refresh, user }) {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  setRole(role) {
    if (role) localStorage.setItem(ROLE_KEY, role)
    else localStorage.removeItem(ROLE_KEY)
    localStorage.setItem(ADMIN_KEY, role === 'admin' ? 'true' : 'false')
  },
  setAdmin(value) {
    this.setRole(value ? 'admin' : 'user')
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ADMIN_KEY)
    localStorage.removeItem(ROLE_KEY)
  },
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class NotAdminError extends Error {
  constructor() {
    super('This account does not have administrator access.')
    this.name = 'NotAdminError'
    this.status = 403
  }
}

function firstErrorMessage(data, fallback) {
  if (typeof data === 'string' && data) return data
  if (!data || typeof data !== 'object') return fallback
  if (typeof data.detail === 'string') return data.detail
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value[0]) return String(value[0])
    if (typeof value === 'string') return value
  }
  return fallback
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  let data
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }
  if (!response.ok) {
    throw new ApiError(
      firstErrorMessage(data, `Request failed with status ${response.status}.`),
      response.status,
      data,
    )
  }
  return data
}

function pathFromUrl(value) {
  if (!value) return ''
  if (value.startsWith('/')) return value
  try {
    const parsed = new URL(value, window.location.origin)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return value
  }
}

function apiOrigin() {
  if (!API_BASE.startsWith('http')) return ''
  try {
    return new URL(API_BASE).origin
  } catch {
    return ''
  }
}

export function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = apiOrigin()
  if (!origin && normalized.startsWith('/api/v1')) {
    return normalized
  }
  if (origin && normalized.startsWith('/api/v1')) {
    return `${origin}${normalized}`
  }
  if (API_BASE === '/api/v1') return `${API_BASE}${normalized}`
  return `${API_BASE}${normalized}`
}

async function refreshAccess() {
  const refresh = tokenStore.getRefresh()
  if (!refresh) return null
  const response = await fetch(resolveApiUrl('/auth/token/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  const data = await parseResponse(response)
  tokenStore.setTokens({ access: data.access, refresh: data.refresh })
  return data.access
}

async function performRequest(path, options = {}, canRefresh = true) {
  const headers = new Headers(options.headers || {})
  const access = tokenStore.getAccess()
  if (access) headers.set('Authorization', `Bearer ${access}`)
  let body = options.body
  if (body && typeof body !== 'string' && !(typeof FormData !== 'undefined' && body instanceof FormData)) {
    body = JSON.stringify(body)
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(resolveApiUrl(path), { ...options, body, headers })
  if (response.status === 401 && canRefresh && tokenStore.getRefresh()) {
    await refreshAccess()
    return performRequest(path, options, false)
  }
  return parseResponse(response)
}

function queryString(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  const result = query.toString()
  return result ? `?${result}` : ''
}

export async function fetchProtectedFile(url) {
  const path = pathFromUrl(url)
  let response = await fetch(resolveApiUrl(path), {
    headers: tokenStore.getAccess()
      ? { Authorization: `Bearer ${tokenStore.getAccess()}` }
      : {},
  })
  if (response.status === 401 && tokenStore.getRefresh()) {
    await refreshAccess()
    response = await fetch(resolveApiUrl(path), {
      headers: tokenStore.getAccess()
        ? { Authorization: `Bearer ${tokenStore.getAccess()}` }
        : {},
    })
  }
  if (!response.ok) await parseResponse(response)
  return response.blob()
}

export const api = {
  request: (path, options) => performRequest(path, options),
  async loginAdmin(email, password) {
    tokenStore.clear()
    const data = await performRequest(
      '/auth/token/',
      { method: 'POST', body: { email, password } },
      false,
    )
    tokenStore.setTokens(data)
    try {
      await performRequest('/admin/payment-requests/?page=1', {}, false)
      tokenStore.setRole('admin')
    } catch (error) {
      tokenStore.clear()
      if (error.status === 403) throw new NotAdminError()
      throw error
    }
    return data
  },
  async loginUser(email, password) {
    tokenStore.clear()
    const data = await performRequest(
      '/auth/token/',
      { method: 'POST', body: { email, password } },
      false,
    )
    tokenStore.setTokens(data)
    try {
      const currentUser = await performRequest('/auth/me/', {}, false)
      tokenStore.setTokens({ user: currentUser })
      tokenStore.setRole('user')
      return { ...data, user: currentUser }
    } catch (error) {
      tokenStore.clear()
      throw error
    }
  },
  register(payload) {
    return performRequest('/auth/register/', { method: 'POST', body: payload }, false)
  },
  async logout() {
    const refresh = tokenStore.getRefresh()
    try {
      if (refresh) {
        await performRequest('/auth/logout/', { method: 'POST', body: { refresh } }, false)
      }
    } finally {
      tokenStore.clear()
    }
  },
  getMe() {
    return performRequest('/auth/me/')
  },
  verifyAdmin() {
    return performRequest('/admin/payment-requests/?page=1', {}, false)
  },
  adminPaymentRequests(params) {
    return performRequest(`/admin/payment-requests/${queryString(params)}`)
  },
  createPaymentRequest(payload) {
    return performRequest('/admin/payment-requests/', { method: 'POST', body: payload })
  },
  updatePaymentRequest(id, payload) {
    return performRequest(`/admin/payment-requests/${id}/`, { method: 'PATCH', body: payload })
  },
  deletePaymentRequest(id) {
    return performRequest(`/admin/payment-requests/${id}/`, { method: 'DELETE' })
  },
  forceDeletePaymentRequest(id, transactionId) {
    return performRequest(`/admin/payment-requests/${id}/force-delete/`, {
      method: 'DELETE',
      body: { confirm_transaction_id: transactionId },
    })
  },
  adminSubmissions(params) {
    return performRequest(`/admin/submissions/${queryString(params)}`)
  },
  adminSubmission(id) {
    return performRequest(`/admin/submissions/${id}/`)
  },
  acceptSubmission(id, finalAmount) {
    return performRequest(`/admin/submissions/${id}/accept/`, {
      method: 'POST',
      body: { final_amount: finalAmount },
    })
  },
  declineSubmission(id, reason) {
    return performRequest(`/admin/submissions/${id}/decline/`, {
      method: 'POST',
      body: { reason },
    })
  },
  adminUsers(params) {
    return performRequest(`/admin/users/${queryString(params)}`)
  },
  adminBalanceHistory(params) {
    return performRequest(`/admin/balance-history/${queryString(params)}`)
  },
  userPaymentRequests(params) {
    return performRequest(`/payment-requests/${queryString(params)}`)
  },
  userPaymentRequest(id) {
    return performRequest(`/payment-requests/${id}/`)
  },
  createSubmission(id, payload) {
    return performRequest(`/payment-requests/${id}/submissions/`, { method: 'POST', body: payload })
  },
  mySubmissions(params) {
    return performRequest(`/submissions/${queryString(params)}`)
  },
  mySubmission(id) {
    return performRequest(`/submissions/${id}/`)
  },
  userBalanceHistory(params) {
    return performRequest(`/balance-history/${queryString(params)}`)
  },
  myWithdrawals(params) {
    return performRequest(`/withdrawals/${queryString(params)}`)
  },
  myWithdrawal(id) {
    return performRequest(`/withdrawals/${id}/`)
  },
  createWithdrawal(payload) {
    return performRequest('/withdrawals/', { method: 'POST', body: payload })
  },
  withdrawalBalance() {
    return performRequest('/withdrawals/balance/')
  },
  adminWithdrawals(params) {
    return performRequest(`/admin/withdrawals/${queryString(params)}`)
  },
  adminWithdrawalSummary(params) {
    return performRequest(`/admin/withdrawals/summary/${queryString(params)}`)
  },
  adminWithdrawal(id) {
    return performRequest(`/admin/withdrawals/${id}/`)
  },
  confirmWithdrawal(id, payload) {
    return performRequest(`/admin/withdrawals/${id}/confirm/`, {
      method: 'POST',
      body: payload,
    })
  },
  rejectWithdrawal(id, reason) {
    return performRequest(`/admin/withdrawals/${id}/reject/`, {
      method: 'POST',
      body: { reason },
    })
  },
  chatSummary() {
    return performRequest('/chat/')
  },
  chatMessages(params) {
    return performRequest(`/chat/messages/${queryString(params)}`)
  },
  sendChatMessage(body) {
    return performRequest('/chat/messages/', { method: 'POST', body: { body } })
  },
  adminChatConversations(params) {
    return performRequest(`/admin/chat/conversations/${queryString(params)}`)
  },
  adminChatMessages(userId, params) {
    return performRequest(`/admin/chat/users/${userId}/messages/${queryString(params)}`)
  },
  adminSendChatMessage(userId, body) {
    return performRequest(`/admin/chat/users/${userId}/messages/`, { method: 'POST', body: { body } })
  },
}
