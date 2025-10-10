const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Vendor', required: true, index: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    category: { type: String, trim: true },
    subcategory: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, min: 0, max: 100 },
    stock: { type: Number, default: 0, min: 0 },
    minOrderQuantity: { type: Number, default: 1 },
    maxOrderQuantity: { type: Number },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    images: [{ type: String, trim: true }],
    thumbnail: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    specifications: [{
      name: { type: String, required: true },
      value: { type: String, required: true }
    }],
    variants: [{
      name: { type: String, required: true },
      options: [{ type: String, required: true }],
      priceModifier: { type: Number, default: 0 }
    }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    reviews: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true },
      images: [{ type: String }],
      createdAt: { type: Date, default: Date.now }
    }],
    shipping: {
      weight: { type: Number },
      dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
      },
      shippingCost: { type: Number, default: 0 },
      freeShippingThreshold: { type: Number },
      estimatedDeliveryDays: { type: Number, default: 3 }
    },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }]
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isDigital: { type: Boolean, default: false },
    requiresPrescription: { type: Boolean, default: false },
    ageRestriction: { type: Number, min: 0 },
    expiryDate: { type: Date },
    sku: { type: String, trim: true, unique: true },
    barcode: { type: String, trim: true },
    stats: {
      views: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      wishlistCount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Indexes for better performance
productSchema.index({ vendorId: 1, isActive: 1 });
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('WB_Product', productSchema);


