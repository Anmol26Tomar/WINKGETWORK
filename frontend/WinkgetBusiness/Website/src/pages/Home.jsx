import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Home() {
  const { state } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    // If user is authenticated, redirect to their dashboard
    if (state.initialized && state.auth.isAuthenticated) {
      if (state.auth.vendor?.role === 'vendor') {
        navigate('/vendor/dashboard', { replace: true })
      } else if (state.auth.vendor?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      }
    }
  }, [state.initialized, state.auth.isAuthenticated, state.auth.vendor?.role, navigate])

  // Show loading while checking authentication
  if (!state.initialized) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border rounded-lg p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Winket Business</h1>
        <p className="text-gray-600">Choose your role to continue</p>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/login" state={{ presetRole: 'admin' }} className="px-4 py-3 rounded-md border hover:bg-gray-50">Admin</Link>
          <Link to="/login" state={{ presetRole: 'vendor' }} className="px-4 py-3 rounded-md border hover:bg-gray-50">Vendor</Link>
        </div>
      </div>
    </div>
  )
}

