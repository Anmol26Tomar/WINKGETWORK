const mongoose = require('mongoose');

const expressadminSchema = new mongoose.Schema(
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
    role: { type: String, required: true, default: 'admin' },
  },
);

module.exports = mongoose.model('ExpressAdmin', expressadminSchema);


