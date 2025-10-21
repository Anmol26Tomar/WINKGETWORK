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
		minHeight: 140,
		backgroundColor: Colors.card,
		borderRadius: 20,
		padding: 20,
		justifyContent: 'flex-end',
		borderWidth: 1,
		borderColor: Colors.border,
		shadowColor: '#000',
		shadowOpacity: 0.12,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},
	badge: {
		width: 12,
		height: 12,
		borderRadius: 8,
		backgroundColor: Colors.warning,
	},
	iconWrap: {
		width: 56,
		height: 56,
		borderRadius: 16,
		backgroundColor: 'rgba(0,0,0,0.08)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		alignSelf: 'flex-start',
	},
	title: {
		color: Colors.text,
		fontSize: 20,
		fontWeight: '800',
		lineHeight: 24,
	},
	subtitle: {
		marginTop: 8,
		color: Colors.mutedText,
		fontSize: 14,
		lineHeight: 18,
	}
});


