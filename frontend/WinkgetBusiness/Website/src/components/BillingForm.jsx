import React, { useMemo, useState } from 'react'
import { createBill } from '../services/billService.js'

export default function BillingForm({ products, initial, onPrint, onBillCreated }) {
  const [form, setForm] = useState({
    customerName: initial?.customerName || '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    productId: initial?.productId || (products[0]?.id || ''),
    quantity: initial?.quantity || 1,
    price: initial?.price || (products[0]?.price || 0),
    discount: initial?.discount || 0,
    tax: initial?.tax || 0,
    deliveryCharge: 0,
    notes: '',
    dueDate: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(() => products.find(p => p.id === form.productId), [products, form.productId])

  const totals = useMemo(() => {
    const subtotal = form.quantity * form.price
    const discountAmount = (subtotal * (form.discount || 0)) / 100
    const discounted = subtotal - discountAmount
    const taxAmount = (discounted * (form.tax || 0)) / 100
    const total = discounted + taxAmount + (form.deliveryCharge || 0)
    return { subtotal, discountAmount, discounted, taxAmount, total }
  }, [form])

  const handleChange = e => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setForm(prev => ({ 
        ...prev, 
        [name]: name === 'productId' ? value : Number.isNaN(Number(value)) ? value : Number(value) 
      }))
    }
  }

  const handleProductChange = e => {
    const productId = e.target.value
    const prod = products.find(p => p.id === productId)
    setForm(prev => ({ ...prev, productId, price: prod?.price || 0 }))
  }

  // Generate unique bill number
  const generateBillNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `BILL-${timestamp}-${random}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const billData = {
        billNumber: generateBillNumber(),
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        items: [{
          productId: form.productId && form.productId.match(/^[0-9a-fA-F]{24}$/) ? form.productId : null,
          productName: selected?.name || '',
          description: selected?.description || '',
          quantity: form.quantity,
          unitPrice: form.price,
          totalPrice: form.quantity * form.price
        }],
        subtotal: totals.subtotal,
        deliveryCharge: form.deliveryCharge,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.total,
        billType: 'manual',
        status: 'draft',
        notes: form.notes,
        dueDate: form.dueDate ? new Date(form.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
      
      await createBill(billData)
      onBillCreated?.()
      setForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: { street: '', city: '', state: '', pincode: '', country: 'India' },
        productId: products[0]?.id || '',
        quantity: 1,
        price: products[0]?.price || 0,
        discount: 0,
        tax: 0,
        deliveryCharge: 0,
        notes: '',
        dueDate: ''
      })
    } catch (error) {
      setError(error.message || 'Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    onPrint?.({ ...form, ...totals })
    window.print()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Create Bill</h3>
        <div className="flex space-x-2">
          <button type="button" onClick={handlePrint} className="px-4 py-2 text-sm rounded-md bg-gray-600 text-white">
            Print Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Information */}
        <div>
          <h4 className="text-md font-medium mb-4">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <input 
                name="customerName" 
                value={form.customerName} 
                onChange={handleChange} 
                className="w-full rounded-md border px-3 py-2" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                name="customerEmail" 
                type="email"
                value={form.customerEmail} 
                onChange={handleChange} 
                className="w-full rounded-md border px-3 py-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input 
                name="customerPhone" 
                value={form.customerPhone} 
                onChange={handleChange} 
                className="w-full rounded-md border px-3 py-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input 
                name="dueDate" 
                type="date"
                value={form.dueDate} 
                onChange={handleChange} 
                className="w-full rounded-md border px-3 py-2" 
              />
            </div>
          </div>
          
          {/* Customer Address */}
          <div className="mt-4">
            <h5 className="text-sm font-medium mb-2">Customer Address</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input 
                  name="customerAddress.street" 
                  value={form.customerAddress.street} 
                  onChange={handleChange} 
                  className="w-full rounded-md border px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input 
                  name="customerAddress.city" 
                  value={form.customerAddress.city} 
                  onChange={handleChange} 
                  className="w-full rounded-md border px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input 
                  name="customerAddress.state" 
                  value={form.customerAddress.state} 
                  onChange={handleChange} 
                  className="w-full rounded-md border px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <input 
                  name="customerAddress.pincode" 
                  value={form.customerAddress.pincode} 
                  onChange={handleChange} 
                  className="w-full rounded-md border px-3 py-2" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div>
          <h4 className="text-md font-medium mb-4">Product Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="w-full rounded-md border px-3 py-2" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit Price</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full rounded-md border px-3 py-2" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Charge</label>
              <input name="deliveryCharge" type="number" value={form.deliveryCharge} onChange={handleChange} className="w-full rounded-md border px-3 py-2" min="0" step="0.01" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h4 className="text-md font-medium mb-4">Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input name="discount" type="number" value={form.discount} onChange={handleChange} className="w-full rounded-md border px-3 py-2" min="0" max="100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax (%)</label>
              <input name="tax" type="number" value={form.tax} onChange={handleChange} className="w-full rounded-md border px-3 py-2" min="0" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea 
            name="notes" 
            value={form.notes} 
            onChange={handleChange} 
            className="w-full rounded-md border px-3 py-2" 
            rows="3"
            placeholder="Additional notes for the bill..."
          />
        </div>

        {/* Totals */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-md font-medium mb-3">Bill Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-₹{totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>After Discount:</span>
              <span>₹{totals.discounted.toFixed(2)}</span>
            </div>
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{totals.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {form.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery Charge:</span>
                <span>₹{form.deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Bill...' : 'Create Bill'}
          </button>
        </div>
      </div>
    </form>
  )
}


