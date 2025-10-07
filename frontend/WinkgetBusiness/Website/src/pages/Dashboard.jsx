import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { state } = useApp()
  const totalProducts = state.products.length
  const pendingOrders = state.orders.filter(o => o.status !== 'Completed').length
  const completedOrders = state.orders.filter(o => o.status === 'Completed').length
  const lowStock = state.products.filter(p => p.stock < 5).length

  const chartData = useMemo(() => {
    // simple mock chart data
    return [
      { name: 'Mon', sales: 12, stock: 80 },
      { name: 'Tue', sales: 18, stock: 78 },
      { name: 'Wed', sales: 9, stock: 75 },
      { name: 'Thu', sales: 20, stock: 73 },
      { name: 'Fri', sales: 15, stock: 70 },
      { name: 'Sat', sales: 22, stock: 68 },
      { name: 'Sun', sales: 17, stock: 66 },
    ]
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={totalProducts} />
        <StatCard title="Orders Pending" value={pendingOrders} />
        <StatCard title="Orders Completed" value={completedOrders} />
        <StatCard title="Low Stock Alerts" value={lowStock} highlight={lowStock > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">Sales vs Stock</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" />
                <Line type="monotone" dataKey="stock" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
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


