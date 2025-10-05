import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { estimateTransport, createTransport } from '../services/transportService';

export default function BikeRideScreen() {
	const router = useRouter();
	const mapRef = useRef(null);
	const [loading, setLoading] = useState(false);
	const [pickup, setPickup] = useState(null);
	const [destination, setDestination] = useState(null);
	const [pickupSearch, setPickupSearch] = useState('');
	const [destSearch, setDestSearch] = useState('');
	const [searchResults, setSearchResults] = useState({ pickup: [], destination: [] });
	const [showResults, setShowResults] = useState({ pickup: false, destination: false });
	const searchTimeoutRef = useRef(null);
	const [distanceKm, setDistanceKm] = useState(0);
	const [fare, setFare] = useState(0);

	const mapTilerKey = process.env.EXPO_PUBLIC_MAPTILER_KEY;
	const tileUrl = mapTilerKey
		? `https://api.maptiler.com/maps/streets/512/{z}/{x}/{y}.png?key=${mapTilerKey}`
		: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

	useEffect(() => {
		(async () => {
			try {
				if (!Location.requestForegroundPermissionsAsync) return;
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') return;
				const loc = await Location.getCurrentPositionAsync({});
				const { latitude, longitude } = loc.coords;
				const addr = await getAddressFromCoords(latitude, longitude);
				const point = { lat: latitude, lng: longitude, address: addr };
				setPickup(point);
				setPickupSearch(addr);
				setTimeout(() => mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600), 300);
			} catch {}
		})();
	}, []);

	useEffect(() => {
		const run = async () => {
			if (!pickup || !destination) return;
			try {
				setLoading(true);
				const res = await estimateTransport({ pickup, destination, vehicleType: 'bike' });
				setDistanceKm(res.distanceKm);
				setFare(res.fare);
			} catch {
				const km = haversineKmLocal(pickup, destination);
				setDistanceKm(km);
				setFare(estimateFareKmLocal(km, 'bike'));
			} finally { setLoading(false); }
		};
		run();
	}, [pickup, destination]);

	const handleSearchChange = handleSearchChangeFactory({ setPickupSearch, setDestSearch, searchTimeoutRef, setSearchResults, setShowResults });
	const handleAddressSelect = handleAddressSelectFactory({ setPickup, setDestination, setPickupSearch, setDestSearch, setShowResults, mapRef });
	const handleAddressSubmit = handleAddressSubmitFactory({ setPickup, setDestination, setPickupSearch, setDestSearch, mapRef });
	const onMapPress = handleMapPressFactory({ pickup, setPickup, setPickupSearch, setDestination, setDestSearch });

	const onSubmit = async () => {
		if (!pickup || !destination) { Alert.alert('Missing fields', 'Please select pickup and destination'); return; }
		try {
			setLoading(true);
			await createTransport({ pickup, destination, vehicleType: 'bike' });
			Alert.alert('Booked', `Your bike is on the way. Est. fare ₹${fare}`);
			router.replace('/history');
		} catch (e) {
			Alert.alert('Failed', e.message || 'Could not create booking');
		} finally { setLoading(false); }
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<BackButton />
				<Text style={styles.title}>Bike Ride</Text>

				<Text style={styles.label}>Pickup</Text>
				<View style={styles.searchContainer}>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder="Search pickup address"
						value={pickupSearch}
						onChangeText={(t) => handleSearchChange(t, 'pickup')}
						onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'pickup')}
						onFocus={() => setShowResults((s) => ({ ...s, pickup: true }))}
						onBlur={() => setTimeout(() => setShowResults((s) => ({ ...s, pickup: false })), 200)}
					/>
					{showResults.pickup && searchResults.pickup.length > 0 && (
						<View style={styles.searchResults}>
							{searchResults.pickup.map((r, i) => (
								<TouchableOpacity key={`p-${i}`} style={styles.searchResultItem} onPress={() => handleAddressSelect(r, 'pickup')}>
									<Text style={styles.searchResultText}>{r.address}</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				<Text style={styles.label}>Destination</Text>
				<View style={styles.searchContainer}>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder="Search destination address"
						value={destSearch}
						onChangeText={(t) => handleSearchChange(t, 'destination')}
						onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'destination')}
						onFocus={() => setShowResults((s) => ({ ...s, destination: true }))}
						onBlur={() => setTimeout(() => setShowResults((s) => ({ ...s, destination: false })), 200)}
					/>
					{showResults.destination && searchResults.destination.length > 0 && (
						<View style={styles.searchResults}>
							{searchResults.destination.map((r, i) => (
								<TouchableOpacity key={`d-${i}`} style={styles.searchResultItem} onPress={() => handleAddressSelect(r, 'destination')}>
									<Text style={styles.searchResultText}>{r.address}</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				<View style={styles.mapWrap}>
					<MapView ref={mapRef} style={styles.map} initialRegion={{ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.08, longitudeDelta: 0.08 }} onPress={(e) => onMapPress(e)}>
						<UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
						{pickup && (<Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={Colors.primary} title="Pickup" />)}
						{destination && (<Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} pinColor={Colors.accent} title="Destination" />)}
						{pickup && destination && (
							<Polyline coordinates={[{ latitude: pickup.lat, longitude: pickup.lng }, { latitude: destination.lat, longitude: destination.lng }]} strokeColor={Colors.primary} strokeWidth={3} />
						)}
					</MapView>
				</View>

				<View style={styles.quote}>
					<Text style={styles.quoteLine}>Estimated Distance: {distanceKm ? `${distanceKm.toFixed(2)} km` : '--'}</Text>
					<Text style={styles.quoteLine}>Estimated Fare: ₹{fare ? fare.toFixed(2) : '--'}</Text>
				</View>

				<TouchableOpacity style={styles.btn} onPress={onSubmit}>
					<Text style={styles.btnTxt}>Confirm Booking</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

function haversineKmLocal(a, b) {
	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

function estimateFareKmLocal(km, type) {
	const base = type === 'cab' ? 30 : 20;
	const perKm = type === 'cab' ? 12 : 8;
	return Math.round((base + km * perKm) * 100) / 100;
}

const getAddressFromCoords = async (lat, lng) => {
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
		const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'WinkgetExpress/1.0' } });
		const data = await res.json();
		if (data.address) {
			const a = data.address; const parts = [];
			if (a.house_number) parts.push(a.house_number);
			if (a.road) parts.push(a.road);
			if (a.suburb) parts.push(a.suburb);
			if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
			if (a.state) parts.push(a.state);
			if (a.postcode) parts.push(a.postcode);
			if (parts.length) return parts.join(', ');
		}
		return data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
	} catch { return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
};

const debounced = (fn, ref, delay = 500) => (arg1, arg2) => {
	if (ref.current) clearTimeout(ref.current);
	ref.current = setTimeout(() => fn(arg1, arg2), delay);
};

async function searchPlaces(query) {
	const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`;
	const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'WinkgetExpress/1.0' } });
	const contentType = res.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) return [];
	const list = await res.json();
	if (!Array.isArray(list)) return [];
	return list.map((item) => {
		let displayAddress = item.display_name;
		if (item.address) {
			const a = item.address; const parts = [];
			if (a.house_number) parts.push(a.house_number);
			if (a.road) parts.push(a.road);
			if (a.suburb) parts.push(a.suburb);
			if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
			if (a.state) parts.push(a.state);
			if (a.postcode) parts.push(a.postcode);
			if (parts.length) displayAddress = parts.join(', ');
		}
		return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: displayAddress };
	});
}

const runSearch = async (query, type, setSearchResults, setShowResults) => {
	if (!query || query.length < 3) {
		setSearchResults((prev) => ({ ...prev, [type]: [] }));
		setShowResults((prev) => ({ ...prev, [type]: false }));
		return;
	}
	try {
		const results = await searchPlaces(query);
		setSearchResults((prev) => ({ ...prev, [type]: results }));
		setShowResults((prev) => ({ ...prev, [type]: results.length > 0 }));
	} catch {
		setSearchResults((prev) => ({ ...prev, [type]: [] }));
		setShowResults((prev) => ({ ...prev, [type]: false }));
	}
};

function handleSearchChangeFactory(params) {
	const { setPickupSearch, setDestSearch, searchTimeoutRef, setSearchResults, setShowResults } = params;
	const debouncedRun = debounced((q, type) => runSearch(q, type, setSearchResults, setShowResults), searchTimeoutRef, 500);
	return (text, type) => {
		if (type === 'pickup') setPickupSearch(text); else setDestSearch(text);
		debouncedRun(text, type);
	};
}

function handleAddressSelectFactory(params) {
	const { setPickup, setDestination, setPickupSearch, setDestSearch, setShowResults, mapRef } = params;
	return (address, type) => {
		const point = { lat: address.lat, lng: address.lng, address: address.address };
		if (type === 'pickup') {
			setPickup(point);
			setPickupSearch(address.address);
			setShowResults((prev) => ({ ...prev, pickup: false }));
		} else {
			setDestination(point);
			setDestSearch(address.address);
			setShowResults((prev) => ({ ...prev, destination: false }));
		}
		setTimeout(() => {
			mapRef.current?.animateToRegion({ latitude: point.lat, longitude: point.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
		}, 100);
	};
}

function handleAddressSubmitFactory(params) {
	const { setPickup, setDestination, setPickupSearch, setDestSearch, mapRef } = params;
	return async (text, type) => {
		if (!text || text.length < 3) return;
		const results = await searchPlaces(text);
		if (!results.length) return;
		const top = results[0];
		const point = { lat: top.lat, lng: top.lng, address: top.address };
		if (type === 'pickup') { setPickup(point); setPickupSearch(top.address); }
		else { setDestination(point); setDestSearch(top.address); }
		mapRef.current?.animateToRegion({ latitude: point.lat, longitude: point.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
	};
}

function handleMapPressFactory(params) {
	const { pickup, setPickup, setPickupSearch, setDestination, setDestSearch } = params;
	return async (e) => {
		const { latitude, longitude } = e.nativeEvent.coordinate;
		const address = await getAddressFromCoords(latitude, longitude);
		const point = { lat: latitude, lng: longitude, address };
		if (!pickup) { setPickup(point); setPickupSearch(address); }
		else { setDestination(point); setDestSearch(address); }
	};
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.xl },
	title: { fontSize: 22, fontWeight: '800', color: Colors.text },
	label: { fontWeight: '700', color: Colors.text, marginBottom: 6 },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
	mapWrap: { height: 220, borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
	map: { flex: 1 },
	searchContainer: { position: 'relative' },
	searchResults: { position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, zIndex: 10 },
	searchResultItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
	searchResultText: { color: Colors.text },
	quote: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
	quoteLine: { fontWeight: '700', color: Colors.text },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
	btnTxt: { color: '#fff', fontWeight: '700' },
});
