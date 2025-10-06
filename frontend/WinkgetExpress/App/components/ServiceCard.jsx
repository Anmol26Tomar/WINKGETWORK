import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/colors';

export default function ServiceCard({ title, subtitle, onPress, backgroundColor, iconName, iconColor, iconSize }) {
	return (
		<TouchableOpacity style={[styles.card, backgroundColor ? { backgroundColor } : null]} onPress={onPress} activeOpacity={0.9}>
			{iconName ? (
				<View style={styles.iconWrap}>
					<Ionicons name={iconName} size={iconSize || 40} color={iconColor || Colors.primary} />
				</View>
			) : null}
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
		width: 10,
		height: 10,
		borderRadius: 6,
		backgroundColor: Colors.warning,
	},
	iconWrap: {
		width: 48,
		height: 48,
		borderRadius: 14,
		backgroundColor: 'rgba(0,0,0,0.06)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: Spacing.md,
		alignSelf: 'flex-start',
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


