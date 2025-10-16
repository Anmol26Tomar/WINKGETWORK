import React, { useState } from 'react'
import { vendorSignup, vendorLogout } from '../services/vendorService'
import { rawCategories } from '../utils/categories'
import { useApp } from '../context/AppContext'

export default function VendorSignupForm({ onSuccess, onError }) {
  const { dispatch } = useApp()
  const steps = [
    'Basic',
    'Contact',
    'Address',
    'Business',
    'Social',
    'Media',
    'Security',
    'Review'
  ]
  const [step, setStep] = useState(0)
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

  const [profilePhotoFile, setProfilePhotoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [gstinDocFile, setGstinDocFile] = useState(null)
  const [gstinNumber, setGstinNumber] = useState('')

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!formData.ownerName) e.ownerName = 'Owner name is required'
      if (!formData.shopName) e.shopName = 'Shop name is required'
    } else if (step === 1) {
      if (!formData.ownerEmail) e.ownerEmail = 'Owner email is required'
      if (formData.ownerEmail && !/\S+@\S+\.\S+/.test(formData.ownerEmail)) e.ownerEmail = 'Invalid email format'
    } else if (step === 6) {
      if (!formData.password) e.password = 'Password is required'
      if (formData.password && formData.password.length < 6) e.password = 'Password must be at least 6 characters'
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (validateStep()) setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const handleBack = (e) => {
    e.preventDefault()
    setStep((s) => Math.max(s - 1, 0))
  }

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
      
      // Build multipart form-data for backend upload handling
      const form = new FormData()
      Object.entries(signupData).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          if (typeof v === 'object') form.append(k, JSON.stringify(v))
          else form.append(k, v)
        }
      })
      if (gstinNumber) form.append('gstinNumber', gstinNumber)
      if (profilePhotoFile) form.append('ownerPic', profilePhotoFile)
      if (bannerFile) form.append('profileBanner', bannerFile)
      if (gstinDocFile) form.append('gstinDoc', gstinDocFile)

      const user = await vendorSignup(form, true)
      
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
      {/* Timeline header */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center">
          {steps.map((label, idx) => (
            <div key={label} className="flex items-center flex-1">
              <div className={`w-3 h-3 rounded-full ${idx <= step ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${idx < step ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex mt-2 text-xs font-semibold text-gray-600">
          {steps.map((label, idx) => (
            <div key={`lbl-${label}`} className="flex-1 text-center">
              <span className={`${idx === step ? 'text-gray-900' : ''}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Information */}
      {step === 0 && (
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
        <div className="flex justify-between mt-4">
          <div />
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Contact Information */}
      {step === 1 && (
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
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Business Address */}
      {step === 2 && (
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
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Business Details */}
      {step === 3 && (
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
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">GSTIN Number</label>
            <input
              value={gstinNumber}
              onChange={(e) => setGstinNumber(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="12ABCDE1234F1Z5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Upload GSTIN Document</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setGstinDocFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Social Links */}
      {step === 4 && (
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
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Media */}
      {step === 5 && (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Media</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Profile Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Banner Image</label>
            <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Security */}
      {step === 6 && (
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
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
        </div>
      </div>
      )}

      {/* Review */}
      {step === 7 && (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Basic</div>
            <div>Owner: {formData.ownerName || '-'}</div>
            <div>Shop: {formData.shopName || '-'}</div>
            <div>About: {formData.aboutBusiness || '-'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Contact</div>
            <div>Owner Email: {formData.ownerEmail || '-'}</div>
            <div>Business Email: {formData.businessEmail || '-'}</div>
            <div>Business Contact: {formData.businessContact || '-'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Address</div>
            <div>{formData.businessAddress.street || '-'}</div>
            <div>{formData.businessAddress.city || '-'} {formData.businessAddress.state || ''}</div>
            <div>{formData.businessAddress.pincode || '-'}</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Business</div>
            <div>Category: {formData.category || '-'}</div>
            <div>Website: {formData.websiteLink || '-'}</div>
            <div>GSTIN: {gstinNumber || '-'}</div>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={handleBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Back</button>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Creating Account...' : 'Create Vendor Account'}
          </button>
        </div>
      </div>
      )}
    </form>
  )
}
