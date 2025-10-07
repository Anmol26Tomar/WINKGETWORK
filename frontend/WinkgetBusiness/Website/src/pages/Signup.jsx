import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { API_BASE_URL } from '../apiConfig.js'

export default function Signup() {
  const { dispatch } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const presetRole = location.state?.presetRole
  const [form, setForm] = useState({ role: presetRole || 'vendor', name: '', email: '', password: '', storeName: '', websiteUrl: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (presetRole) setForm(prev => ({ ...prev, role: presetRole }))
  }, [presetRole])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Please fill all fields.')
      return
    }
    try {
      if (form.role === 'admin') {
        const res = await fetch(`${API_BASE_URL}/api/business/auth/signup/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Signup failed')
        if (data?.token) localStorage.setItem('wb_token', data.token)
        localStorage.setItem('wb_user', JSON.stringify(data.user))
        setSuccess('Admin created successfully. Please log in.')
        navigate('/login', { replace: true })
        return
      }
      // vendor
      if (!form.storeName) {
        setError('Please enter a store name for vendor signup.')
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/business/auth/signup/vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          storeName: form.storeName,
          websiteUrl: form.websiteUrl,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Signup failed')
      if (data?.token) localStorage.setItem('wb_token', data.token)
      localStorage.setItem('wb_user', JSON.stringify(data.user))
      setSuccess('Vendor created successfully. Please log in.')
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err?.message || 'Signup failed'
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Create Account</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
          </div>
          {form.role === 'vendor' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <input name="storeName" value={form.storeName} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required={form.role === 'vendor'} placeholder="My Store" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website URL</label>
                <input name="websiteUrl" value={form.websiteUrl} onChange={handleChange} className="w-full rounded-md border px-3 py-2" placeholder="https://" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <button type="submit" className="w-full px-3 py-2 rounded-md bg-primary-600 text-white">Sign up</button>
        </form>
        <p className="text-sm text-gray-600 mt-4">Already have an account? <Link to="/login" className="text-primary-700">Login</Link></p>
      </div>
    </div>
  )
}


