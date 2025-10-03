export function haversineKm(a, b) {
	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

export function estimateFareKm(distanceKm, vehicleType = 'bike') {
	const base = vehicleType === 'truck' ? 50 : vehicleType === 'cab' ? 30 : 20;
	const perKm = vehicleType === 'truck' ? 20 : vehicleType === 'cab' ? 12 : 8;
	return Math.round((base + distanceKm * perKm) * 100) / 100;
}


