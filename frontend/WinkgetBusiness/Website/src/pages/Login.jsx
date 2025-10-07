import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { login as loginService } from '../services/authService.js'

export default function Login() {
  const { dispatch } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '', role: 'vendor' })
  const [error, setError] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please enter email and password.')
      return
    }
    try {
      const user = await loginService(form)
	  dispatch({ type: 'LOGIN_SUCCESS', payload: user })
      const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Login</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full px-3 py-2 rounded-md bg-primary-600 text-white">Login</button>
        </form>
        <p className="text-sm text-gray-600 mt-4">Don't have an account? <Link to="/signup" className="text-primary-700">Sign up</Link></p>
      </div>
    </div>
  )
}


