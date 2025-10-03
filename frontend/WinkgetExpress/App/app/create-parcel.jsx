import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { estimateFare, createParcel } from '../services/parcelService';
import { haversineKm, estimateFareKm } from '../utils/fareCalculator';
import { useRouter } from 'expo-router';

export default function CreateParcelScreen() {
	const router = useRouter();
	const [pickup, setPickup] = useState(null); // { lat, lng, address }
	const [delivery, setDelivery] = useState(null);
	const [pkg, setPkg] = useState({ name: '', size: '', weight: '', description: '', value: '' });
	const [receiverName, setReceiverName] = useState('');
	const [receiverContact, setReceiverContact] = useState('');
	const [vehicleType, setVehicleType] = useState('bike');
	const [fare, setFare] = useState(null);
	const [loading, setLoading] = useState(false);

	const region = useMemo(() => ({ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.08, longitudeDelta: 0.08 }), []);

	const onEstimate = async () => {
		try {
			if (!pickup || !delivery) return;
			const payload = { pickup, delivery, vehicleType };
			const res = await estimateFare(payload);
			setFare(res.fare);
		} catch (e) {
			// fallback local estimate
			const km = haversineKm(pickup, delivery);
			setFare(estimateFareKm(km, vehicleType));
		}
	};

	const setPlace = (type, details) => {
		const geometry = details?.geometry?.location;
		const address = details?.formatted_address || details?.description || '';
		if (geometry) {
			const point = { lat: geometry.lat, lng: geometry.lng, address };
			type === 'pickup' ? setPickup(point) : setDelivery(point);
		}
	};

	const onMapPress = (type, e) => {
		const { latitude, longitude } = e.nativeEvent.coordinate;
		const point = { lat: latitude, lng: longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` };
		type === 'pickup' ? setPickup(point) : setDelivery(point);
	};

	const onSubmit = async () => {
		if (!pickup || !delivery || !pkg.name || !pkg.size || !pkg.weight || !receiverName || !receiverContact) {
			Alert.alert('Missing fields', 'Please fill all required fields');
			return;
		}
		setLoading(true);
		try {
			const payload = {
				pickup,
				delivery,
				package: { name: pkg.name, size: pkg.size, weight: parseFloat(pkg.weight), description: pkg.description, value: parseFloat(pkg.value || '0') },
				receiverName,
				receiverContact,
				vehicleType,
				fareEstimate: fare ?? 0,
			};
			const created = await createParcel(payload);
			Alert.alert('Parcel created', `ID: ${created._id}`);
			router.push({ pathname: 'success', params: { message: 'Parcel created and forwarded to captains.' } });
		} catch (e) {
			Alert.alert('Failed', e.message || 'Please try again');
		} finally { setLoading(false); }
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>Create Parcel</Text>
				<Text style={styles.meta}>Select pickup and delivery on map or search by address.</Text>

				<Text style={styles.label}>Pickup</Text>
				<GooglePlacesAutocomplete
					placeholder="Search pickup address"
					onPress={(data, details) => setPlace('pickup', details)}
					fetchDetails
					query={{ key: 'YOUR_GOOGLE_API_KEY', language: 'en' }}
					styles={{ textInput: styles.input }}
				/>
				<MapView style={styles.map} initialRegion={region} onPress={(e) => onMapPress('pickup', e)}>
					{pickup ? <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" /> : null}
				</MapView>

				<Text style={styles.label}>Delivery</Text>
				<GooglePlacesAutocomplete
					placeholder="Search delivery address"
					onPress={(data, details) => setPlace('delivery', details)}
					fetchDetails
					query={{ key: 'YOUR_GOOGLE_API_KEY', language: 'en' }}
					styles={{ textInput: styles.input }}
				/>
				<MapView style={styles.map} initialRegion={region} onPress={(e) => onMapPress('delivery', e)}>
					{delivery ? <Marker coordinate={{ latitude: delivery.lat, longitude: delivery.lng }} title="Delivery" /> : null}
				</MapView>

				<Text style={styles.section}>Package</Text>
				<TextInput style={styles.input} placeholder="Name" value={pkg.name} onChangeText={(t) => setPkg((s) => ({ ...s, name: t }))} />
				<TextInput style={styles.input} placeholder="Size (e.g., small/medium/large)" value={pkg.size} onChangeText={(t) => setPkg((s) => ({ ...s, size: t }))} />
				<TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={pkg.weight} onChangeText={(t) => setPkg((s) => ({ ...s, weight: t }))} />
				<TextInput style={[styles.input, styles.multiline]} placeholder="Description" value={pkg.description} onChangeText={(t) => setPkg((s) => ({ ...s, description: t }))} multiline />
				<TextInput style={styles.input} placeholder="Declared Value (₹)" keyboardType="numeric" value={pkg.value} onChangeText={(t) => setPkg((s) => ({ ...s, value: t }))} />

				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={styles.meta}>Vehicle: {vehicleType}</Text>
					<TouchableOpacity style={styles.estimateBtn} onPress={onEstimate}>
						<Text style={styles.estimateTxt}>Estimate Fare</Text>
					</TouchableOpacity>
				</View>
				{fare != null ? <Text style={styles.fare}>Estimated Fare: ₹{fare}</Text> : null}

				<TouchableOpacity style={styles.btn} onPress={onSubmit}>
					<Text style={styles.btnTxt}>Create Parcel</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.xl },
	title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
	meta: { color: Colors.mutedText, marginBottom: Spacing.md },
	section: { marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: '800', color: Colors.text },
	label: { marginTop: Spacing.md, marginBottom: Spacing.xs, color: Colors.text, fontWeight: '700' },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
	multiline: { height: 80, textAlignVertical: 'top' },
	map: { height: 200, borderRadius: Radius.md, marginBottom: Spacing.md },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.md },
	btnTxt: { color: '#fff', fontWeight: '700' },
	estimateBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
	estimateTxt: { color: Colors.text, fontWeight: '700' },
	fare: { marginTop: 8, fontWeight: '800', color: Colors.text },
});


