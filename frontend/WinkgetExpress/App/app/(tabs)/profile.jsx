import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
	const { user, logout } = useAuth();
	const router = useRouter();

	const onLogout = async () => {
		await logout();
		router.replace('/login');
	};

	return (
		<View style={styles.container}>
			<Text style={styles.heading}>Profile</Text>
			<View style={styles.card}>
				<Text style={styles.label}>Name</Text>
				<Text style={styles.value}>{user?.name || '-'}</Text>
				<Text style={styles.label}>Email</Text>
				<Text style={styles.value}>{user?.email || '-'}</Text>
			</View>
			<TouchableOpacity style={styles.btn} onPress={onLogout}>
				<Text style={styles.btnTxt}>Logout</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
	heading: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
	card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
	label: { color: Colors.mutedText, marginTop: 8 },
	value: { color: Colors.text, fontWeight: '700' },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.md },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


