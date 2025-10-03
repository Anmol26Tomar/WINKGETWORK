const Parcel = require('../models/Parcel');

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
	const base = vehicleType === 'truck' ? 50 : vehicleType === 'cab' ? 30 : 20;
	const perKm = vehicleType === 'truck' ? 20 : vehicleType === 'cab' ? 12 : 8;
	return Math.round((base + distanceKm * perKm) * 100) / 100;
}

function generateOtp() {
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
	return { code, expiresAt, verified: false, attempts: 0 };
}

async function estimate(req, res) {
	try {
		const { pickup, delivery, vehicleType = 'bike' } = req.body;
		if (!pickup?.lat || !pickup?.lng || !delivery?.lat || !delivery?.lng) return res.status(400).json({ message: 'Missing coordinates' });
		const km = haversineKm(pickup, delivery);
		const fare = estimateFareKm(km, vehicleType);
		return res.json({ distanceKm: km, fare });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function createParcel(req, res) {
	try {
		const { pickup, delivery, package: pkg, receiverName, receiverContact, vehicleType = 'bike', fareEstimate } = req.body;
		if (!pickup || !delivery || !pkg || !receiverName || !receiverContact || fareEstimate == null) return res.status(400).json({ message: 'Missing fields' });
		const otp = generateOtp();
		const doc = await Parcel.create({
			userRef: req.user.id,
			pickup,
			delivery,
			package: pkg,
			receiverName,
			receiverContact,
			vehicleType,
			fareEstimate,
			accepted: false,
			status: 'pending',
			otp,
		});
		const { notifyCaptainsNewParcel } = require('../utils/notificationService');
		notifyCaptainsNewParcel(doc._id.toString(), { vehicleType, fareEstimate });
		return res.status(201).json(doc);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function getParcel(req, res) {
	try {
		const parcel = await Parcel.findById(req.params.id);
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		if (parcel.userRef.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
		return res.json(parcel);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function verifyOtp(req, res) {
	try {
		const { code } = req.body;
		const parcel = await Parcel.findById(req.params.id);
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		if (parcel.userRef.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
		if (parcel.otp.verified) return res.status(400).json({ message: 'Already verified' });
		if (!parcel.otp.code || !parcel.otp.expiresAt || new Date(parcel.otp.expiresAt) < new Date()) return res.status(400).json({ message: 'OTP expired' });
		if (parcel.otp.attempts >= 5) return res.status(429).json({ message: 'Too many attempts' });
		parcel.otp.attempts += 1;
		if (code === parcel.otp.code) {
			parcel.otp.verified = true;
			parcel.status = 'in_transit';
			await parcel.save();
			return res.json({ success: true, token: 'qr_token_placeholder' });
		}
		await parcel.save();
		return res.status(400).json({ message: 'Invalid OTP' });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function confirmPayment(req, res) {
	try {
		const parcel = await Parcel.findById(req.params.id);
		if (!parcel) return res.status(404).json({ message: 'Not found' });
		if (parcel.userRef.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
		parcel.status = 'delivered';
		await parcel.save();
		return res.json({ success: true });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { estimate, createParcel, getParcel, verifyOtp, confirmPayment };


