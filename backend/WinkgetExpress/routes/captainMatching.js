const express = require('express');
const router = express.Router();
const { findAndAssignNearbyCaptains, handleCaptainAcceptance } = require('../utils/notificationService');
const auth = require('../middleware/authMiddleware');

/**
 * @route POST /api/captain-matching/request
 * @desc Request captain matching for instant assignment
 * @access Private
 */
router.post('/request', auth, async (req, res) => {
	try {
		const {
			serviceType,
			pickup,
			delivery,
			vehicleType,
			vehicleSubType,
			fareEstimate,
			package: pkg,
			receiver,
			selectedItems
		} = req.body;

		// Validate required fields
		if (!serviceType || !pickup || !delivery || !vehicleType) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields'
			});
		}

		// Validate service type mapping
		const validServiceTypes = [
			'local_parcel',
			'bike_ride',
			'cab_booking',
			'intra_truck',
			'all_india_parcel',
			'packers_movers'
		];

		if (!validServiceTypes.includes(serviceType)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid service type'
			});
		}

		// Validate vehicle type mapping (case insensitive)
		const validVehicleTypes = ['bike', 'cab', 'truck'];
		const normalizedVehicleType = vehicleType.toLowerCase();
		if (!validVehicleTypes.includes(normalizedVehicleType)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid vehicle type'
			});
		}

		console.log('[CaptainMatching] Request received:', {
			serviceType,
			vehicleType,
			vehicleSubType,
			pickup: pickup.address
		});

		// Find and assign nearby captains
		const assignedCaptain = await findAndAssignNearbyCaptains({
			serviceType,
			pickup,
			delivery,
			vehicleType: normalizedVehicleType,
			vehicleSubType: vehicleSubType ? vehicleSubType.toLowerCase() : undefined,
			fareEstimate,
			package: pkg,
			receiver,
			selectedItems,
			userId: req.user.id,
			requestedAt: new Date()
		});

		if (assignedCaptain) {
			return res.status(200).json({
				success: true,
				message: 'Captain assigned successfully',
				captain: {
					id: assignedCaptain._id,
					name: assignedCaptain.name,
					phone: assignedCaptain.phone,
					vehicleType: assignedCaptain.vehicleType,
					vehicleSubType: assignedCaptain.vehicleSubType,
					rating: assignedCaptain.rating
				},
				estimatedArrival: '2-5 minutes'
			});
		} else {
			return res.status(200).json({
				success: false,
				message: 'No captains available in your area',
				code: 'NO_CAPTAINS_AVAILABLE'
			});
		}
	} catch (error) {
		console.error('[CaptainMatching] Request error:', error);
		return res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

/**
 * @route POST /api/captain-matching/accept
 * @desc Handle captain acceptance of trip
 * @access Private
 */
router.post('/accept', auth, async (req, res) => {
	try {
		const { captainId, tripData } = req.body;

		if (!captainId || !tripData) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields'
			});
		}

		await handleCaptainAcceptance(captainId, tripData);

		return res.status(200).json({
			success: true,
			message: 'Captain acceptance processed'
		});
	} catch (error) {
		console.error('[CaptainMatching] Accept error:', error);
		return res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

/**
 * @route GET /api/captain-matching/status/:requestId
 * @desc Get status of captain matching request
 * @access Private
 */
router.get('/status/:requestId', auth, async (req, res) => {
	try {
		const { requestId } = req.params;

		// This would typically check a database for request status
		// For now, return a placeholder response
		return res.status(200).json({
			success: true,
			requestId,
			status: 'searching',
			message: 'Searching for nearby captains...'
		});
	} catch (error) {
		console.error('[CaptainMatching] Status error:', error);
		return res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
});

module.exports = router;
