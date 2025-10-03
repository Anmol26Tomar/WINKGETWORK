import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/colors';

const BLOGS = [
	{ title: 'Local Parcel', body: 'Quick intra-city deliveries up to 20kg by bike within 2 hours.' },
	{ title: 'Truck Booking', body: 'From mini trucks to large vehicles, book for your shifting needs.' },
	{ title: 'All India Parcel', body: 'Ship across India with reliable partners and tracking.' },
	{ title: 'Cab Booking', body: 'Affordable cabs across hatchback, sedan and SUV categories.' },
	{ title: 'Bike Ride', body: 'Beat the traffic with quick two-wheeler rides.' },
	{ title: 'Packers & Movers', body: 'Door-to-door packing, moving and insurance options.' },
];

export default function ExploreScreen() {
	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
			{BLOGS.map((b, idx) => (
				<View key={idx} style={styles.card}>
					<Text style={styles.title}>{b.title}</Text>
					<Text style={styles.body}>{b.body}</Text>
				</View>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
	card: { backgroundColor: '#fff', borderRadius: 12, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
	title: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 6 },
	body: { color: Colors.mutedText },
});


