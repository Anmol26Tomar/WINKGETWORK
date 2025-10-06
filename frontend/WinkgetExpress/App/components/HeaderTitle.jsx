import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const titleToIcon = {
	'Home': 'home-outline',
	'Explore': 'compass-outline',
	'Profile': 'person-circle-outline',
	'Winkget Services': 'apps-outline',
	'Order History': 'time-outline',
	'Parcel Details': 'cube-outline',
	'Local Parcel': 'cube-outline',
	'Truck Booking': 'bus-outline',
	'Booking Form': 'create-outline',
	'All India Parcel': 'earth-outline',
	'Cab Booking': 'car-outline',
	'Bike Ride': 'bicycle-outline',
	'Packers & Movers': 'home-outline',
	'Captain Dashboard': 'speedometer-outline',
};

export default function HeaderTitle({ children }) {
	return (
		<View style={styles.wrap}>
			{titleToIcon[String(children)] ? (
				<View style={styles.iconWrap}>
					<Ionicons name={titleToIcon[String(children)]} size={18} color={Colors.text} />
				</View>
			) : (
				<View style={styles.accent} />
			)}
			<Text style={styles.title} numberOfLines={1}>{children}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.sm,
	},
	accent: {
		width: 26,
		height: 26,
		borderRadius: 8,
		backgroundColor: Colors.primary,
		opacity: 0.15,
	},
	iconWrap: {
		width: 26,
		height: 26,
		borderRadius: 8,
		backgroundColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: '800',
		color: Colors.text,
	},
});


