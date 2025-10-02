import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';

export default function SuccessScreen() {
	const params = useLocalSearchParams();
	const router = useRouter();
	const message = params?.message || 'Request submitted successfully!';
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Success</Text>
			<Text style={styles.msg}>{message}</Text>
			<TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}> 
				<Text style={styles.btnTxt}>Go to Home</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, justifyContent: 'center' },
	title: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md },
	msg: { fontSize: 16, color: Colors.text, marginBottom: Spacing.xl },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
	btnTxt: { color: '#fff', fontWeight: '700' },
});


