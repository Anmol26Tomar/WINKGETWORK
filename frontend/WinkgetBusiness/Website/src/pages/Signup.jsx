import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { API_BASE_URL } from '../apiConfig.js'
import VendorSignupForm from '../components/VendorSignupForm'

export default function Signup() {
  const { dispatch } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const presetRole = location.state?.presetRole
  const [role, setRole] = useState(presetRole || 'vendor')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (presetRole) setRole(presetRole)
  }, [presetRole])

  const handleAdminSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Please fill all fields.')
      return
    }
    try {
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
    } catch (err) {
      const msg = err?.message || 'Signup failed'
      setError(msg)
    }
  }

  const handleVendorSuccess = () => {
    setSuccess('Vendor account created successfully! Redirecting to dashboard...')
    setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 2000)
  }

  const handleVendorError = (errorMessage) => {
    setError(errorMessage)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Role Selection */}
        <div className="mb-6">
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => setRole('vendor')}
              className={`px-6 py-3 rounded-lg font-medium ${
                role === 'vendor' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Vendor Registration
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`px-6 py-3 rounded-lg font-medium ${
                role === 'admin' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Admin Registration
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Vendor Signup Form */}
        {role === 'vendor' && (
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Vendor Registration</h1>
              <p className="text-gray-600 mt-2">Join our marketplace and start selling your products</p>
            </div>
            <VendorSignupForm
              onSuccess={handleVendorSuccess}
              onError={handleVendorError}
            />
          </div>
        )}

        {/* Admin Signup Form */}
        {role === 'admin' && (
          <div className="max-w-md mx-auto bg-white border rounded-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Admin Registration</h1>
              <p className="text-gray-600 mt-2">Create an admin account to manage the platform</p>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={(e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))} 
                  className="w-full rounded-md border px-3 py-2" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={(e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))} 
                  className="w-full rounded-md border px-3 py-2" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={form.password} 
                  onChange={(e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))} 
                  className="w-full rounded-md border px-3 py-2" 
                  required 
                />
              </div>
              <button type="submit" className="w-full px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Create Admin Account
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}


