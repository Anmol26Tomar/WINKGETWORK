const { getIO } = require('./socket');

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

module.exports = { notifyCaptainsNewParcel, notifyCaptainsNewTransport };


