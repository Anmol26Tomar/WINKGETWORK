import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/colors';
import BackButton from '../components/BackButton';

const VEHICLES = [
    { key: 'mini_truck', label: 'Mini Truck', subtitle: 'Best for 1RK/Studio, boxes', emoji: '🚚' },
    { key: 'auto', label: 'Auto', subtitle: 'Budget 3-wheeler for small moves', emoji: '🛺' },
    { key: 'pickup_van', label: 'Pickup Van', subtitle: 'For bulky items and furniture', emoji: '🚛' },
];

export default function TruckBookingScreen() {
    const router = useRouter();

    const goToForm = (vehicleType) => {
        router.push({ pathname: 'truck-booking-form', params: { vehicleType } });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <BackButton />
                <Text style={styles.title}>Choose your vehicle</Text>
                <Text style={styles.subtitle}>Select the right option for your load</Text>
				<View style={styles.grid}>
                    {VEHICLES.map((v) => (
						<TouchableOpacity key={v.key} style={styles.card} onPress={() => goToForm(v.key)}>
                            <Text style={styles.emoji}>{v.emoji}</Text>
                            <Text style={styles.cardTitle}>{v.label}</Text>
                            <Text style={styles.cardSub}>{v.subtitle}</Text>
                            <View style={styles.cta}><Text style={styles.ctaTxt}>Book {v.label}</Text></View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl },
    title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    subtitle: { color: Colors.mutedText, marginBottom: Spacing.lg },
	grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
	card: { width: '48%', backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
    emoji: { fontSize: 28, marginBottom: Spacing.sm },
    cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    cardSub: { color: Colors.mutedText, fontSize: 12, marginBottom: Spacing.md },
    cta: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center' },
    ctaTxt: { color: '#fff', fontWeight: '700' },
});


