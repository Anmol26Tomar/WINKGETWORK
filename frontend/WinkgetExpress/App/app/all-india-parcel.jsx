import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { sendAllIndiaParcel } from '../services/api';

export default function AllIndiaParcelScreen() {
	const router = useRouter();
	const [senderName, setSenderName] = useState('');
	const [receiverName, setReceiverName] = useState('');
	const [pickup, setPickup] = useState('');
	const [drop, setDrop] = useState('');
	const [weight, setWeight] = useState('');
	const [type, setType] = useState('Documents');
	const [loading, setLoading] = useState(false);

	const eta = useMemo(() => {
		const days = 3 + Math.floor((parseFloat(weight) || 1) / 5);
		const d = new Date();
		d.setDate(d.getDate() + days);
		return d.toDateString();
	}, [weight]);

	const onSubmit = async () => {
		if (!senderName || !receiverName || !pickup || !drop || !weight || !type) {
			Alert.alert('Missing fields', 'Please fill all required fields.');
			return;
		}
		setLoading(true);
		try {
			await sendAllIndiaParcel({ senderName, receiverName, pickup, drop, weight: parseFloat(weight), type, eta });
			router.replace({ pathname: 'success', params: { message: `All India Parcel booked. Est. delivery: ${eta}` } });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>All India Parcel</Text>
				<Text style={styles.meta}>Estimated delivery: {eta}</Text>
				<TextInput style={styles.input} placeholder="Sender Name" value={senderName} onChangeText={setSenderName} />
				<TextInput style={styles.input} placeholder="Receiver Name" value={receiverName} onChangeText={setReceiverName} />
				<TextInput style={styles.input} placeholder="Pickup Address" value={pickup} onChangeText={setPickup} />
				<TextInput style={styles.input} placeholder="Drop Address" value={drop} onChangeText={setDrop} />
				<TextInput style={styles.input} placeholder="Parcel Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
				<TextInput style={styles.input} placeholder="Parcel Type (e.g., Documents, Fragile, Clothes)" value={type} onChangeText={setType} />
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
	title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
	meta: { color: Colors.mutedText, marginBottom: Spacing.lg },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


