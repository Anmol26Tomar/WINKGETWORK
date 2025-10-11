import React from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 hover:text-primary-700 ${
    isActive ? 'bg-blue-100 text-primary-700' : 'text-gray-700'
  }`

export default function Sidebar() {
  const { state } = useApp()
  const { vendor } = state.auth

  const dashboardPath = vendor?.role === 'admin' ? '/admin/dashboard' : '/vendor/dashboard'

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
            {(vendor?.name || 'V')[0]}
          </div>
          <div>
            <p className="text-sm font-semibold">{vendor?.name || 'Vendor'}</p>
            <p className="text-xs text-gray-500">{vendor?.email || 'example@vendor.com'}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <NavLink to={dashboardPath} className={navLinkClasses}>Dashboard</NavLink>
        <NavLink to="/products" className={navLinkClasses}>Products</NavLink>
        <NavLink to="/inventory" className={navLinkClasses}>Inventory</NavLink>
        <NavLink to="/orders" className={navLinkClasses}>Orders</NavLink>
        <NavLink to="/billing" className={navLinkClasses}>Billing</NavLink>
        <NavLink to="/notifications" className={navLinkClasses}>Notifications</NavLink>
        <NavLink to="/profile" className={navLinkClasses}>Profile</NavLink>
      </nav>
      <div className="p-3 text-xs text-gray-400">Vendor Management</div>
    </aside>
  )
}


