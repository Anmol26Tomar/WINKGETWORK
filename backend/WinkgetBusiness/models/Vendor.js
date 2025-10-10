const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
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
=======
    // Basic Information
    ownerName: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true, unique: true, index: true },
    aboutBusiness: { type: String, trim: true },
    
    // Contact Information
    ownerEmail: { type: String, required: true, unique: true, lowercase: true, index: true },
    businessEmail: { type: String, lowercase: true },
    businessContact: { type: String, trim: true },
    registeredContact: { type: String, trim: true },
    
    // Authentication
    passwordHash: { type: String, required: true }, // Store only hashed password
    
    // Personal Information
    dob: { type: Date },
    gender: { 
      type: String, 
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be male, female, or other'
      },
      default: undefined 
    },
    
    // Address Information
    businessAddress: {
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
<<<<<<< HEAD
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
=======
      country: { type: String, trim: true, default: 'India' }
    },
    ownerAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' }
    },
    
    // Business Information
    category: { type: String, trim: true, index: true }, // Main business category for search optimization
    documents: [{
      type: { type: String, enum: ['gst', 'pan', 'aadhar', 'business_license', 'other'] },
      documentUrl: { type: String, required: true },
      documentName: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false }
    }],
    isApproved: { type: Boolean, default: false, index: true },
    
    // Media
    businessPosts: [{ type: String }], // Shop images
    ownerPic: { type: String },
    profileBanner: { type: String },
    businessProfilePic: { type: String },
    
    // Social Links (Optional)
    socialLinks: {
      whatsapp: { type: String, trim: true },
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      telegram: { type: String, trim: true }
    },
    websiteLink: { type: String, trim: true },
    
    // Reviews and Ratings
    reviews: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    
    // System Fields
    role: { type: String, enum: ['vendor'], default: 'vendor', required: true },
    
    // Backward Compatibility Fields
    name: { type: String, trim: true }, // Maps to ownerName
    email: { type: String, lowercase: true }, // Maps to ownerEmail
    storeName: { type: String, trim: true }, // Maps to shopName
    websiteUrl: { type: String, trim: true }, // Maps to websiteLink
    approved: { type: Boolean, default: false }, // Maps to isApproved
    briefInfo: { type: String, trim: true }, // Maps to aboutBusiness
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498
  },
  { timestamps: true }
);

<<<<<<< HEAD
// Indexes for better performance
vendorSchema.index({ businessId: 1, approved: 1 });
vendorSchema.index({ businessType: 1 });
vendorSchema.index({ 'address.city': 1 });
vendorSchema.index({ categories: 1 });
vendorSchema.index({ rating: -1 });
=======
// Indexes for optimized search
vendorSchema.index({ category: 1, isApproved: 1 });
vendorSchema.index({ shopName: 'text', aboutBusiness: 'text' });
vendorSchema.index({ 'businessAddress.city': 1 });
vendorSchema.index({ averageRating: -1 });

// Pre-save middleware to sync backward compatibility fields
vendorSchema.pre('save', function(next) {
  if (this.ownerName && !this.name) this.name = this.ownerName;
  if (this.ownerEmail && !this.email) this.email = this.ownerEmail;
  if (this.shopName && !this.storeName) this.storeName = this.shopName;
  if (this.websiteLink && !this.websiteUrl) this.websiteUrl = this.websiteLink;
  if (this.isApproved !== undefined && this.approved === undefined) this.approved = this.isApproved;
  if (this.aboutBusiness && !this.briefInfo) this.briefInfo = this.aboutBusiness;
  
  // Calculate average rating
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  
  next();
});
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498

module.exports = mongoose.model('WB_Vendor', vendorSchema);


