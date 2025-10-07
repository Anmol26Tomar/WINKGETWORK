import React, { useEffect, useState } from 'react'

export default function ProductForm({ initialValues, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image: '',
  })

  useEffect(() => {
    if (initialValues) setValues({ ...initialValues, price: String(initialValues.price), stock: String(initialValues.stock) })
  }, [initialValues])

  const handleChange = e => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!values.name || !values.price || !values.stock) return
    onSubmit?.({
      ...values,
      price: parseFloat(values.price),
      stock: parseInt(values.stock, 10),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={values.name} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input name="category" value={values.category} onChange={handleChange} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input type="number" step="0.01" name="price" value={values.price} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input type="number" name="stock" value={values.stock} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input name="image" value={values.image} onChange={handleChange} className="w-full rounded-md border px-3 py-2" placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={values.description} onChange={handleChange} className="w-full rounded-md border px-3 py-2" rows="3" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded-md border">Cancel</button>
        <button type="submit" className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white">Save</button>
      </div>
    </form>
  )
}


