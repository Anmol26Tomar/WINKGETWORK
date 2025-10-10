import { API_BASE_URL, endpoints } from '../apiConfig.js'

async function request(path, options = {}) {
  const token = localStorage.getItem('wb_token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' // Include cookies for authentication
  }
  
  const urlsToTry = [ `${API_BASE_URL}${path}` ]
  // Fallback to alternate common dev port if first fails
  try {
    const u = new URL(API_BASE_URL)
    const altPort = u.port === '5000' ? '4000' : '5000'
    u.port = altPort
    urlsToTry.push(`${u.toString().replace(/\/$/, '')}${path}`)
  } catch {}
  let lastErr
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, fetchOptions)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
      return data
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('Network error')
}

export async function login({ email, password, role }) {
  if (!email || !password || !role) throw new Error('Missing credentials')
  
  const response = await fetch(`${API_BASE_URL}${endpoints.business.auth.login}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ email, password, role }),
  })
  
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Login failed')
  
  // Store token in localStorage for backward compatibility
  if (data.token) localStorage.setItem('wb_token', data.token)
  localStorage.setItem('wb_user', JSON.stringify(data.user))
  return data.user
}

export async function signup({ role, name, email, password, storeName, websiteUrl }) {
  const data = await request(endpoints.business.auth.signup, {
    method: 'POST',
    body: JSON.stringify({ role, name, email, password, storeName, websiteUrl }),
  })
  if (data.token) localStorage.setItem('wb_token', data.token)
  localStorage.setItem('wb_user', JSON.stringify(data.user))
  return data.user
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('wb_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function logout() {
  try {
    // Call logout endpoint to clear server-side cookie
    await request(endpoints.business.auth.logout, { method: 'POST' })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Clear local storage regardless
    localStorage.removeItem('wb_token')
    localStorage.removeItem('wb_user')
  }
}

export async function getCurrentUser() {
  try {
    const data = await request(endpoints.business.auth.me)
    return data.user
  } catch (error) {
    console.error('Get current user error:', error)
    throw error
  }
}


