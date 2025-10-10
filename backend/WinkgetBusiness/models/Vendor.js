const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    storeName: { type: String, required: true, trim: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', index: true },
    businessType: { 
      type: String, 
      enum: ['food_delivery', 'finance', 'b2b', 'b2c', 'express', 'marketplace', 'healthcare', 'education', 'entertainment'],
      // optional during lightweight signup; can be set later
    },
    description: { type: String, trim: true },
    logo: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    operatingHours: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      openTime: { type: String },
      closeTime: { type: String },
      isClosed: { type: Boolean, default: false }
    }],
    categories: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    approved: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ['vendor'], default: 'vendor', required: true },
    briefInfo: { type: String, trim: true },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalCustomers: { type: Number, default: 0 }
    },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true }
    },
    paymentInfo: {
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      upiId: { type: String, trim: true },
      gstNumber: { type: String, trim: true }
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

// Indexes for better performance
vendorSchema.index({ businessId: 1, approved: 1 });
vendorSchema.index({ businessType: 1 });
vendorSchema.index({ 'address.city': 1 });
vendorSchema.index({ categories: 1 });
vendorSchema.index({ rating: -1 });

module.exports = mongoose.model('WB_Vendor', vendorSchema);


