const { getIO } = require('./socket');
const { Captain } = require('../captain/models/Captain.model');

function notifyCaptainsNewParcel(parcelId, meta) {
	console.log('[notify] New parcel available:', parcelId, meta);
	
	// Broadcast to available captains
	const io = getIO();
	if (io) {
		io.to('available-captains').emit('new-trip', {
			id: parcelId,
			...meta,
			type: 'parcel'
		});
		console.log('[socket] Broadcasted new parcel to available captains');
	}
}

function notifyCaptainsNewTransport(transportId, meta) {
	console.log('[notify] New transport available:', transportId, meta);
	console.log('[notify] Transport vehicle type:', meta.vehicleType);
	
	// Broadcast to available captains
	const io = getIO();
	if (io) {
		const tripData = {
			id: transportId,
			...meta,
			type: 'transport'
		};
		
		console.log('[socket] Broadcasting to available-captains room:', tripData);
		io.to('available-captains').emit('new-trip', tripData);
		
		// Also broadcast to specific vehicle type room
		console.log('[socket] Broadcasting to vehicle type room:', `vehicle:${meta.vehicleType}`);
		io.to(`vehicle:${meta.vehicleType}`).emit('new-trip', tripData);
		
		console.log('[socket] Broadcasted new transport to available captains');
	} else {
		console.error('[socket] IO not available for broadcasting');
	}
}

/**
 * Find and assign nearby captains for instant matching
 * @param {Object} requestData - Request details
 * @param {string} requestData.serviceType - Service type
 * @param {Object} requestData.pickup - Pickup location
 * @param {string} requestData.vehicleType - Vehicle type
 * @param {number} requestData.fareEstimate - Estimated fare
 */
async function findAndAssignNearbyCaptains(requestData) {
	try {
		const { serviceType, pickup, vehicleType, fareEstimate } = requestData;
		
		console.log('[CaptainMatching] Finding nearby captains for:', {
			serviceType,
			vehicleType,
			pickup: pickup.address
		});

		// Build query for captain matching
		const query = {
			isActive: true,
			vehicleType: vehicleType.toLowerCase(), // Ensure lowercase matching
			servicesOffered: { $in: [serviceType] },
			location: {
				$near: {
					$geometry: {
						type: 'Point',
						coordinates: [pickup.lng, pickup.lat]
					},
					$maxDistance: 2000 // 2km in meters
				}
			}
		};

		// Add vehicle subtype filter if provided
		if (requestData.vehicleSubType) {
			query.vehicleSubType = requestData.vehicleSubType.toLowerCase();
		}

		console.log('[CaptainMatching] Query for captains:', query);

		// Find active captains within 2km radius
		const nearbyCaptains = await Captain.find(query)
			.sort({ totalTrips: 1, rating: -1 })
			.limit(5);

		console.log(`[CaptainMatching] Found ${nearbyCaptains.length} nearby captains`);

		if (nearbyCaptains.length === 0) {
			// No captains available
			const io = getIO();
			if (io) {
				io.to('user').emit('captain:not-found', {
					serviceType,
					vehicleType,
					message: 'No captains available in your area'
				});
			}
			return null;
		}

		// Assign to the best captain (first in sorted list)
		const assignedCaptain = nearbyCaptains[0];
		
		console.log(`[CaptainMatching] Assigning to captain: ${assignedCaptain.name} (${assignedCaptain.phone})`);

		// Notify the assigned captain
		const io = getIO();
		if (io) {
			io.to(`captain_${assignedCaptain._id}`).emit('trip:assigned', {
				...requestData,
				assignedAt: new Date(),
				priority: 'high'
			});

			// Notify user that captain has been assigned
			io.to('user').emit('captain:assigned', {
				captain: {
					id: assignedCaptain._id,
					name: assignedCaptain.name,
					phone: assignedCaptain.phone,
					vehicleType: assignedCaptain.vehicleType,
					vehicleSubType: assignedCaptain.vehicleSubType,
					rating: assignedCaptain.rating,
					location: assignedCaptain.location
				},
				serviceType,
				vehicleType,
				estimatedArrival: '2-5 minutes'
			});
		}

		return assignedCaptain;
	} catch (error) {
		console.error('[CaptainMatching] Error finding captains:', error);
		return null;
	}
}

/**
 * Handle captain acceptance of trip
 * @param {string} captainId - Captain ID
 * @param {Object} tripData - Trip details
 */
async function handleCaptainAcceptance(captainId, tripData) {
	try {
		const captain = await Captain.findById(captainId);
		if (!captain) {
			throw new Error('Captain not found');
		}

		// Update captain's trip count
		await Captain.findByIdAndUpdate(captainId, {
			$inc: { totalTrips: 1 }
		});

		// Notify user that captain accepted
		const io = getIO();
		if (io) {
			io.to('user').emit('captain:accepted', {
				captain: {
					id: captain._id,
					name: captain.name,
					phone: captain.phone,
					vehicleType: captain.vehicleType,
					vehicleSubType: captain.vehicleSubType,
					rating: captain.rating
				},
				trip: tripData,
				acceptedAt: new Date()
			});
		}

		console.log(`[CaptainMatching] Captain ${captain.name} accepted trip`);
	} catch (error) {
		console.error('[CaptainMatching] Error handling captain acceptance:', error);
	}
}

module.exports = { 
	notifyCaptainsNewParcel, 
	notifyCaptainsNewTransport,
	findAndAssignNearbyCaptains,
	handleCaptainAcceptance
};


