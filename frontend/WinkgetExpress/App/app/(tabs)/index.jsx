import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TextInput, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../constants/colors';
import LoadingOverlay from '../../components/LoadingOverlay';
import ServiceFlowDrawer from '../../components/ServiceFlowDrawer';
import { Ionicons } from '@expo/vector-icons';

export default function TabsHomeScreen() {
    const router = useRouter();

    const mapRef = useRef(null);
    const drawerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [pickup, setPickup] = useState(null);
    const [delivery, setDelivery] = useState(null);
    const [pickupSearch, setPickupSearch] = useState('');
    const [deliverySearch, setDeliverySearch] = useState('');
    const [searchResults, setSearchResults] = useState({ pickup: [], delivery: [] });
    const [showResults, setShowResults] = useState({ pickup: false, delivery: false });
    const searchTimeoutRef = useRef(null);

    const region = useMemo(() => ({ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.08, longitudeDelta: 0.08 }), []);
    const mapTilerKey = process.env.EXPO_PUBLIC_MAPTILER_KEY;
    const tileUrl = mapTilerKey
        ? `https://api.maptiler.com/maps/streets/512/{z}/{x}/{y}.png?key=${mapTilerKey}`
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    useEffect(() => {
        (async () => {
            try {
                if (!Location.requestForegroundPermissionsAsync) return;
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;
                const loc = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = loc.coords;
                const addr = await getAddressFromCoords(latitude, longitude);
                const point = { lat: latitude, lng: longitude, address: addr };
                setPickup(point);
                setPickupSearch(addr);
                setTimeout(() => mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600), 300);
            } catch {}
        })();
    }, []);

    const debounced = (fn, ref, delay = 500) => (arg1, arg2) => {
        if (ref.current) clearTimeout(ref.current);
        ref.current = setTimeout(() => fn(arg1, arg2), delay);
    };

    const runSearch = async (query, type) => {
        if (!query || query.length < 3) {
            setSearchResults((prev) => ({ ...prev, [type]: [] }));
            setShowResults((prev) => ({ ...prev, [type]: false }));
            return;
        }
        try {
            const results = await searchPlaces(query);
            setSearchResults((prev) => ({ ...prev, [type]: results }));
            setShowResults((prev) => ({ ...prev, [type]: results.length > 0 }));
        } catch {
            setSearchResults((prev) => ({ ...prev, [type]: [] }));
            setShowResults((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleSearchChange = (({ setPickupSearch, setDeliverySearch, searchTimeoutRef }) => {
        const debouncedRun = debounced((q, type) => runSearch(q, type), searchTimeoutRef, 500);
        return (text, type) => {
            if (type === 'pickup') setPickupSearch(text); else setDeliverySearch(text);
            debouncedRun(text, type);
        };
    })({ setPickupSearch, setDeliverySearch, searchTimeoutRef });

    const handleAddressSelect = ({ lat, lng, address }, type) => {
        const point = { lat, lng, address };
        if (type === 'pickup') {
            setPickup(point);
            setPickupSearch(address);
            setShowResults((s) => ({ ...s, pickup: false }));
        } else {
            setDelivery(point);
            setDeliverySearch(address);
            setShowResults((s) => ({ ...s, delivery: false }));
        }
        setTimeout(() => mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600), 100);
    };

    const handleAddressSubmit = async (text, type) => {
        if (!text || text.length < 3) return;
        const results = await searchPlaces(text);
        if (!results.length) return;
        const top = results[0];
        handleAddressSelect(top, type);
    };

    const onMapPress = async (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        const address = await getAddressFromCoords(latitude, longitude);
        const point = { lat: latitude, lng: longitude, address };
        if (!pickup) { setPickup(point); setPickupSearch(address); }
        else { setDelivery(point); setDeliverySearch(address); }
    };

    const openDrawerIfReady = () => {
        if (!pickup || !delivery) {
            Alert.alert('Select addresses', 'Please set both pickup and delivery');
            return;
        }
        drawerRef.current?.open({ pickup, delivery });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.banner}>
                    <View style={styles.bannerLeft}>
                        <View style={styles.iconCircle}><Ionicons name="flash" size={22} color="#fff" /></View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.bannerTitle}>Winkget Express</Text>
                            <Text style={styles.bannerSubtitle}>Fast rides, reliable delivery</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={openDrawerIfReady} style={styles.bannerCta}>
                        <Text style={styles.bannerCtaTxt}>Get Quote</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.heading}>Plan your ride or parcel</Text>
                <Text style={styles.subHeading}>Pick addresses, compare fares, book in seconds.</Text>

                <View style={styles.featureRow}>
                    <View style={styles.chip}><Ionicons name="bicycle-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Bike</Text></View>
                    <View style={styles.chip}><Ionicons name="car-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Cab</Text></View>
                    <View style={styles.chip}><Ionicons name="bus-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Truck</Text></View>
                    <View style={styles.chip}><Ionicons name="cube-outline" size={16} color={Colors.primary} /><Text style={styles.chipText}>Parcel</Text></View>
                </View>

                <Text style={styles.label}>Pickup</Text>
                <View style={styles.searchContainer}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Search pickup address" value={pickupSearch}
                        onChangeText={(t) => handleSearchChange(t, 'pickup')}
                        onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'pickup')}
                        onFocus={() => setShowResults((s) => ({ ...s, pickup: true }))}
                        onBlur={() => setTimeout(() => setShowResults((s) => ({ ...s, pickup: false })), 200)}
                    />
                    {showResults.pickup && searchResults.pickup?.length > 0 ? (
                        <View style={styles.searchResults}>
                            {searchResults.pickup.map((r, i) => (
                                <TouchableOpacity key={`p-${i}`} style={styles.searchResultItem} onPress={() => handleAddressSelect(r, 'pickup')}>
                                    <Text style={styles.searchResultText}>{r.address}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                </View>

                <Text style={styles.label}>Delivery / Destination</Text>
                <View style={styles.searchContainer}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Search delivery address" value={deliverySearch}
                        onChangeText={(t) => handleSearchChange(t, 'delivery')}
                        onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'delivery')}
                        onFocus={() => setShowResults((s) => ({ ...s, delivery: true }))}
                        onBlur={() => setTimeout(() => setShowResults((s) => ({ ...s, delivery: false })), 200)}
                    />
                    {showResults.delivery && searchResults.delivery?.length > 0 ? (
                        <View style={styles.searchResults}>
                            {searchResults.delivery.map((r, i) => (
                                <TouchableOpacity key={`d-${i}`} style={styles.searchResultItem} onPress={() => handleAddressSelect(r, 'delivery')}>
                                    <Text style={styles.searchResultText}>{r.address}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                </View>

                <View style={styles.mapWrap}>
                    <MapView ref={mapRef} style={styles.map} initialRegion={region} onPress={onMapPress}>
                        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
                        {pickup && (<Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={Colors.primary} title="Pickup" />)}
                        {delivery && (<Marker coordinate={{ latitude: delivery.lat, longitude: delivery.lng }} pinColor={Colors.accent} title="Delivery" />)}
                        {pickup && delivery && (
                            <Polyline coordinates={[{ latitude: pickup.lat, longitude: pickup.lng }, { latitude: delivery.lat, longitude: delivery.lng }]} strokeColor={Colors.primary} strokeWidth={3} />
                        )}
                    </MapView>
                </View>

                <TouchableOpacity style={styles.cta} onPress={openDrawerIfReady} activeOpacity={0.9}>
                    <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
                    <Text style={[styles.ctaTxt, { marginLeft: 8 }]}>Continue</Text>
                </TouchableOpacity>

                {/* Home page simplified to only centralized address + map */}
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
            </View>
            <ServiceFlowDrawer ref={drawerRef} onSuccess={(res) => {
                try {
                    if (res?.type === 'parcel' && res?.id) router.push({ pathname: '/parcel-tracking', params: { id: res.id } });
                    if (res?.type === 'transport' && res?.id) router.push({ pathname: '/transport-tracking', params: { id: res.id } });
                } catch {}
            }} />
            <LoadingOverlay visible={loading} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    container: { flex: 1, padding: Spacing.xl },
    heading: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    subHeading: { color: Colors.mutedText, marginBottom: Spacing.md },
    row: { gap: Spacing.md, marginBottom: Spacing.md },
    cardWrap: { flex: 1 },
    label: { fontWeight: '700', color: Colors.text, marginBottom: 6, marginTop: Spacing.sm },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, minHeight: 52, fontSize: 15, textAlignVertical: 'center' },
    searchContainer: { position: 'relative', marginBottom: Spacing.md },
    searchResults: { position: 'absolute', top: 56, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, zIndex: 10 },
    searchResultItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    searchResultText: { color: Colors.text },
    mapWrap: { height: 220, borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    map: { flex: 1 },
    cta: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: Spacing.lg },
    ctaTxt: { color: '#fff', fontWeight: '700' },
    banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.lg,
        backgroundColor: '#2A5EE4' },
    bannerLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    bannerTitle: { color: '#fff', fontWeight: '800' },
    bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
    bannerCta: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.md },
    bannerCtaTxt: { color: '#0E4D92', fontWeight: '800' },
    featureRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
    chipText: { color: Colors.text, fontWeight: '700', fontSize: 12 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: Spacing.md },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { color: Colors.mutedText, fontWeight: '700', fontSize: 12 },
    footerDivider: { width: 1, height: 14, backgroundColor: Colors.border },
});

async function getAddressFromCoords(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'WinkgetExpress/1.0' } });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        const data = await res.json();
        if (data.address) {
            const a = data.address; const parts = [];
            if (a.house_number) parts.push(a.house_number);
            if (a.road) parts.push(a.road);
            if (a.suburb) parts.push(a.suburb);
            if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
            if (a.state) parts.push(a.state);
            if (a.postcode) parts.push(a.postcode);
            if (parts.length) return parts.join(', ');
        }
        return data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
        return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

async function searchPlaces(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'WinkgetExpress/1.0' } });
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    return list.map((item) => {
        let displayAddress = item.display_name;
        if (item.address) {
            const a = item.address; const parts = [];
            if (a.house_number) parts.push(a.house_number);
            if (a.road) parts.push(a.road);
            if (a.suburb) parts.push(a.suburb);
            if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
            if (a.state) parts.push(a.state);
            if (a.postcode) parts.push(a.postcode);
            if (parts.length) displayAddress = parts.join(', ');
        }
        return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: displayAddress };
    });
}



