import { API_BASE_URL, endpoints } from '../apiConfig.js'

function authHeaders() {
  const token = localStorage.getItem('wb_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) }
  const res = await fetch(`${API_BASE_URL}${path}`, { 
    ...options, 
    headers,
    credentials: 'include' // Include cookies for authentication
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

// Public Product Services
export async function fetchProducts(filters = {}) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.products}`)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  
  return request(url.pathname + url.search)
}

export async function getProductById(productId) {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}/${productId}`, {
    headers: { ...authHeaders() }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to fetch product')
  return data
}

export async function searchProducts(query, limit = 10) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.products}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', limit)
  
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to search products')
  return data
}

export async function getProductCategories() {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}/categories`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to fetch categories')
  return data
}

export async function addProductRating(productId, rating, comment = '') {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}/${productId}/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ rating, comment }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to add rating')
  return data
}

// Vendor Product Management Services
export async function getVendorProducts(filters = {}) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.products}/vendor/my-products`)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  
  const res = await fetch(url, { headers: { ...authHeaders() } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to fetch vendor products')
  return data
}

export async function createProduct(productData) {
  const isFormData = typeof FormData !== 'undefined' && productData instanceof FormData
  const headers = isFormData ? { ...authHeaders() } : { 'Content-Type': 'application/json', ...authHeaders() }
  const body = isFormData ? productData : JSON.stringify(productData)
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}`, {
    method: 'POST',
    headers,
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to create product')
  return data
}

export async function updateProduct(productId, productData) {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(productData),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to update product')
  return data
}

export async function deleteProduct(productId) {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}/${productId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to delete product')
  }
  return { success: true }
}


