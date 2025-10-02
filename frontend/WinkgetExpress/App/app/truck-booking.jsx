import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { bookTruck } from '../services/api';

const TRUCKS = ['Mini Truck', 'Pickup Van', 'Medium Truck', 'Large Truck'];

export default function TruckBookingScreen() {
	const router = useRouter();
	const [type, setType] = useState(TRUCKS[0]);
	const [pickup, setPickup] = useState('');
	const [drop, setDrop] = useState('');
	const [loading, setLoading] = useState(false);

	const onSubmit = async () => {
		if (!pickup || !drop || !type) {
			Alert.alert('Missing fields', 'Please fill all required fields.');
			return;
		}
		setLoading(true);
		try {
			await bookTruck({ type, pickup, drop });
			router.replace({ pathname: 'success', params: { message: 'Truck booking sent to captain app.' } });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>Truck Booking</Text>
				<View style={styles.pickerWrap}>
					{TRUCKS.map((t) => (
						<TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.tag, type === t ? styles.tagActive : null]}>
							<Text style={[styles.tagTxt, type === t ? styles.tagTxtActive : null]}>{t}</Text>
						</TouchableOpacity>
					))}
				</View>
				<TextInput style={styles.input} placeholder="Pickup Location" value={pickup} onChangeText={setPickup} />
				<TextInput style={styles.input} placeholder="Drop Location" value={drop} onChangeText={setDrop} />
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
	pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
	tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, marginRight: 6, marginBottom: 6 },
	tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
	tagTxt: { color: Colors.text },
	tagTxtActive: { color: '#fff' },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


