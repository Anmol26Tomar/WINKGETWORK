const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'WB_Vendor', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WB_Product', productSchema);


