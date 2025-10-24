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
                    <View style={styles.chip}><Ionicons name="home-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Move</Text></View>
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
    heading: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
    subHeading: { color: Colors.mutedText, marginBottom: Spacing.lg, textAlign: 'center', fontSize: 16, lineHeight: 22 },
    tilesRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginBottom: Spacing.lg },
    tile: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', gap: 8, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    tileTxt: { fontWeight: '700', color: Colors.text, fontSize: 12 },
    heroCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    hero: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
    cta: { backgroundColor: Colors.primary, padding: Spacing.xl, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: Spacing.xl, alignSelf: 'center', width: '100%', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    ctaTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
    banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderRadius: Radius.xl, marginBottom: Spacing.xl, backgroundColor: '#2A5EE4', shadowColor: '#2A5EE4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    bannerLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
    bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
    bannerCta: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    bannerCtaTxt: { color: '#0E4D92', fontWeight: '800', fontSize: 14 },
    featureRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg, justifyContent: 'center', flexWrap: 'wrap' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 24, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    chipText: { color: Colors.text, fontWeight: '700', fontSize: 12 },
    heroImage: { width: '100%', height: 160, borderRadius: Radius.xl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
    statCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', gap: 4, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    statValue: { fontWeight: '800', color: Colors.text, fontSize: 16 },
    statLabel: { color: Colors.mutedText, fontSize: 12, textAlign: 'center' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { color: Colors.mutedText, fontWeight: '700', fontSize: 12 },
    footerDivider: { width: 1, height: 16, backgroundColor: Colors.border },
});

