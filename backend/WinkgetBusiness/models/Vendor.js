const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
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
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
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
  },
  { timestamps: true }
);

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

module.exports = mongoose.model('WB_Vendor', vendorSchema);


