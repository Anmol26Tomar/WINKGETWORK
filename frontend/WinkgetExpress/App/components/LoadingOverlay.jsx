import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export default function LoadingOverlay({ visible }) {
	if (!visible) return null;
	return (
		<View style={styles.overlay}>
			<ActivityIndicator size="large" color={Colors.primary} />
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.08)',
		alignItems: 'center',
		justifyContent: 'center',
	}
});


