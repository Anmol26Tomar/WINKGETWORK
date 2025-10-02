import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { sendLocalParcel } from '../services/api';

export default function LocalParcelScreen() {
	const router = useRouter();
	const [senderName, setSenderName] = useState('');
	const [receiverName, setReceiverName] = useState('');
	const [pickup, setPickup] = useState('');
	const [drop, setDrop] = useState('');
	const [weight, setWeight] = useState('');
	const [desc, setDesc] = useState('');
	const [loading, setLoading] = useState(false);

	const onSubmit = async () => {
		const w = parseFloat(weight);
		if (!senderName || !receiverName || !pickup || !drop || !weight) {
			Alert.alert('Missing fields', 'Please fill all required fields.');
			return;
		}
		if (isNaN(w) || w <= 0 || w > 20) {
			Alert.alert('Invalid weight', 'Weight must be between 0 and 20 kg.');
			return;
		}
		setLoading(true);
		try {
			await sendLocalParcel({ senderName, receiverName, pickup, drop, weight: w, desc });
			router.replace({ pathname: 'success', params: { message: 'Local Parcel forwarded to captain app.' } });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>Local Parcel</Text>
				<Text style={styles.meta}>Max 20kg. Delivered in 2hrs by bike.</Text>

				<TextInput style={styles.input} placeholder="Sender Name" value={senderName} onChangeText={setSenderName} />
				<TextInput style={styles.input} placeholder="Receiver Name" value={receiverName} onChangeText={setReceiverName} />
				<TextInput style={styles.input} placeholder="Pickup Address" value={pickup} onChangeText={setPickup} />
				<TextInput style={styles.input} placeholder="Drop Address" value={drop} onChangeText={setDrop} />
				<TextInput style={styles.input} placeholder="Parcel Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
				<TextInput style={[styles.input, styles.multiline]} placeholder="Parcel Description" value={desc} onChangeText={setDesc} multiline />

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
	input: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: Radius.md,
		padding: Spacing.md,
		marginBottom: Spacing.md,
	},
	multiline: { height: 100, textAlignVertical: 'top' },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


