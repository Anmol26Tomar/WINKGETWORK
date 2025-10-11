const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");
const Transport = require('../models/Transport');
const Parcel = require('../models/Parcel');
const auth = require('../middleware/authMiddleware');

const {CaptainLogin,CaptainSignup,CaptainProfile}=require('../controllers/authController');
const {getCaptainOrders}=require('../controllers/agentController');

// Public routes
router.post('/captainsignup',CaptainSignup);
router.post('/captainlogin',CaptainLogin);
router.post('/profile',CaptainProfile);

// Protected routes
router.get('/profile', auth, async (req, res) => {
	try {
		const captain = await Agent.findById(req.user.id).select('-password');
		if (!captain) {
			return res.status(404).json({ message: 'Captain not found' });
		}
		return res.status(200).json(captain);
	} catch (error) {
		console.error('Error fetching captain profile:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

router.get('/orders',getCaptainOrders);

// Helper: Haversine distance (km)
function haversineKm(lat1, lng1, lat2, lng2) {
	const R = 6371; // Earth radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * @route GET /agent/orders/nearby
 * @desc Get nearby pending orders for a captain from both Parcel and Transport models
 * @query lat, lng, vehicleType, rangeKm
 */
router.get('/orders/nearby', auth, async (req, res) => {
	try {
		const { lat, lng, vehicleType, rangeKm = 10 } = req.query;

		if (!lat || !lng)
			return res.status(400).json({ message: 'Latitude and longitude are required' });

		const latitude = parseFloat(lat);
		const longitude = parseFloat(lng);
		const range = parseFloat(rangeKm);

		console.log(`Fetching orders near ${latitude}, ${longitude} within ${range}km`);

		// Get captain's vehicle type if not provided
		let captainVehicleType = vehicleType;
		if (!captainVehicleType) {
			const captain = await Agent.findById(req.user.id);
			captainVehicleType = captain?.vehicleType;
		}

		console.log(`Captain vehicle type: ${captainVehicleType}`);

		// Fetch pending orders from both models
		const [transportOrders, parcelOrders] = await Promise.all([
			// Transport orders
			Transport.find({ 
				status: 'pending',
				vehicleType: captainVehicleType 
			}).populate('userRef', 'name phone').lean(),
			
			// Parcel orders (only for bike captains)
			captainVehicleType === 'bike' ? 
				Parcel.find({ 
					status: 'pending',
					vehicleType: captainVehicleType 
				}).populate('userRef', 'name phone').lean() : []
		]);

		console.log(`Found ${transportOrders.length} transport orders and ${parcelOrders.length} parcel orders`);

		// Combine and process all orders
		const allOrders = [
			...transportOrders.map(order => ({ ...order, type: 'transport' })),
			...parcelOrders.map(order => ({ ...order, type: 'parcel' }))
		];

		console.log(`Total orders before distance filtering: ${allOrders.length}`);
		console.log('All orders:', allOrders.map(o => ({ 
			id: o._id, 
			type: o.type, 
			pickup: o.pickup?.address,
			vehicleType: o.vehicleType,
			status: o.status
		})));

		// Filter nearby orders by distance
		const nearby = allOrders
			.map((order) => {
				const pickup = order.pickup;
				const distance = haversineKm(
					latitude,
					longitude,
					pickup.lat,
					pickup.lng
				);
				return { ...order, distanceKm: distance };
			})
			.filter((order) => order.distanceKm <= range)
			.sort((a, b) => a.distanceKm - b.distanceKm); // Sort nearest first

		console.log(`Found ${nearby.length} orders within ${range}km range`);
		console.log('Nearby orders:', nearby.map(o => ({ id: o._id, type: o.type, distance: o.distanceKm, pickup: o.pickup.address })));

		return res.status(200).json({ orders: nearby });
	} catch (error) {
		console.error('Error fetching nearby orders:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route GET /agent/orders/active
 * @desc Get active trip for captain from both Parcel and Transport models
 */
router.get('/orders/active', auth, async (req, res) => {
	try {
		const captainId = req.user.id;
		
		// Check for active orders in both models
		const [activeTransport, activeParcel] = await Promise.all([
			Transport.findOne({ 
				captainRef: captainId, 
				status: { $in: ['accepted', 'in_progress'] } 
			}).populate('userRef', 'name phone'),
			
			Parcel.findOne({ 
				captainRef: captainId, 
				status: { $in: ['accepted', 'in_transit'] } 
			}).populate('userRef', 'name phone')
		]);
		
		const activeTrip = activeTransport || activeParcel;
		
		if (!activeTrip) {
			return res.status(200).json(null);
		}
		
		// Add type information
		const result = {
			...activeTrip.toObject(),
			type: activeTransport ? 'transport' : 'parcel'
		};
		
		return res.status(200).json(result);
	} catch (error) {
		console.error('Error fetching active trip:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/accept
 * @desc Accept a trip from either Parcel or Transport model
 */
router.post('/orders/:id/accept', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findById(id);
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findById(id);
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		if (trip.status !== 'pending') {
			return res.status(400).json({ message: 'Trip is no longer available' });
		}
		
		// Update trip status and assign captain
		trip.captainRef = captainId;
		if (modelType === 'transport') {
			trip.rideAccepted = true;
		} else {
			trip.accepted = true;
		}
		trip.status = 'accepted';
		await trip.save();
		
		const result = {
			...trip.toObject(),
			type: modelType
		};
		
		return res.status(200).json({ parcel: result });
	} catch (error) {
		console.error('Error accepting trip:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/reached
 * @desc Mark as reached pickup location
 */
router.post('/orders/:id/reached', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		if (trip.status !== 'accepted') {
			return res.status(400).json({ message: 'Invalid trip status' });
		}
		
		// Update status based on model type
		if (modelType === 'transport') {
			trip.status = 'in_progress';
		} else {
			trip.status = 'in_transit';
		}
		await trip.save();
		
		return res.status(200).json({ message: 'Successfully marked as reached' });
	} catch (error) {
		console.error('Error marking as reached:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/reached-destination
 * @desc Mark as reached destination
 */
router.post('/orders/:id/reached-destination', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		const validStatus = modelType === 'transport' ? 'in_progress' : 'in_transit';
		if (trip.status !== validStatus) {
			return res.status(400).json({ message: 'Invalid trip status' });
		}
		
		// Generate OTP for completion
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		if (modelType === 'transport') {
			trip.completionOtp = otp;
		} else {
			// For parcels, store OTP in the otp field
			trip.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
		}
		await trip.save();
		
		return res.status(200).json({ message: 'Reached destination', otp });
	} catch (error) {
		console.error('Error marking destination reached:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/verify-otp
 * @desc Verify pickup OTP
 */
router.post('/orders/:id/verify-otp', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const { code } = req.body;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		// For now, accept any 6-digit code (in production, verify against stored OTP)
		if (!code || code.length !== 6) {
			return res.status(400).json({ message: 'Invalid OTP format' });
		}
		
		// Update trip status to indicate OTP verified
		if (modelType === 'transport') {
			trip.pickupOtpVerified = true;
		} else {
			trip.pickupOtpVerified = true;
		}
		await trip.save();
		
		return res.status(200).json({ message: 'OTP verified successfully' });
	} catch (error) {
		console.error('Error verifying OTP:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/reject
 * @desc Reject a trip
 */
router.post('/orders/:id/reject', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		if (trip.status !== 'pending') {
			return res.status(400).json({ message: 'Trip cannot be rejected' });
		}
		
		// Remove captain assignment and add rejection reason
		trip.captainRef = null;
		trip.rejectionReason = reason;
		await trip.save();
		
		return res.status(200).json({ message: 'Trip rejected successfully' });
	} catch (error) {
		console.error('Error rejecting trip:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/start
 * @desc Start a trip
 */
router.post('/orders/:id/start', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		if (trip.status !== 'accepted') {
			return res.status(400).json({ message: 'Invalid trip status' });
		}
		
		// Update status based on model type
		if (modelType === 'transport') {
			trip.status = 'in_progress';
		} else {
			trip.status = 'in_transit';
		}
		trip.startedAt = new Date();
		await trip.save();
		
		const result = {
			...trip.toObject(),
			type: modelType
		};
		
		return res.status(200).json(result);
	} catch (error) {
		console.error('Error starting trip:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/complete
 * @desc Complete a trip
 */
router.post('/orders/:id/complete', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const { code } = req.body;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		const validStatus = modelType === 'transport' ? 'in_progress' : 'in_transit';
		if (trip.status !== validStatus) {
			return res.status(400).json({ message: 'Invalid trip status' });
		}
		
		// Verify completion OTP
		let isValidOtp = true;
		if (modelType === 'transport') {
			isValidOtp = !trip.completionOtp || trip.completionOtp === code;
		} else {
			isValidOtp = !trip.otp?.code || trip.otp.code === code;
		}
		
		if (!isValidOtp) {
			return res.status(400).json({ message: 'Invalid completion code' });
		}
		
		// Update status based on model type
		if (modelType === 'transport') {
			trip.status = 'completed';
			trip.completedAt = new Date();
		} else {
			trip.status = 'delivered';
			trip.otp.verified = true;
		}
		await trip.save();
		
		const result = {
			...trip.toObject(),
			type: modelType
		};
		
		return res.status(200).json(result);
	} catch (error) {
		console.error('Error completing trip:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

/**
 * @route POST /agent/orders/:id/cancel
 * @desc Cancel a trip
 */
router.post('/orders/:id/cancel', auth, async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const captainId = req.user.id;
		
		// Try to find in both models
		let trip = await Transport.findOne({ _id: id, captainRef: captainId });
		let modelType = 'transport';
		
		if (!trip) {
			trip = await Parcel.findOne({ _id: id, captainRef: captainId });
			modelType = 'parcel';
		}
		
		if (!trip) {
			return res.status(404).json({ message: 'Trip not found' });
		}
		
		const completedStatus = modelType === 'transport' ? 'completed' : 'delivered';
		if (trip.status === completedStatus) {
			return res.status(400).json({ message: 'Cannot cancel completed trip' });
		}
		
		trip.status = 'cancelled';
		if (modelType === 'transport') {
			trip.cancellationReason = reason;
			trip.cancelledAt = new Date();
		}
		await trip.save();
		
		return res.status(200).json({ message: 'Trip cancelled successfully' });
	} catch (error) {
		console.error('Error cancelling trip:', error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
});

module.exports = router;
