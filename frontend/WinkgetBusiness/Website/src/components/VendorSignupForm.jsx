import React, { useState } from 'react'
import { vendorSignup } from '../services/vendorService'
import { rawCategories } from '../utils/categories'
import { useApp } from '../context/AppContext'

export default function VendorSignupForm({ onSuccess, onError }) {
  const { dispatch } = useApp()
  const [formData, setFormData] = useState({
    // Basic Information
    ownerName: '',
    shopName: '',
    aboutBusiness: '',
    
    // Contact Information
    ownerEmail: '',
    businessEmail: '',
    businessContact: '',
    registeredContact: '',
    
    // Personal Information
    dob: '',
    gender: '',
    
    // Address Information
    businessAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    
    // Business Information
    category: '',
    websiteLink: '',
    
    // Social Links
    socialLinks: {
      whatsapp: '',
      instagram: '',
      facebook: '',
      telegram: ''
    },
    
    // Authentication
    password: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Required fields
    if (!formData.ownerName) newErrors.ownerName = 'Owner name is required'
    if (!formData.shopName) newErrors.shopName = 'Shop name is required'
    if (!formData.ownerEmail) newErrors.ownerEmail = 'Owner email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    
    // Email validation
    if (formData.ownerEmail && !/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Invalid email format'
    }
    
    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      // Remove confirmPassword and empty fields from data
      const { confirmPassword, ...signupData } = formData
      
      // Clean up empty optional fields
      if (!signupData.gender || signupData.gender.trim() === '') {
        delete signupData.gender
      }
      if (!signupData.dob || signupData.dob.trim() === '') {
        delete signupData.dob
      }
      if (!signupData.businessEmail || signupData.businessEmail.trim() === '') {
        delete signupData.businessEmail
      }
      if (!signupData.businessContact || signupData.businessContact.trim() === '') {
        delete signupData.businessContact
      }
      if (!signupData.registeredContact || signupData.registeredContact.trim() === '') {
        delete signupData.registeredContact
      }
      if (!signupData.websiteLink || signupData.websiteLink.trim() === '') {
        delete signupData.websiteLink
      }
      
      const user = await vendorSignup(signupData)
      
      // Update auth context to mark user as authenticated
      dispatch({ type: 'LOGIN_SUCCESS', payload: user })
      
      onSuccess?.()
    } catch (error) {
      // Handle specific field errors
      if (error.message && error.message.includes('already')) {
        onError?.(error.message)
      } else {
        onError?.(error.message || 'Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Extract main categories from rawCategories
  const businessCategories = rawCategories.map(category => category.category)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Owner Name *</label>
            <input
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 ${errors.ownerName ? 'border-red-500' : ''}`}
              required
            />
            {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name *</label>
            <input
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 ${errors.shopName ? 'border-red-500' : ''}`}
              required
            />
            {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">About Business</label>
            <textarea
              name="aboutBusiness"
              value={formData.aboutBusiness}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              rows="3"
              placeholder="Tell us about your business..."
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Owner Email *</label>
            <input
              name="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 ${errors.ownerEmail ? 'border-red-500' : ''}`}
              required
            />
            {errors.ownerEmail && <p className="text-red-500 text-xs mt-1">{errors.ownerEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business Email</label>
            <input
              name="businessEmail"
              type="email"
              value={formData.businessEmail}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business Contact</label>
            <input
              name="businessContact"
              value={formData.businessContact}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Registered Contact</label>
            <input
              name="registeredContact"
              value={formData.registeredContact}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="+91 9876543210"
            />
          </div>
        </div>
      </div>

      {/* Business Address */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Business Address</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Street Address</label>
            <input
              name="businessAddress.street"
              value={formData.businessAddress.street}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="123 Main Street, Building Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              name="businessAddress.city"
              value={formData.businessAddress.city}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Mumbai"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              name="businessAddress.state"
              value={formData.businessAddress.state}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Maharashtra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pincode</label>
            <input
              name="businessAddress.pincode"
              value={formData.businessAddress.pincode}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="400001"
            />
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Business Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select Category</option>
              {businessCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website Link</label>
            <input
              name="websiteLink"
              type="url"
              value={formData.websiteLink}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Social Media Links (Optional)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input
              name="socialLinks.whatsapp"
              value={formData.socialLinks.whatsapp}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="https://wa.me/919876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <input
              name="socialLinks.instagram"
              value={formData.socialLinks.instagram}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="https://instagram.com/yourbusiness"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <input
              name="socialLinks.facebook"
              value={formData.socialLinks.facebook}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="https://facebook.com/yourbusiness"
            />
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Account Security</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 ${errors.password ? 'border-red-500' : ''}`}
              required
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password *</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              required
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Vendor Account'}
        </button>
      </div>
    </form>
  )
}
