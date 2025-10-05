import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import BackButton from '../components/BackButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { estimateFare as estimateFareApi, createParcel } from '../services/parcelService';
import { haversineKm, estimateFareKm } from '../utils/fareCalculator';

const DEFAULT_REGION = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
};

export default function TruckBookingForm() {
    const { vehicleType = 'mini_truck' } = useLocalSearchParams();
    const router = useRouter();
	const mapRef = useRef(null);
	const [loading, setLoading] = useState(false);
	const [region, setRegion] = useState(DEFAULT_REGION);

	const [pickup, setPickup] = useState(null);
	const [delivery, setDelivery] = useState(null);

	// Search state (reference: local-parcel.jsx)
	const [pickupSearch, setPickupSearch] = useState('');
	const [deliverySearch, setDeliverySearch] = useState('');
	const [searchResults, setSearchResults] = useState({ pickup: [], delivery: [] });
	const [showResults, setShowResults] = useState({ pickup: false, delivery: false });
	const [currentLocation, setCurrentLocation] = useState(null);
	const [locationLoading, setLocationLoading] = useState(true);
	const searchTimeoutRef = useRef(null);
	const autoSearchTimeoutRef = useRef(null);
	const mapTilerKey = process.env.EXPO_PUBLIC_MAPTILER_KEY;
	const tileUrl = mapTilerKey
		? `https://api.maptiler.com/maps/streets/512/{z}/{x}/{y}.png?key=${mapTilerKey}`
		: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const [pkgType, setPkgType] = useState('Household');
    const [weight, setWeight] = useState('10');
    const [dimensions, setDimensions] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');

    const [distanceKm, setDistanceKm] = useState(0);
    const [fare, setFare] = useState(0);

	// Wire handlers based on local-parcel patterns
	const handleSearchChange = handleSearchChangeFactory({
		setPickupSearch,
		setDeliverySearch,
		searchTimeoutRef,
		setSearchResults,
		setShowResults,
	});

	const handleAddressSelect = handleAddressSelectFactory({
		setPickup,
		setDelivery,
		setPickupSearch,
		setDeliverySearch,
		setShowResults,
		mapRef,
	});

	const handleAddressSubmit = handleAddressSubmitFactory({
		setPickup,
		setDelivery,
		setPickupSearch,
		setDeliverySearch,
		mapRef,
	});

	const onMapPress = handleMapPressFactory({
		pickup,
		setPickup,
		setPickupSearch,
		setDelivery,
		setDeliverySearch,
	});

	useEffect(() => {
		(async () => {
			try {
				setLocationLoading(true);
				if (!Location.requestForegroundPermissionsAsync) { setLocationLoading(false); return; }
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') { setLocationLoading(false); return; }
				const loc = await Location.getCurrentPositionAsync({});
				const { latitude, longitude } = loc.coords;
				setRegion((r) => ({ ...r, latitude, longitude }));
				// Seed pickup with current location address
				const addr = await getAddressFromCoords(latitude, longitude);
				const point = { lat: latitude, lng: longitude, address: addr };
				setCurrentLocation(point);
				setPickup((p) => p || point);
				setPickupSearch(addr);
				setTimeout(() => {
					mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
				}, 400);
			} catch {} finally { setLocationLoading(false); }
		})();
	}, []);

    const recenterMap = () => {
        if (!mapRef.current) return;
        const points = [];
        if (pickup) points.push({ latitude: pickup.lat, longitude: pickup.lng });
        if (delivery) points.push({ latitude: delivery.lat, longitude: delivery.lng });
        if (points.length === 0) return;
        if (points.length === 1) {
            mapRef.current.animateToRegion({ ...region, ...points[0] }, 300);
        } else {
            mapRef.current.fitToCoordinates(points, { edgePadding: { top: 60, left: 60, right: 60, bottom: 60 }, animated: true });
        }
    };

    useEffect(() => {
        recenterMap();
    }, [pickup, delivery]);

	useEffect(() => {
		const run = async () => {
			if (!pickup || !delivery) return;
			try {
				setLoading(true);
				const res = await estimateFareApi({ pickup, delivery, vehicleType: mapVehicle(vehicleType) });
				setDistanceKm(res.distanceKm);
				setFare(res.fare);
			} catch (e) {
				// Fallback to local haversine if API not available
				const km = haversineKm(pickup, delivery);
				setDistanceKm(km);
				setFare(estimateFareKm(km, mapVehicle(vehicleType)));
			} finally {
				setLoading(false);
			}
		};
		run();
	}, [pickup, delivery, vehicleType]);

    const onSubmit = async () => {
        if (!pickup || !delivery || !senderName || !senderPhone || !receiverName || !receiverPhone) {
            Alert.alert('Missing fields', 'Please fill all required fields');
            return;
        }
        try {
            setLoading(true);
            const payload = {
                pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
                delivery: { lat: delivery.lat, lng: delivery.lng, address: delivery.address },
                package: { name: pkgType, size: dimensions || 'standard', weight: Number(weight) || 0, description: '' },
                receiverName,
                receiverContact: receiverPhone,
                vehicleType: mapVehicle(vehicleType),
                fareEstimate: fare,
            };
            await createParcel(payload);
            router.replace('/history');
        } catch (e) {
            Alert.alert('Booking failed', e.message || 'Could not create booking');
        } finally {
            setLoading(false);
        }
    };

	return (
        <View style={styles.container}>
			<LoadingOverlay visible={loading || locationLoading} />
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <BackButton />
                <Text style={styles.title}>Trip details</Text>
                <Text style={styles.subtitle}>Vehicle: {prettyVehicle(vehicleType)}</Text>

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

				<Text style={styles.label}>Delivery</Text>
				<View style={styles.searchContainer}>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder="Search delivery address"
						value={deliverySearch}
						onChangeText={(t) => handleSearchChange(t, 'delivery')}
						onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'delivery')}
						onFocus={() => setShowResults((s) => ({ ...s, delivery: true }))}
						onBlur={() => setTimeout(() => setShowResults((s) => ({ ...s, delivery: false })), 200)}
					/>
					{showResults.delivery && searchResults.delivery.length > 0 && (
						<View style={styles.searchResults}>
							{searchResults.delivery.map((r, i) => (
								<TouchableOpacity key={`d-${i}`} style={styles.searchResultItem} onPress={() => handleAddressSelect(r, 'delivery')}>
									<Text style={styles.searchResultText}>{r.address}</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				<View style={styles.mapWrap}>
					<MapView ref={mapRef} style={styles.map} initialRegion={region} onPress={(e) => onMapPress(e)}>
						<UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
						{pickup && (<Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={Colors.primary} title="Pickup" />)}
						{delivery && (<Marker coordinate={{ latitude: delivery.lat, longitude: delivery.lng }} pinColor={Colors.accent} title="Delivery" />)}
						{pickup && delivery && (
							<Polyline
								coordinates={[
									{ latitude: pickup.lat, longitude: pickup.lng },
									{ latitude: delivery.lat, longitude: delivery.lng },
								]}
								strokeColor={Colors.primary}
								strokeWidth={3}
							/>
						)}
					</MapView>
				</View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Package</Text>
                    <FieldRow label="Type" value={pkgType} onChange={setPkgType} />
                    <FieldRow label="Weight (kg)" value={weight} onChange={setWeight} keyboardType="numeric" />
                    <FieldRow label="Dimensions" value={dimensions} onChange={setDimensions} placeholder="Optional" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sender</Text>
                    <FieldRow label="Name" value={senderName} onChange={setSenderName} />
                    <FieldRow label="Phone" value={senderPhone} onChange={setSenderPhone} keyboardType="phone-pad" />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Receiver</Text>
                    <FieldRow label="Name" value={receiverName} onChange={setReceiverName} />
                    <FieldRow label="Phone" value={receiverPhone} onChange={setReceiverPhone} keyboardType="phone-pad" />
                </View>

				<View style={styles.quote}>
					<Text style={styles.quoteLine}>Estimated Distance: {distanceKm ? `${distanceKm.toFixed(2)} km` : '--'}</Text>
					<Text style={styles.quoteLine}>Estimated Fare: ₹{fare ? fare.toFixed(2) : '--'}</Text>
				</View>

                <TouchableOpacity style={styles.btn} onPress={onSubmit}>
                    <Text style={styles.btnTxt}>Confirm & Book</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function FieldRow({ label, value, onChange, keyboardType, placeholder }) {
    const { TextInput } = require('react-native');
    return (
        <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={styles.fieldInput}
                placeholder={placeholder}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType}
            />
        </View>
    );
}

function mapVehicle(v) {
    // Map UI keys to backend vehicleType categories
    if (v === 'auto') return 'auto';
    if (v === 'pickup_van') return 'truck';
    return 'truck';
}

function prettyVehicle(v) {
    if (v === 'auto') return 'Auto';
    if (v === 'pickup_van') return 'Pickup Van';
    if (v === 'mini_truck') return 'Mini Truck';
    return v;
}

// Reference implementations adapted from local-parcel.jsx
const getAddressFromCoords = async (lat, lng) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'WinkgetExpress/1.0' } });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        const data = await res.json();
        if (data.address) {
            const a = data.address;
            const parts = [];
            if (a.house_number) parts.push(a.house_number);
            if (a.road) parts.push(a.road);
            if (a.suburb) parts.push(a.suburb);
            if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
            if (a.state) parts.push(a.state);
            if (a.postcode) parts.push(a.postcode);
            if (parts.length) return parts.join(', ');
        }
        return data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
        return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
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

// Debounced search executor
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

// Handlers wired to component state
function handleSearchChangeFactory(params) {
    const { setPickupSearch, setDeliverySearch, searchTimeoutRef, setSearchResults, setShowResults } = params;
    const debouncedRun = debounced((q, type) => runSearch(q, type, setSearchResults, setShowResults), searchTimeoutRef, 500);
    return (text, type) => {
        if (type === 'pickup') setPickupSearch(text); else setDeliverySearch(text);
        debouncedRun(text, type);
    };
}

function handleAddressSelectFactory(params) {
    const { setPickup, setDelivery, setPickupSearch, setDeliverySearch, setShowResults, mapRef } = params;
    return (address, type) => {
        const point = { lat: address.lat, lng: address.lng, address: address.address };
        if (type === 'pickup') {
            setPickup(point);
            setPickupSearch(address.address);
            setShowResults((prev) => ({ ...prev, pickup: false }));
        } else {
            setDelivery(point);
            setDeliverySearch(address.address);
            setShowResults((prev) => ({ ...prev, delivery: false }));
        }
        // Focus map to fit both if available
        setTimeout(() => {
            const points = [];
            if (type === 'pickup') points.push({ latitude: point.lat, longitude: point.lng });
            else points.push({ latitude: point.lat, longitude: point.lng });
            mapRef.current?.animateToRegion({ latitude: point.lat, longitude: point.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
        }, 100);
    };
}

function handleAddressSubmitFactory(params) {
    const { setPickup, setDelivery, setPickupSearch, setDeliverySearch, mapRef } = params;
    return async (text, type) => {
        if (!text || text.length < 3) return;
        const results = await searchPlaces(text);
        if (!results.length) return;
        const top = results[0];
        const point = { lat: top.lat, lng: top.lng, address: top.address };
        if (type === 'pickup') {
            setPickup(point);
            setPickupSearch(top.address);
        } else {
            setDelivery(point);
            setDeliverySearch(top.address);
        }
        mapRef.current?.animateToRegion({ latitude: point.lat, longitude: point.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
    };
}

function handleMapPressFactory(params) {
    const { pickup, setPickup, setPickupSearch, setDelivery, setDeliverySearch } = params;
    return async (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        const address = await getAddressFromCoords(latitude, longitude);
        const point = { lat: latitude, lng: longitude, address };
        if (!pickup) {
            setPickup(point);
            setPickupSearch(address);
        } else {
            setDelivery(point);
            setDeliverySearch(address);
        }
    };
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text },
    subtitle: { color: Colors.mutedText, marginBottom: Spacing.md },
    label: { fontWeight: '700', color: Colors.text, marginBottom: 6 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
    mapWrap: { height: 220, borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    map: { flex: 1 },
    section: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
    sectionTitle: { fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
    fieldRow: { marginBottom: Spacing.sm },
    fieldLabel: { color: Colors.mutedText, marginBottom: 6 },
    fieldInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md },
    quote: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
    quoteLine: { fontWeight: '700', color: Colors.text },
    btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
    btnTxt: { color: '#fff', fontWeight: '700' },
});


