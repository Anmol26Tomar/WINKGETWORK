import { API_BASE_URL, endpoints } from '../apiConfig.js'

async function request(path, options = {}) {
  const token = localStorage.getItem('wb_token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include'
  }
  
  const res = await fetch(`${API_BASE_URL}${path}`, fetchOptions)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

// Create a new bill
export async function createBill(billData) {
  return request(`${endpoints.business.bills}`, {
    method: 'POST',
    body: JSON.stringify(billData),
  })
}

// Get all bills for vendor
export async function getVendorBills(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })
  
  const queryString = params.toString()
  const url = queryString ? `${endpoints.business.bills}?${queryString}` : endpoints.business.bills
  
  return request(url)
}

// Get bill by ID
export async function getBillById(billId) {
  return request(`${endpoints.business.bills}/${billId}`)
}

// Update bill status
export async function updateBillStatus(billId, status, paymentMethod) {
  return request(`${endpoints.business.bills}/${billId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, paymentMethod }),
  })
}

// Update bill
export async function updateBill(billId, billData) {
  return request(`${endpoints.business.bills}/${billId}`, {
    method: 'PUT',
    body: JSON.stringify(billData),
  })
}

// Delete bill
export async function deleteBill(billId) {
  return request(`${endpoints.business.bills}/${billId}`, {
    method: 'DELETE',
  })
}

// Generate bill from order
export async function generateBillFromOrder(orderId, orderData) {
  return request(`${endpoints.business.bills}/from-order/${orderId}`, {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}

// Get bill statistics
export async function getBillStats() {
  return request(`${endpoints.business.bills}/stats`)
}
