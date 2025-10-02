import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { bookBikeRide } from '../services/api';

export default function BikeRideScreen() {
	const router = useRouter();
	const [pickup, setPickup] = useState('');
	const [drop, setDrop] = useState('');
	const [loading, setLoading] = useState(false);

	const estimation = useMemo(() => {
		const distance = Math.max(2, (pickup.length + drop.length) % 10);
		const time = distance * 6; // minutes
		const fare = distance * 12; // ₹ per km
		return { time, fare };
	}, [pickup, drop]);

	const onSubmit = async () => {
		if (!pickup || !drop) {
			Alert.alert('Missing fields', 'Please enter pickup and drop.');
			return;
		}
		setLoading(true);
		try {
			await bookBikeRide({ pickup, drop, ...estimation });
			router.replace({ pathname: 'success', params: { message: `Bike ride requested. ETA ${estimation.time} min, fare ₹${estimation.fare}` } });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>Bike Ride</Text>
				<TextInput style={styles.input} placeholder="Pickup Location" value={pickup} onChangeText={setPickup} />
				<TextInput style={styles.input} placeholder="Drop Location" value={drop} onChangeText={setDrop} />
				<Text style={styles.meta}>Estimated time: {estimation.time} min</Text>
				<Text style={styles.meta}>Estimated fare: ₹{estimation.fare}</Text>
				<TouchableOpacity style={styles.btn} onPress={onSubmit}>
					<Text style={styles.btnTxt}>Submit</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.xl },
	title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
	meta: { color: Colors.mutedText, marginBottom: Spacing.sm },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


