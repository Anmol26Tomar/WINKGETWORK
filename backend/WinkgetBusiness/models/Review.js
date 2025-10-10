const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Vendor', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Product' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, trim: true },
    images: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    reported: { type: Boolean, default: false },
    reportReason: { type: String },
    isActive: { type: Boolean, default: true },
    response: {
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Vendor' },
      comment: { type: String, trim: true },
      respondedAt: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

// Indexes for better performance
reviewSchema.index({ businessId: 1, rating: -1 });
reviewSchema.index({ vendorId: 1, rating: -1 });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ isActive: 1, isVerified: 1 });

// Ensure one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('WB_Review', reviewSchema);
