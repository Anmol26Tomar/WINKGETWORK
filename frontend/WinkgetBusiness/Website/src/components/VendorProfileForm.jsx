import React, { useState, useEffect } from 'react'
import { getVendorProfile, updateVendorProfile, uploadVendorDocument, updateVendorImages } from '../services/vendorService'

export default function VendorProfileForm({ vendor, onUpdate }) {
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
    ownerAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    
    // Business Information
    category: '',
    
    // Social Links
    socialLinks: {
      whatsapp: '',
      instagram: '',
      facebook: '',
      telegram: ''
    },
    websiteLink: '',
    
    // Media
    profileBanner: '',
    businessProfilePic: '',
    ownerPic: '',
    businessPosts: []
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (vendor) {
      setFormData({
        ownerName: vendor.ownerName || '',
        shopName: vendor.shopName || '',
        aboutBusiness: vendor.aboutBusiness || '',
        ownerEmail: vendor.ownerEmail || '',
        businessEmail: vendor.businessEmail || '',
        businessContact: vendor.businessContact || '',
        registeredContact: vendor.registeredContact || '',
        dob: vendor.dob ? new Date(vendor.dob).toISOString().split('T')[0] : '',
        gender: vendor.gender || '',
        businessAddress: vendor.businessAddress || {
          street: '', city: '', state: '', pincode: '', country: 'India'
        },
        ownerAddress: vendor.ownerAddress || {
          street: '', city: '', state: '', pincode: '', country: 'India'
        },
        category: vendor.category || '',
        socialLinks: vendor.socialLinks || {
          whatsapp: '', instagram: '', facebook: '', telegram: ''
        },
        websiteLink: vendor.websiteLink || '',
        profileBanner: vendor.profileBanner || '',
        businessProfilePic: vendor.businessProfilePic || '',
        ownerPic: vendor.ownerPic || '',
        businessPosts: vendor.businessPosts || []
      })
    }
  }, [vendor])

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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      await updateVendorProfile(formData)
      setMessage('Profile updated successfully!')
      onUpdate?.()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (type, imageUrl) => {
    try {
      const imageData = { [type]: imageUrl }
      await updateVendorImages(imageData)
      setFormData(prev => ({ ...prev, [type]: imageUrl }))
      setMessage('Image updated successfully!')
    } catch (error) {
      setMessage(`Error updating image: ${error.message}`)
    }
  }

  const handleDocumentUpload = async (documentData) => {
    try {
      await uploadVendorDocument(documentData)
      setMessage('Document uploaded successfully!')
    } catch (error) {
      setMessage(`Error uploading document: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
      
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
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shop Name *</label>
              <input
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">About Business</label>
              <textarea
                name="aboutBusiness"
                value={formData.aboutBusiness}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
                rows="3"
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
                className="w-full rounded-md border px-3 py-2"
                required
              />
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registered Contact</label>
              <input
                name="registeredContact"
                value={formData.registeredContact}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Business Address */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Business Address</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Street</label>
              <input
                name="businessAddress.street"
                value={formData.businessAddress.street}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                name="businessAddress.city"
                value={formData.businessAddress.city}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                name="businessAddress.state"
                value={formData.businessAddress.state}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <input
                name="businessAddress.pincode"
                value={formData.businessAddress.pincode}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Social Links</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                name="socialLinks.whatsapp"
                value={formData.socialLinks.whatsapp}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
                placeholder="https://wa.me/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                name="socialLinks.instagram"
                value={formData.socialLinks.instagram}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <input
                name="socialLinks.facebook"
                value={formData.socialLinks.facebook}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                name="websiteLink"
                value={formData.websiteLink}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Image Management */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Images</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Banner</label>
              <input
                type="url"
                placeholder="Image URL"
                className="w-full rounded-md border px-3 py-2 mb-2"
                onBlur={(e) => e.target.value && handleImageUpload('profileBanner', e.target.value)}
              />
              {formData.profileBanner && (
                <img src={formData.profileBanner} alt="Banner" className="w-full h-20 object-cover rounded" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business Profile Pic</label>
              <input
                type="url"
                placeholder="Image URL"
                className="w-full rounded-md border px-3 py-2 mb-2"
                onBlur={(e) => e.target.value && handleImageUpload('businessProfilePic', e.target.value)}
              />
              {formData.businessProfilePic && (
                <img src={formData.businessProfilePic} alt="Business Profile" className="w-full h-20 object-cover rounded" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner Picture</label>
              <input
                type="url"
                placeholder="Image URL"
                className="w-full rounded-md border px-3 py-2 mb-2"
                onBlur={(e) => e.target.value && handleImageUpload('ownerPic', e.target.value)}
              />
              {formData.ownerPic && (
                <img src={formData.ownerPic} alt="Owner" className="w-full h-20 object-cover rounded" />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
