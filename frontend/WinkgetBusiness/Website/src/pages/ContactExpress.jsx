import React, { useState } from 'react'
import { API_BASE_URL, endpoints } from '../apiConfig.js'

function authHeaders() {
  const token = localStorage.getItem('wb_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export default function ContactExpress() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  const submit = async e => {
    e.preventDefault()
    setStatus('')
    const res = await fetch(`${API_BASE_URL}${endpoints.business.contact}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject, message })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setStatus(data.message || 'Failed to send')
    setStatus('Message sent')
    setSubject('')
    setMessage('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Contact Winkget Express</h1>
      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full rounded-md border px-3 py-2" rows="4" required />
        </div>
        {status && <p className="text-sm">{status}</p>}
        <button className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white">Send</button>
      </form>
    </div>
  )
}


