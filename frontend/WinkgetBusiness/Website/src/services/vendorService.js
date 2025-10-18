import { API_BASE_URL, endpoints } from '../apiConfig.js'

function authHeaders() {
  const token = localStorage.getItem('wb_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers || {}) }
  const res = await fetch(`${API_BASE_URL}${path}`, { 
    ...options, 
    headers,
    credentials: 'include' // Include cookies for authentication
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

// Vendor Authentication Services
export async function vendorSignup(vendorData, isForm = false) {
  const data = await request(`${endpoints.business.auth.signup}/vendor`, {
    method: 'POST',
    body: isForm ? vendorData : JSON.stringify(vendorData),
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
  })
  // Cookie is set by backend; persist only non-sensitive user info locally
  localStorage.setItem('wb_user', JSON.stringify(data.user))
  return data.user
}

export async function vendorLogin({ email, password }) {
  const data = await request(endpoints.business.auth.login, {
    method: 'POST',
    body: JSON.stringify({ email, password, role: 'vendor' }),
  })
  // Cookie is set by backend; persist only non-sensitive user info locally
  localStorage.setItem('wb_user', JSON.stringify(data.user))
  return data.user
}

// Vendor Profile Services
export async function getVendorProfile() {
  return request(`${endpoints.business.vendors}/profile`)
}

export async function updateVendorProfile(profileData) {
  return request(`${endpoints.business.vendors}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

export async function getVendorStats() {
  return request(`${endpoints.business.vendors}/stats`)
}

// Document Management
export async function uploadVendorDocument(documentData) {
  return request(`${endpoints.business.vendors}/documents`, {
    method: 'POST',
    body: JSON.stringify(documentData),
  })
}

// Image Management
export async function updateVendorImages(imageData) {
  return request(`${endpoints.business.vendors}/images`, {
    method: 'PUT',
    body: JSON.stringify(imageData),
  })
}

// Public Vendor Services (no authentication required)
export async function getPublicVendors(filters = {}) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.vendors}/public`)
  Object.entries(filters).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  
  const res = await fetch(url, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to fetch vendors')
  return data
}

// Logout and clear local session artifacts
export async function vendorLogout() {
  try {
    await request(endpoints.business.auth.logout, { method: 'POST' })
  } finally {
    // Clear any local remnants regardless of server result
    try { localStorage.removeItem('wb_token') } catch {}
    try { localStorage.removeItem('wb_user') } catch {}
  }
}

export async function getPublicVendorProfile(vendorId, includeProducts = false) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.vendors}/public/${vendorId}`)
  if (includeProducts) url.searchParams.set('includeProducts', 'true')
  
  const res = await fetch(url, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to fetch vendor profile')
  return data
}

export async function getVendorsByCategory(category, filters = {}) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.vendors}/public/category/${category}`)
  Object.entries(filters).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  
  const res = await fetch(url, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to fetch vendors by category')
  return data
}