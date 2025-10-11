import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Navbar() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const { isAuthenticated, vendor } = state.auth

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' })
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b">
      <div className="container-fluid h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-primary-700 font-semibold">VendorApp</Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-700 hidden sm:block">{vendor?.name}</span>
              <button onClick={handleLogout} className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700">Logout</button>
            </>
          ) : (
            <Link to="/login" className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700">Login</Link>
          )}
        </div>
      </div>
    </header>
  )
}


