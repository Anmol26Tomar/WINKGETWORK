import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import ProductForm from '../components/ProductForm.jsx'
import { createProduct, updateProduct as updateProductService, deleteProduct as deleteProductService, fetchProducts } from '../services/productService.js'
import { useEffect } from 'react'

export default function Products() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const products = useMemo(() => state.products, [state.products])

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchProducts()
        // normalize to id field for UI
        const normalized = list.map(p => ({ ...p, id: p._id }))
        // replace current state with fetched
        // simple approach: clear and add
        normalized.forEach(() => {})
        // dispatching a replace is not present; emulate by resetting via logout+login would be overkill.
        // Instead, remove duplicates and add missing
        const existingIds = new Set(state.products.map(p => p.id))
        normalized.forEach(p => {
          if (!existingIds.has(p.id)) dispatch({ type: 'ADD_PRODUCT', payload: p })
        })
      } catch {}
    })()
  }, [])

  const handleAdd = () => {
    setEditing(null)
    setShowForm(true)
  }

  const handleSubmit = async values => {
    if (editing) {
      const updatedServer = await updateProductService({ ...editing, ...values })
      const updated = { ...updatedServer, id: updatedServer._id }
      dispatch({ type: 'UPDATE_PRODUCT', payload: updated })
    } else {
      const created = await createProduct(values)
      const newProduct = { ...created, id: created._id }
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct })
    }
    setShowForm(false)
  }

  const handleEdit = product => {
    setEditing(product)
    setShowForm(true)
  }

  const handleDelete = async product => {
    if (!confirm(`Delete ${product.name}?`)) return
    await deleteProductService(product.id)
    dispatch({ type: 'DELETE_PRODUCT', payload: product.id })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <button onClick={handleAdd} className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white">Add Product</button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h3>
          </div>
          <div className="mt-4">
            <ProductForm initialValues={editing || undefined} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}


