import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/colors';
import { clearSession, getSession } from '../../services/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function CaptainDashboard() {
	const router = useRouter();
	const [user, setUser] = useState(null);
	useEffect(() => { (async () => setUser(await getSession()))(); }, []);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Captain Dashboard</Text>
			<Text style={styles.meta}>Welcome {user?.name || 'Captain'}</Text>
			<View style={styles.card}>
				<Text style={styles.cardTitle}>Today's Summary</Text>
				<Text style={styles.cardText}>Rides: 0 | Deliveries: 0 | Earnings: ₹0</Text>
			</View>
			<TouchableOpacity style={styles.btn} onPress={async () => { await clearSession(); router.replace('/login'); }}>
				<Text style={styles.btnTxt}>Logout</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
	title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
	meta: { color: Colors.mutedText, marginBottom: Spacing.xl },
	card: { backgroundColor: '#fff', padding: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
	cardTitle: { fontWeight: '800', color: Colors.primary, marginBottom: Spacing.sm },
	cardText: { color: Colors.text },
	btn: { backgroundColor: Colors.accent, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


