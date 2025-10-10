import React, { useEffect, useMemo, useState } from 'react'
import { getVendorProfile } from '../services/vendorService'
import { getSubcategories, getSecondarySubcategories, hasCategory } from '../utils/categoryUtils'
import SpecEditor from './SpecEditor'

export default function ProductForm({ initialValues, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    secondarySubcategory: '',
    price: '',
    maxSellingPrice: '',
    purchasedPrice: '',
    units: '',
    brand: '',
    color: '',
    tags: '',
    recommended: false,
    weightPerUnit: '',
    size: '',
    capacity: '',
    length: '',
    images: [],
    specifications: '{}',
  })

  const [vendorCategory, setVendorCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [localFiles, setLocalFiles] = useState([])

  useEffect(() => {
    loadVendorCategory()
    if (initialValues) {
      setValues({
        title: initialValues.title || initialValues.name || '',
        description: initialValues.description || '',
        category: initialValues.category || '',
        subcategory: initialValues.subcategory || '',
        secondarySubcategory: initialValues.secondarySubcategory || '',
        price: initialValues.price || '',
        maxSellingPrice: initialValues.maxSellingPrice || '',
        purchasedPrice: initialValues.purchasedPrice || '',
        units: initialValues.units || initialValues.stock || '',
        brand: initialValues.brand || '',
        color: initialValues.color || '',
        tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : (initialValues.tags || ''),
        recommended: initialValues.recommended || false,
        weightPerUnit: initialValues.weightPerUnit || '',
        size: initialValues.size || '',
        capacity: initialValues.capacity || '',
        length: initialValues.length || '',
        images: Array.isArray(initialValues.images) ? initialValues.images : (initialValues.images?.[0] ? [initialValues.images[0]] : []),
        specifications: typeof initialValues.specifications === 'string'
          ? initialValues.specifications
          : JSON.stringify(initialValues.specifications || {}),
      })
    }
  }, [initialValues])

  const loadVendorCategory = async () => {
    try {
      setLoading(true)
      const profile = await getVendorProfile()
      const cat = profile?.category || ''
      setVendorCategory(cat)
      // If no initial category, set it from vendor
      setValues(prev => ({ ...prev, category: cat }))
    } catch (error) {
      console.error('Failed to load vendor profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!values.title || !values.price || !values.category || !values.subcategory) return

    const formData = new FormData()
    formData.append('title', values.title)
    formData.append('description', values.description)
    formData.append('category', values.category)
    formData.append('subcategory', values.subcategory)
    if (values.secondarySubcategory) formData.append('secondarySubcategory', values.secondarySubcategory)
    formData.append('price', String(parseFloat(values.price)))
    if (values.maxSellingPrice) formData.append('maxSellingPrice', String(parseFloat(values.maxSellingPrice)))
    if (values.purchasedPrice) formData.append('purchasedPrice', String(parseFloat(values.purchasedPrice)))
    formData.append('units', String(parseInt(values.units, 10) || 0))
    if (values.weightPerUnit) formData.append('weightPerUnit', String(parseFloat(values.weightPerUnit)))
    if (values.length) formData.append('length', String(parseFloat(values.length)))
    if (values.brand) formData.append('brand', values.brand)
    if (values.color) formData.append('color', values.color)
    if (values.size) formData.append('size', values.size)
    if (values.capacity) formData.append('capacity', values.capacity)
    if (values.recommended) formData.append('recommended', 'true')
    const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    if (tagsArray.length) formData.append('tags', JSON.stringify(tagsArray))
    if (values.specifications) formData.append('specifications', values.specifications)
    // Append files for backend upload
    localFiles.forEach(file => formData.append('images', file))

    onSubmit?.(formData)
  }

  const availableSubcategories = useMemo(() => {
    if (!values.category || !hasCategory(values.category)) return []
    return getSubcategories(values.category)
  }, [values.category])

  const availableSecondarySubcategories = useMemo(() => {
    if (!values.category || !values.subcategory) return []
    return getSecondarySubcategories(values.category, values.subcategory)
  }, [values.category, values.subcategory])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Product Title *</label>
            <input
              name="title"
              value={values.title}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={values.description}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Category Information */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Category Information</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <input
              name="category"
              value={values.category}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 bg-gray-50"
              required
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subcategory</label>
            <select
              name="subcategory"
              value={values.subcategory}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            >
              <option value="">Select Subcategory</option>
              {availableSubcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Secondary Subcategory</label>
            <select
              name="secondarySubcategory"
              value={values.secondarySubcategory}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select Secondary Subcategory</option>
              {availableSecondarySubcategories.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={values.price}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Selling Price</label>
            <input
              type="number"
              step="0.01"
              name="maxSellingPrice"
              value={values.maxSellingPrice}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Purchased Price</label>
            <input
              type="number"
              step="0.01"
              name="purchasedPrice"
              value={values.purchasedPrice}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Inventory & Details */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Inventory & Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Units in Stock *</label>
            <input
              type="number"
              name="units"
              value={values.units}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input
              name="brand"
              value={values.brand}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              name="color"
              value={values.color}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <input
              name="size"
              value={values.size}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Physical Attributes */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Physical Attributes</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Weight per Unit (kg)</label>
            <input
              type="number"
              step="0.01"
              name="weightPerUnit"
              value={values.weightPerUnit}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              name="capacity"
              value={values.capacity}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Length (cm)</label>
            <input
              type="number"
              step="0.01"
              name="length"
              value={values.length}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Media & Tags */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Media & Tags</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files
                if (!files || files.length === 0) return
                setLocalFiles(prev => [...prev, ...Array.from(files)])
              }}
              className="w-full"
            />
            {localFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {localFiles.map((file, idx) => {
                  const url = URL.createObjectURL(file)
                  return (
                    <div key={idx} className="relative">
                      <img src={url} alt={`product-${idx}`} className="h-20 w-full object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => setLocalFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-white border rounded-full h-6 w-6 text-xs"
                      >×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              name="tags"
              value={values.tags}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Specifications</label>
            <SpecEditor
              value={values.specifications}
              onChange={(specJsonString) => setValues(prev => ({ ...prev, specifications: specJsonString }))}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="recommended"
              checked={values.recommended}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Mark as Recommended</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Save Product
        </button>
      </div>
    </form>
  )
}


