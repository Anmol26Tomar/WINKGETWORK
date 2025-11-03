const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
	{
		lat: { type: Number, required: true },
		lng: { type: Number, required: true },
		address: { type: String, required: true, trim: true },
	},
	{ _id: false }
);

const transportSchema = new mongoose.Schema(
	{
		userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		pickup: { type: pointSchema, required: true },
		destination: { type: pointSchema, required: true },
		vehicleType: { type: String, enum: ['cab', 'bike', 'truck'], required: true },
		vehicleSubType: { type: String, trim: true },
		fareEstimate: { type: Number, required: true },
		distanceKm: { type: Number, default: 0 },
		agentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
		captainRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null }, // Keep for backward compatibility
		rideAccepted: { type: Boolean, default: false },
		status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
		paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
		completionOtp: { type: String },
		otpPickupHash: { type: String, default: null },
		otpDropHash: { type: String, default: null },
		rejectionReason: { type: String },
		cancellationReason: { type: String },
		startedAt: { type: Date },
		completedAt: { type: Date },
		cancelledAt: { type: Date },
	},
	{ timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Transport', transportSchema);

