import { API_BASE_URL, endpoints } from '../apiConfig.js'

function authHeaders() {
  const token = localStorage.getItem('wb_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchProducts({ vendorId } = {}) {
  const url = new URL(`${API_BASE_URL}${endpoints.business.products}`)
  if (vendorId) url.searchParams.set('vendorId', vendorId)
  const res = await fetch(url, { headers: { ...authHeaders() } })
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(data.message || 'Failed to fetch products')
  return data
}

export async function createProduct(values, { vendorId } = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ...values, vendorId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to create product')
  return data
}

export async function updateProduct(product) {
  const res = await fetch(`${API_BASE_URL}${endpoints.business.products}/${product._id || product.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(product),
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


