const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Vendor Reference
    vendorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Vendor', required: true, index: true },
    
    // Basic Product Information
    sku: { type: String, trim: true },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    
    // Pricing
    maxSellingPrice: { type: Number, min: 0 },
    price: { type: Number, required: true, min: 0, index: true },
    purchasedPrice: { type: Number, min: 0 },
    
    // Category System (Optimized for Search)
    category: { type: String, required: true, trim: true, index: true },
    subcategory: { type: String, trim: true, index: true },
    secondarySubcategory: { type: String, trim: true, index: true },
    
    // Inventory
    units: { type: Number, default: 0, min: 0, index: true },
    sold: { type: Number, default: 0, min: 0 },
    
    // Media
    images: [{ type: String }],
    
    // Product Details
    color: { type: String, trim: true },
    tags: [{ type: String, trim: true, index: true }],
    recommended: { type: Boolean, default: false, index: true },
    brand: { type: String, trim: true, index: true },
    
    // Ratings and Reviews
    ratings: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    
    // Specifications
    specifications: mongoose.Schema.Types.Mixed, // Object or Array for flexible specs
    
    // Physical Attributes
    weightPerUnit: { type: Number, min: 0 }, // in kg
    size: { type: String, trim: true },
    capacity: { type: String, trim: true },
    length: { type: Number, min: 0 }, // in cm
    
    // Product Variants
    linkedVariants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WB_Product' }],
    
    // Status
    isActive: { type: Boolean, default: true, index: true },
    
    // Backward Compatibility Fields
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Vendor' }, // Maps to vendorRef
    name: { type: String, trim: true }, // Maps to title
    stock: { type: Number, default: 0, min: 0 }, // Maps to units
    image: { type: String, trim: true }, // Maps to images[0]
  },
  { timestamps: true }
);

// Compound indexes for optimized search
productSchema.index({ category: 1, subcategory: 1, secondarySubcategory: 1 });
productSchema.index({ vendorRef: 1, isActive: 1 });
productSchema.index({ price: 1, averageRating: -1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ recommended: 1, averageRating: -1 });

// Pre-save middleware to sync backward compatibility fields
productSchema.pre('save', function(next) {
  if (this.vendorRef && !this.vendorId) this.vendorId = this.vendorRef;
  if (this.title && !this.name) this.name = this.title;
  if (this.units !== undefined && this.stock === undefined) this.stock = this.units;
  if (this.images && this.images.length > 0 && !this.image) this.image = this.images[0];
  
  // Calculate average rating
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
    this.totalRatings = this.ratings.length;
  }
  
  next();
});

module.exports = mongoose.model('WB_Product', productSchema);


