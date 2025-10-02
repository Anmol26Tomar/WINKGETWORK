import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import { loginUser } from '../services/auth';

export default function LoginScreen() {
	const router = useRouter();
	const [role, setRole] = useState('User');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const onSubmit = async () => {
		if (!email || !password) return Alert.alert('Missing fields', 'Please fill all fields');
		setLoading(true);
		try {
			await loginUser(role, email.trim(), password);
			if (role === 'Captain') router.replace('/captain'); else router.replace('/');
		} catch (e) {
			Alert.alert('Login failed', e.message || 'Please try again');
		} finally { setLoading(false); }
	};

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading} />
			<Text style={styles.title}>Welcome back</Text>
			<View style={styles.toggleRow}>
				<RoleTag label="User" active={role === 'User'} onPress={() => setRole('User')} />
				<RoleTag label="Captain" active={role === 'Captain'} onPress={() => setRole('Captain')} />
			</View>
			<TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
			<TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
			<TouchableOpacity style={styles.btn} onPress={onSubmit}>
				<Text style={styles.btnTxt}>Login</Text>
			</TouchableOpacity>
			<Text style={styles.switchTxt}>
				Don't have an account? <Link href="/signup" style={styles.link}>Sign up</Link>
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


