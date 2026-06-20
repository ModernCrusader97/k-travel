const BASE = '/api'

function getToken() { return localStorage.getItem('konda_token') }
function setToken(t: string) { localStorage.setItem('konda_token', t) }
export function clearToken() { localStorage.removeItem('konda_token') }
export function isLoggedIn() { return !!getToken() }

async function req(method: string, path: string, body?: object) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  signup: (email: string, password: string, name?: string) =>
    req('POST', '/auth/signup', { email, password, name }).then(d => { setToken(d.token); return d }),

  login: (email: string, password: string) =>
    req('POST', '/auth/login', { email, password }).then(d => { setToken(d.token); return d }),

  me: () => req('GET', '/user/me'),
  updateMe: (name: string) => req('PATCH', '/user/me', { name }),

  balance: () => req('GET', '/balance'),
  topup: (amount: number, currency = 'KRW') => req('POST', '/balance/topup', { amount, currency }),

  transactions: (limit = 50) => req('GET', `/transactions?limit=${limit}`),

  findEmail: (name: string) => req('POST', '/auth/find-email', { name }),
  resetPassword: (email: string, newPassword: string) => req('POST', '/auth/reset-password', { email, newPassword }),

  cards: () => req('GET', '/cards'),
  applyCard: (card_type: string, color: string) => req('POST', '/cards/apply', { card_type, color }),
  cardApplications: () => req('GET', '/cards/applications'),
}
