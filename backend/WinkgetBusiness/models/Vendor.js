const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    storeName: { type: String, required: true, trim: true },
    websiteUrl: { type: String, trim: true },
    approved: { type: Boolean, default: false, index: true },
    role: { type: String, enum: ['vendor'], default: 'vendor', required: true },
    briefInfo: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WB_Vendor', vendorSchema);


