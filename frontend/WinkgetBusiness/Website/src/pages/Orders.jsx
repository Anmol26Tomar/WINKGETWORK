import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import OrderCard from '../components/OrderCard.jsx'

export default function Orders() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')

  const orders = useMemo(() => {
    if (filter === 'All') return state.orders
    return state.orders.filter(o => o.status === filter)
  }, [state.orders, filter])

  const handleChangeStatus = (order, status) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: order.id, status } })
  }

  const handleGenerateBill = order => {
    const first = order.items[0]
    navigate('/billing', { state: { initial: { customerName: order.customerName, productId: first?.productId, quantity: first?.quantity, price: first?.price } } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            {['All', 'Pending', 'Confirmed', 'Dispatched', 'Completed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {orders.map(o => (
          <OrderCard key={o.id} order={o} onChangeStatus={handleChangeStatus} onGenerateBill={handleGenerateBill} />
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Order History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Order ID</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Items</th>
                <th className="py-2">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.orders.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="py-2">{o.id}</td>
                  <td className="py-2">{o.customerName}</td>
                  <td className="py-2">{o.items.map(i => i.name).join(', ')}</td>
                  <td className="py-2">${o.total}</td>
                  <td className="py-2">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


