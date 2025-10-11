import React from 'react'

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg border p-4 flex gap-4">
      <img src={product.image} alt={product.name} className="h-24 w-32 object-cover rounded" />
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-xs text-gray-500">{product.category}</p>
          </div>
          <span className="text-primary-700 font-semibold">${product.price}</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>{product.description}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Stock: {product.stock}</span>
          <div className="flex gap-2">
            <button onClick={() => onEdit?.(product)} className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50">Edit</button>
            <button onClick={() => onDelete?.(product)} className="px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}


