const Transport = require('../models/Transport');
const { getIO } = require('../utils/socket');

function haversineKm(a, b) {
	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

function estimateFareKm(distanceKm, vehicleType = 'bike') {
	const base = vehicleType === 'cab' ? 30 : 20;
	const perKm = vehicleType === 'cab' ? 12 : 8;
	return Math.round((base + distanceKm * perKm) * 100) / 100;
}

async function create(req, res) {
	try {
		const { pickup, destination, vehicleType } = req.body;
		if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng || !vehicleType) {
			return res.status(400).json({ message: 'Missing fields' });
		}
		const distanceKm = haversineKm(pickup, destination);
		const fareEstimate = estimateFareKm(distanceKm, vehicleType);
    const doc = await Transport.create({
			userRef: req.user.id,
			pickup,
			destination,
			vehicleType,
			fareEstimate,
			distanceKm,
			rideAccepted: false,
			status: 'pending',
		});
		const io = getIO();
		io?.to(`user:${req.user.id}`).emit('ride-created', { ride: doc });
		return res.status(201).json(doc);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function listByUser(req, res) {
	try {
		const { userId } = req.params;
		if (userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
		const items = await Transport.find({ userRef: userId }).sort({ createdAt: -1 }).limit(100);
		return res.json({ transports: items });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function estimate(req, res) {
	try {
		const { pickup, destination, vehicleType } = req.body;
		if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
			return res.status(400).json({ message: 'Missing coordinates' });
		}
		const distanceKm = haversineKm(pickup, destination);
		const fare = estimateFareKm(distanceKm, vehicleType);
		return res.json({ distanceKm, fare });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function getById(req, res) {
	try {
		const { id } = req.params;
		const doc = await Transport.findById(id);
		if (!doc) return res.status(404).json({ message: 'Not found' });
		if (String(doc.userRef) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
		return res.json(doc);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function updateStatus(req, res) {
	try {
		const { id } = req.params;
		const { status, captainRef } = req.body;
		const doc = await Transport.findById(id);
		if (!doc) return res.status(404).json({ message: 'Not found' });
		if (String(doc.userRef) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
		if (typeof captainRef !== 'undefined') doc.captainRef = captainRef;
		if (status) {
			doc.status = status;
			doc.rideAccepted = status === 'accepted' || status === 'in_progress' || status === 'completed';
		}
		await doc.save();
		const io = getIO();
		io?.to(`ride:${id}`).emit('ride-updated', { ride: doc });
		if (doc.rideAccepted) io?.to(`ride:${id}`).emit('ride-accepted', { ride: doc });
		return res.json(doc);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function cancelRide(req, res) {
	try {
		const { id } = req.params;
		const doc = await Transport.findById(id);
		if (!doc) return res.status(404).json({ message: 'Not found' });
		if (String(doc.userRef) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
		await Transport.deleteOne({ _id: id });
		const io = getIO();
		io?.to(`ride:${id}`).emit('ride-cancelled', { rideId: id });
		return res.json({ success: true });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { create, listByUser, estimate, getById, updateStatus, cancelRide };


