const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
	{
		lat: { type: Number, required: true },
		lng: { type: Number, required: true },
		address: { type: String, required: true, trim: true },
	},
	{ _id: false }
);

const packageSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		size: { type: String, required: true, trim: true },
		weight: { type: Number, required: true },
		description: { type: String, trim: true },
		value: { type: Number, default: 0 },
		length: { type: Number, default: 0 },
		width: { type: Number, default: 0 },
		height: { type: Number, default: 0 },
	},
	{ _id: false }
);

const otpSchema = new mongoose.Schema(
	{
		code: { type: String },
		expiresAt: { type: Date },
		verified: { type: Boolean, default: false },
		attempts: { type: Number, default: 0 },
	},
	{ _id: false }
);

const parcelSchema = new mongoose.Schema(
	{
		userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		pickup: { type: pointSchema, required: true },
		delivery: { type: pointSchema, required: true },
		package: { type: packageSchema, required: true },
		receiverName: { type: String, required: true, trim: true },
		receiverContact: { type: String, required: true, trim: true },
		vehicleType: { type: String, default: 'bike' },
		vehicleSubType: { type: String, trim: true },
		typeOfDelivery: { type: String, enum: ['standard', 'express'], default: 'standard' },
		fareEstimate: { type: Number, required: true },
		accepted: { type: Boolean, default: false },
		captainRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Captain', default: null },
		status: { type: String, enum: ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
		otp: { type: otpSchema, default: () => ({}) },
	},
	{ timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Parcel', parcelSchema);


