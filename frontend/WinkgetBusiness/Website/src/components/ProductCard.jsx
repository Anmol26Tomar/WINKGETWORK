import React from 'react'

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex gap-4">
        <img 
          src={product.image || product.images?.[0] || '/placeholder-product.jpg'} 
          alt={product.name || product.title} 
          className="h-28 w-36 object-cover rounded-lg shadow-sm" 
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {product.name || product.title}
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                {product.category}
              </p>
            </div>
            <span className="text-xl font-bold text-blue-600">
              ₹{product.price}
            </span>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${
              (product.stock || product.units || 0) < 5 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              Stock: {product.stock || product.units || 0}
            </span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onEdit?.(product)} 
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete?.(product)} 
                className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


