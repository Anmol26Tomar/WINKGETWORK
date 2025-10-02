import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';

export default function BackButton() {
	const router = useRouter();
	return (
		<TouchableOpacity onPress={() => router.back()} style={styles.btn}>
			<Text style={styles.txt}>Back</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	btn: {
		alignSelf: 'flex-start',
		backgroundColor: Colors.card,
		borderColor: Colors.border,
		borderWidth: 1,
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
		borderRadius: Radius.md,
		marginBottom: Spacing.md,
	},
	txt: { color: Colors.text, fontWeight: '600' },
});


