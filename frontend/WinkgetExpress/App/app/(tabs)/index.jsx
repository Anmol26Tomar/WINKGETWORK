import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import ServiceCard from '../../components/ServiceCard';
import { Colors, Spacing } from '../../constants/colors';

const SERVICES = [
	{ key: 'local', title: 'Local Parcel', route: 'local-parcel', bg: '#E8F1FA', subtitle: '≤ 20kg, 2hrs by bike', iconName: 'cube-outline', iconColor: '#1E88E5', iconSize: 42 },
	{ key: 'truck', title: 'Truck Booking', route: 'truck-booking', bg: '#FDEDEE', subtitle: 'Mini to Large', iconName: 'bus-outline', iconColor: '#FB8C00', iconSize: 42 },
	{ key: 'allIndia', title: 'All India Parcel', route: 'all-india-parcel', bg: '#FFF8E1', subtitle: 'Nationwide shipping', iconName: 'earth-outline', iconColor: '#43A047', iconSize: 42 },
	{ key: 'cab', title: 'Cab Booking', route: 'cab-booking', bg: '#EAF7F1', subtitle: 'Hatchback, Sedan, SUV', iconName: 'car-outline', iconColor: '#3949AB', iconSize: 42 },
	{ key: 'bike', title: 'Bike Ride', route: 'bike-ride', bg: '#F1F1FF', subtitle: 'Fast and affordable', iconName: 'bicycle-outline', iconColor: '#E91E63', iconSize: 42 },
	{ key: 'packers', title: 'Packers & Movers', route: 'packers-movers', bg: '#F5EDF7', subtitle: '1-3BHK moves', iconName: 'home-outline', iconColor: '#8E24AA', iconSize: 42 },
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
						<ServiceCard
							title={item.title}
							subtitle={item.subtitle}
							backgroundColor={item.bg}
							iconName={item.iconName}
							iconColor={item.iconColor}
							iconSize={item.iconSize}
							onPress={() => router.push(item.route)}
						/>
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



