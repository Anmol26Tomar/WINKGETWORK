const mongoose = require('mongoose');

const superadminSchema = new mongoose.Schema(
	{
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true },
    role: { type: String, default: 'superadmin' },
  },
);

module.exports = mongoose.model('SuperAdmin', superadminSchema);


