import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import { signupUser } from '../services/auth';

export default function SignupScreen() {
	const router = useRouter();
	const [role, setRole] = useState('User');
	const [form, setForm] = useState({
		name: '', email: '', phone: '', password: '', confirmPassword: '',
		vehicleType: '', vehicleNumber: '', licenseNumber: '',
	});
	const [loading, setLoading] = useState(false);

	const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

	const onSubmit = async () => {
		if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
			Alert.alert('Missing fields', 'Please fill all required fields');
			return;
		}
		if (form.password !== form.confirmPassword) {
			Alert.alert('Password mismatch', 'Passwords do not match');
			return;
		}
		if (role === 'Captain' && (!form.vehicleType || !form.vehicleNumber || !form.licenseNumber)) {
			Alert.alert('Missing fields', 'Please fill all captain details');
			return;
		}
		setLoading(true);
		try {
			await signupUser(role, form);
			if (role === 'Captain') router.replace('/captain'); else router.replace('/');
		} catch (e) {
			Alert.alert('Signup failed', e.message || 'Please try again');
		} finally { setLoading(false); }
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<Text style={styles.title}>Create account</Text>
			<View style={styles.toggleRow}>
				<RoleTag label="User" active={role === 'User'} onPress={() => setRole('User')} />
				<RoleTag label="Captain" active={role === 'Captain'} onPress={() => setRole('Captain')} />
			</View>
			<TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(t) => update('name', t)} />
			<TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(t) => update('email', t)} />
			<TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(t) => update('phone', t)} />
			<TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={(t) => update('password', t)} />
			<TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={form.confirmPassword} onChangeText={(t) => update('confirmPassword', t)} />
			{role === 'Captain' ? (
				<View>
					<TextInput style={styles.input} placeholder="Vehicle Type (Bike, Truck, Cab)" value={form.vehicleType} onChangeText={(t) => update('vehicleType', t)} />
					<TextInput style={styles.input} placeholder="Vehicle Number" value={form.vehicleNumber} onChangeText={(t) => update('vehicleNumber', t)} />
					<TextInput style={styles.input} placeholder="License Number" value={form.licenseNumber} onChangeText={(t) => update('licenseNumber', t)} />
				</View>
			) : null}
			<TouchableOpacity style={styles.btn} onPress={onSubmit}>
				<Text style={styles.btnTxt}>Sign up</Text>
			</TouchableOpacity>
			<Text style={styles.switchTxt}>
				Already have an account? <Link href="/login" style={styles.link}>Login</Link>
			</Text>
		</View>
	);
}

function RoleTag({ label, active, onPress }) {
	return (
		<TouchableOpacity onPress={onPress} style={[styles.tag, active ? styles.tagActive : null]}>
			<Text style={[styles.tagTxt, active ? styles.tagTxtActive : null]}>{label}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, justifyContent: 'center' },
	title: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.xl },
	input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
	btnTxt: { color: '#fff', fontWeight: '700' },
	switchTxt: { marginTop: Spacing.lg, color: Colors.mutedText },
	link: { color: Colors.accent, fontWeight: '700' },
	toggleRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
	tag: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
	tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
	tagTxt: { color: Colors.text },
	tagTxtActive: { color: '#fff' },
});


