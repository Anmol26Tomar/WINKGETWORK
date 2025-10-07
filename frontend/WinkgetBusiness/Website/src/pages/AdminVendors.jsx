import React, { useEffect, useState } from 'react'
import { API_BASE_URL, endpoints } from '../apiConfig.js'

function authHeaders() {
  const token = localStorage.getItem('wb_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadVendors() {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}${endpoints.business.vendors}`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load vendors')
      setVendors(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [])

  async function approveVendor(id) {
    const res = await fetch(`${API_BASE_URL}${endpoints.business.vendors}/${id}/approve`, { method: 'PATCH', headers: authHeaders() })
    const data = await res.json()
    if (!res.ok) return alert(data.message || 'Failed to approve')
    setVendors(prev => prev.map(v => (v._id === id ? data : v)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vendors</h1>
        <button onClick={loadVendors} className="px-3 py-2 text-sm rounded-md border">Refresh</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vendors.map(v => (
          <div key={v._id} className="bg-white border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{v.name} • {v.storeName}</h3>
                <p className="text-xs text-gray-500">{v.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${v.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {v.approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            {v.websiteUrl && (
              <a href={v.websiteUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-700 underline">Open Website</a>
            )}
            <div className="flex gap-2">
              {!v.approved && (
                <button onClick={() => approveVendor(v._id)} className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white">Approve</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


