import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';

export default function ServiceCard({ title, subtitle, onPress, backgroundColor }) {
	return (
		<TouchableOpacity style={[styles.card, backgroundColor ? { backgroundColor } : null]} onPress={onPress} activeOpacity={0.9}>
			<View style={styles.badge} />
			<Text style={styles.title}>{title}</Text>
			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		flex: 1,
		minHeight: 120,
		backgroundColor: Colors.card,
		borderRadius: Radius.lg,
		padding: Spacing.lg,
		justifyContent: 'flex-end',
		borderWidth: 1,
		borderColor: Colors.border,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	badge: {
		position: 'absolute',
		top: Spacing.md,
		right: Spacing.md,
		width: 10,
		height: 10,
		borderRadius: 6,
		backgroundColor: Colors.warning,
	},
	title: {
		color: Colors.text,
		fontSize: 18,
		fontWeight: '700',
	},
	subtitle: {
		marginTop: 6,
		color: Colors.mutedText,
		fontSize: 13,
	}
});


