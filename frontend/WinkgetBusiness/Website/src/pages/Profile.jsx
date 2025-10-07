import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import ProfileCard from '../components/ProfileCard.jsx'

export default function Profile() {
  const { state, dispatch } = useApp()
  const vendor = state.auth.vendor || { name: 'Vendor', email: 'vendor@example.com' }

  const handleUpdate = form => {
    dispatch({ type: 'UPDATE_VENDOR', payload: { ...vendor, ...form } })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <ProfileCard vendor={vendor} onUpdate={handleUpdate} />
    </div>
  )
}


