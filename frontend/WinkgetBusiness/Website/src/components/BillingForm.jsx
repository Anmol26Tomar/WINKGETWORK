import React, { useMemo, useState } from 'react'

export default function BillingForm({ products, initial, onPrint }) {
  const [form, setForm] = useState({
    customerName: initial?.customerName || '',
    productId: initial?.productId || (products[0]?.id || ''),
    quantity: initial?.quantity || 1,
    price: initial?.price || (products[0]?.price || 0),
    discount: initial?.discount || 0,
    tax: initial?.tax || 0,
  })

  const selected = useMemo(() => products.find(p => p.id === form.productId), [products, form.productId])

  const totals = useMemo(() => {
    const subtotal = form.quantity * form.price
    const discounted = subtotal - (subtotal * (form.discount || 0)) / 100
    const total = discounted + (discounted * (form.tax || 0)) / 100
    return { subtotal, discounted, total }
  }, [form])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'productId' ? value : Number.isNaN(Number(value)) ? value : Number(value) }))
  }

  const handleProductChange = e => {
    const productId = e.target.value
    const prod = products.find(p => p.id === productId)
    setForm(prev => ({ ...prev, productId, price: prod?.price || 0 }))
  }

  const handlePrint = () => {
    onPrint?.({ ...form, ...totals })
    window.print()
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Invoice</h3>
        <button onClick={handlePrint} className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white">Print</button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input name="customerName" value={form.customerName} onChange={handleChange} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Product</label>
          <select name="productId" value={form.productId} onChange={handleProductChange} className="w-full rounded-md border px-3 py-2">
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input type="number" name="quantity" value={form.quantity} min={1} onChange={handleChange} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Discount (%)</label>
          <input type="number" name="discount" value={form.discount} onChange={handleChange} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tax (%)</label>
          <input type="number" name="tax" value={form.tax} onChange={handleChange} className="w-full rounded-md border px-3 py-2" />
        </div>
      </div>

      <div className="mt-6 border-t pt-4 grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Subtotal</p>
          <p className="font-medium">${totals.subtotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">After Discount</p>
          <p className="font-medium">${totals.discounted.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Total</p>
          <p className="font-semibold text-primary-700">${totals.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}


