const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], required: true, default: 'user' },
    approved: { type: Boolean, default: true },
    lastLogin: { type: Date },
    bills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bill' }], // Reference to bills
  },
  { timestamps: true }
);

module.exports = mongoose.model('WB_User', userSchema);



