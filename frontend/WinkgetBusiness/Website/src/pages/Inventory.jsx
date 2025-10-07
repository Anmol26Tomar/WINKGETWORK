import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function Inventory() {
  const { state, dispatch } = useApp()
  const [updates, setUpdates] = useState({})
  const products = useMemo(() => state.products, [state.products])

  const handleChange = (id, value) => {
    setUpdates(prev => ({ ...prev, [id]: value }))
  }

  const applyUpdate = id => {
    const stock = parseInt(updates[id], 10)
    if (Number.isNaN(stock)) return
    dispatch({ type: 'UPDATE_STOCK', payload: { productId: id, stock } })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Inventory</h1>
      <div className="bg-white border rounded-lg divide-y">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-600">
          <div className="col-span-5">Product</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">Stock</div>
          <div className="col-span-3">Update</div>
        </div>
        {products.map(p => (
          <div key={p.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
            <div className="col-span-5 flex items-center gap-3">
              <img src={p.image} alt={p.name} className="h-10 w-12 object-cover rounded" />
              <div>
                <p className="font-medium">{p.name}</p>
                <p className={`text-xs ${p.stock < 5 ? 'text-red-600' : 'text-gray-500'}`}>{p.stock < 5 ? 'Low Stock' : 'In Stock'}</p>
              </div>
            </div>
            <div className="col-span-2">${p.price}</div>
            <div className="col-span-2 font-semibold">{p.stock}</div>
            <div className="col-span-3 flex items-center gap-2">
              <input type="number" className="w-24 rounded-md border px-3 py-2" value={updates[p.id] ?? ''} onChange={e => handleChange(p.id, e.target.value)} placeholder="New stock" />
              <button onClick={() => applyUpdate(p.id)} className="px-3 py-2 text-sm rounded-md border">Apply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


