const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  // Bill Identification
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Vendor Information
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  vendorBusinessName: {
    type: String,
    required: true
  },
  vendorAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  vendorContact: {
    email: String,
    phone: String,
    website: String
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for manual bills
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: String,
  customerPhone: String,
  customerAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Order Information (if bill is generated from order)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  
  // Bill Items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false
    },
    productName: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Pricing Details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Bill Status and Type
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  billType: {
    type: String,
    enum: ['order', 'manual'],
    required: true
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'pending'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: Date,
  
  // Dates
  billDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  
  // Additional Information
  notes: String,
  termsAndConditions: String,
  
  // File Information
  pdfPath: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
billSchema.index({ vendor: 1, billDate: -1 });
billSchema.index({ customer: 1 });
billSchema.index({ billNumber: 1 });
billSchema.index({ status: 1 });
billSchema.index({ billType: 1 });

// Virtual for formatted bill number
billSchema.virtual('formattedBillNumber').get(function() {
  return `BILL-${this.billNumber}`;
});

// Pre-save middleware to generate bill number
billSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    try {
      const count = await this.constructor.countDocuments();
      this.billNumber = String(count + 1).padStart(6, '0');
    } catch (error) {
      // Fallback to timestamp if count fails
      this.billNumber = String(Date.now()).slice(-6);
    }
  }
  next();
});

// Method to calculate totals
billSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.deliveryCharge + this.taxAmount - this.discountAmount;
  return this;
};

// Method to mark as paid
billSchema.methods.markAsPaid = function(paymentMethod = 'cash') {
  this.paymentStatus = 'paid';
  this.paymentMethod = paymentMethod;
  this.paidAt = new Date();
  this.status = 'paid';
  return this;
};

module.exports = mongoose.model('Bill', billSchema);
