import React from 'react'

const statusFlow = ['Pending', 'Confirmed', 'Dispatched', 'Completed']

export default function OrderCard({ order, onChangeStatus, onGenerateBill }) {
  const currentIndex = statusFlow.indexOf(order.status)
  const nextStatus = currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{order.customerName}</h4>
          <p className="text-xs text-gray-500">Order ID: {order.id}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{order.status}</span>
      </div>
      <ul className="mt-3 text-sm text-gray-700 list-disc pl-5">
        {order.items.map((it, idx) => (
          <li key={idx}>{it.name} × {it.quantity} @ ${it.price}</li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold">Total: ${order.total}</span>
        <div className="flex gap-2">
          {nextStatus && (
            <button onClick={() => onChangeStatus?.(order, nextStatus)} className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50">Mark {nextStatus}</button>
          )}
          <button onClick={() => onGenerateBill?.(order)} className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white">Generate Bill</button>
        </div>
      </div>
    </div>
  )
}


