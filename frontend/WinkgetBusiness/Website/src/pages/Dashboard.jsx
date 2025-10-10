import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import VendorDashboard from './VendorDashboard'

export default function Dashboard() {
  const { state } = useApp()
  console.log(state);
  
  
  // If user is a vendor, show vendor dashboard
  if (state?.auth?.vendor?.role == 'vendor') {
    return <VendorDashboard />
  }
  
  // For admins, show the original dashboard
  return <AdminDashboard />
}

function AdminDashboard() {
  const { state } = useApp()
  const totalProducts = state.products.length
  const pendingOrders = state.orders.filter(o => o.status !== 'Completed').length
  const completedOrders = state.orders.filter(o => o.status === 'Completed').length
  const lowStock = state.products.filter(p => p.stock < 5).length

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={totalProducts} />
        <StatCard title="Orders Pending" value={pendingOrders} />
        <StatCard title="Orders Completed" value={completedOrders} />
        <StatCard title="Low Stock Alerts" value={lowStock} highlight={lowStock > 0} />
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Recent Notifications</h3>
        <ul className="space-y-3">
          {state.notifications.slice(0, 5).map(n => (
            <li key={n.id} className="text-sm text-gray-700 flex items-center justify-between">
              <span className="truncate mr-2">{n.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${n.read ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                {n.read ? 'Read' : 'New'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatCard({ title, value, highlight }) {
  return (
    <div className={`bg-white border rounded-lg p-4 ${highlight ? 'ring-1 ring-red-300' : ''}`}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}


