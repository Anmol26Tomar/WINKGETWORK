import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import ServiceCard from '../../components/ServiceCard';
import { Colors, Spacing } from '../../constants/colors';

const SERVICES = [
	{ key: 'local', title: 'Local Parcel', route: 'local-parcel', bg: '#E8F1FA', subtitle: '≤ 20kg, 2hrs by bike' },
	{ key: 'truck', title: 'Truck Booking', route: 'truck-booking', bg: '#FDEDEE', subtitle: 'Mini to Large' },
	{ key: 'allIndia', title: 'All India Parcel', route: 'all-india-parcel', bg: '#FFF8E1', subtitle: 'Nationwide shipping' },
	{ key: 'cab', title: 'Cab Booking', route: 'cab-booking', bg: '#EAF7F1', subtitle: 'Hatchback, Sedan, SUV' },
	{ key: 'bike', title: 'Bike Ride', route: 'bike-ride', bg: '#F1F1FF', subtitle: 'Fast and affordable' },
	{ key: 'packers', title: 'Packers & Movers', route: 'packers-movers', bg: '#F5EDF7', subtitle: '1-3BHK moves' },
];

export default function TabsHomeScreen() {
	const router = useRouter();
	return (
		<SafeAreaView style={styles.safe}>
			<StatusBar barStyle="dark-content" />
			<View style={styles.container}>
				<Text style={styles.heading}>Choose a service</Text>
				<FlatList
					data={SERVICES}
					numColumns={2}
					columnWrapperStyle={styles.row}
					keyExtractor={(item) => item.key}
					renderItem={({ item }) => (
						<View style={styles.cardWrap}>
							<ServiceCard title={item.title} subtitle={item.subtitle} backgroundColor={item.bg} onPress={() => router.push(item.route)} />
						</View>
					)}
					contentContainerStyle={{ paddingBottom: 40 }}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: Colors.background },
	container: { flex: 1, padding: Spacing.xl },
	heading: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
	row: { gap: Spacing.md, marginBottom: Spacing.md },
	cardWrap: { flex: 1 },
});



