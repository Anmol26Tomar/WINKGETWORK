import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { bookCab } from '../services/api';

const CABS = ['Hatchback', 'Sedan', 'SUV'];

export default function CabBookingScreen() {
	const router = useRouter();
	const [type, setType] = useState(CABS[0]);
	const [pickup, setPickup] = useState('');
	const [drop, setDrop] = useState('');
	const [loading, setLoading] = useState(false);

	const fare = useMemo(() => {
		const base = type === 'Hatchback' ? 8 : type === 'Sedan' ? 10 : 12; // per km mock
		const distance = Math.max(3, (pickup.length + drop.length) % 15); // mock distance
		return Math.round(base * distance * 10) / 10;
	}, [type, pickup, drop]);

	const onSubmit = async () => {
		if (!pickup || !drop) {
			Alert.alert('Missing fields', 'Please enter pickup and drop.');
			return;
		}
		setLoading(true);
		try {
			await bookCab({ type, pickup, drop, fare });
			router.replace({ pathname: 'success', params: { message: `Cab booked (${type}). Est. fare ₹${fare}` } });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>Cab Booking</Text>
				<View style={styles.pickerWrap}>
					{CABS.map((t) => (
						<TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.tag, type === t ? styles.tagActive : null]}>
							<Text style={[styles.tagTxt, type === t ? styles.tagTxtActive : null]}>{t}</Text>
						</TouchableOpacity>
					))}
				</View>
				<TextInput style={styles.input} placeholder="Pickup Location" value={pickup} onChangeText={setPickup} />
				<TextInput style={styles.input} placeholder="Drop Location" value={drop} onChangeText={setDrop} />
				<Text style={styles.meta}>Estimated fare: ₹{fare}</Text>
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
	pickerWrap: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
	tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
	tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
	tagTxt: { color: Colors.text },
	tagTxtActive: { color: '#fff' },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
	meta: { color: Colors.mutedText, marginBottom: Spacing.lg },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


