import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
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


