import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabsHomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.banner}>
                    <View style={styles.bannerLeft}>
                        <View style={styles.iconCircle}><Ionicons name="flash" size={22} color="#fff" /></View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.bannerTitle}>Winkget Express</Text>
                            <Text style={styles.bannerSubtitle}>Fast rides, reliable delivery</Text>
                        </View>
                    </View>
                    <View style={styles.bannerCta}><Text style={styles.bannerCtaTxt}>Welcome</Text></View>
                </View>

                <Text style={styles.heading}>One app for logistics and rides</Text>
                <Text style={styles.subHeading}>Bike, Cab, Truck, Parcel and Packers & Movers in a single experience.</Text>

                <Image
                    source={require('@/assets/images/logistics.jpeg')}
                    resizeMode="cover"
                    style={styles.heroImage}
                />

                <View style={styles.featureRow}>
                    <View style={styles.chip}><Ionicons name="bicycle-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Bike</Text></View>
                    <View style={styles.chip}><Ionicons name="car-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Cab</Text></View>
                    <View style={styles.chip}><Ionicons name="bus-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Truck</Text></View>
                    <View style={styles.chip}><Ionicons name="cube-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Parcel</Text></View>
                </View>

                <View style={styles.heroCard}>
                    <Ionicons name="rocket-outline" size={42} color={Colors.primary} />
                    <Text style={styles.hero}>Book in seconds. Track live. Pay securely.</Text>
                    <Text style={styles.subHeading}>Trusted delivery partners with transparent pricing.</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-done-circle-outline" size={22} color={Colors.primary} />
                        <Text style={styles.statValue}>50K+</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="location-outline" size={22} color={Colors.primary} />
                        <Text style={styles.statValue}>300+</Text>
                        <Text style={styles.statLabel}>Cities</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="people-outline" size={22} color={Colors.primary} />
                        <Text style={styles.statValue}>5K+</Text>
                        <Text style={styles.statLabel}>Partners</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.cta} onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.9}>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={[styles.ctaTxt, { marginLeft: 8 }]}>Let's Explore</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={Colors.mutedText} />
                        <Text style={styles.footerText}>Secure</Text>
                    </View>
                    <View style={styles.footerDivider} />
                    <View style={styles.footerItem}>
                        <Ionicons name="time-outline" size={18} color={Colors.mutedText} />
                        <Text style={styles.footerText}>On-time</Text>
                    </View>
                    <View style={styles.footerDivider} />
                    <View style={styles.footerItem}>
                        <Ionicons name="chatbubbles-outline" size={18} color={Colors.mutedText} />
                        <Text style={styles.footerText}>Support</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1, padding: Spacing.xl },
    scrollContent: { paddingBottom: 100 },
    heading: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    subHeading: { color: Colors.mutedText, marginBottom: Spacing.md, textAlign: 'center' },
    tilesRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginBottom: Spacing.lg },
    tile: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', gap: 8 },
    tileTxt: { fontWeight: '700', color: Colors.text, fontSize: 12 },
    heroCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
    hero: { fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    cta: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 24, alignSelf: 'center', width: '100%' },
    ctaTxt: { color: '#fff', fontWeight: '700' },
    banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.lg,
        backgroundColor: '#2A5EE4' },
    bannerLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    bannerTitle: { color: '#fff', fontWeight: '800' },
    bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
    bannerCta: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.md },
    bannerCtaTxt: { color: '#0E4D92', fontWeight: '800' },
    featureRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md, justifyContent: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
    chipText: { color: Colors.text, fontWeight: '700', fontSize: 12 },
    heroImage: { width: '100%', height: 140, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    statCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', gap: 2 },
    statValue: { fontWeight: '800', color: Colors.text },
    statLabel: { color: Colors.mutedText, fontSize: 12 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: Spacing.md },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { color: Colors.mutedText, fontWeight: '700', fontSize: 12 },
    footerDivider: { width: 1, height: 14, backgroundColor: Colors.border },
});

