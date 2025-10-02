import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import { requestPackersMovers } from '../services/api';

const HOUSES = ['1BHK', '2BHK', '3BHK'];

export default function PackersMoversScreen() {
	const router = useRouter();
	const [fromAddr, setFromAddr] = useState('');
	const [toAddr, setToAddr] = useState('');
	const [house, setHouse] = useState(HOUSES[0]);
	const [extras, setExtras] = useState('');
	const [loading, setLoading] = useState(false);

	const price = useMemo(() => {
		const base = house === '1BHK' ? 3000 : house === '2BHK' ? 5000 : 7500;
		const extraCost = Math.min(2000, extras.length * 10);
		return base + extraCost;
	}, [house, extras]);

	const onSubmit = async () => {
		if (!fromAddr || !toAddr) {
			Alert.alert('Missing fields', 'Please enter from and to address.');
			return;
		}
		setLoading(true);
		try {
			await requestPackersMovers({ fromAddr, toAddr, house, extras, price });
			router.replace({ pathname: 'success', params: { message: `Packers & Movers request sent. Est. price ₹${price}` } });
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<ScrollView contentContainerStyle={styles.content}>
				<BackButton />
				<Text style={styles.title}>Packers & Movers</Text>
				<View style={styles.pickerWrap}>
					{HOUSES.map((t) => (
						<TouchableOpacity key={t} onPress={() => setHouse(t)} style={[styles.tag, house === t ? styles.tagActive : null]}>
							<Text style={[styles.tagTxt, house === t ? styles.tagTxtActive : null]}>{t}</Text>
						</TouchableOpacity>
					))}
				</View>
				<TextInput style={styles.input} placeholder="From Address" value={fromAddr} onChangeText={setFromAddr} />
				<TextInput style={styles.input} placeholder="To Address" value={toAddr} onChangeText={setToAddr} />
				<TextInput style={[styles.input, styles.multiline]} placeholder="Extra Items (optional)" value={extras} onChangeText={setExtras} multiline />
				<Text style={styles.meta}>Estimated price: ₹{price}</Text>
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
	multiline: { height: 100, textAlignVertical: 'top' },
	meta: { color: Colors.mutedText, marginBottom: Spacing.lg },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


