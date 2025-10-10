const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true },
		phone: { type: String, trim: true },
		role: { type: String, enum: ['user', 'admin', 'business_owner'], default: 'user', required: true },
		profileImage: { type: String, trim: true },
		address: {
			street: { type: String, trim: true },
			city: { type: String, trim: true },
			state: { type: String, trim: true },
			pincode: { type: String, trim: true },
			country: { type: String, trim: true, default: 'India' }
		},
		preferences: {
			notifications: { type: Boolean, default: true },
			language: { type: String, default: 'en' },
			currency: { type: String, default: 'INR' }
		},
		businessAccess: [{
			businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
			businessType: { type: String, enum: ['food_delivery', 'finance', 'b2b', 'b2c', 'express', 'marketplace'] },
			permissions: [{ type: String }],
			joinedAt: { type: Date, default: Date.now }
		}],
		isActive: { type: Boolean, default: true },
		lastLogin: { type: Date },
		loginCount: { type: Number, default: 0 }
	},
	{ timestamps: true }
);
module.exports = mongoose.model('User', userSchema);