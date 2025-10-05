import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';
import BackButton from '../components/BackButton';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { estimateFare, createParcel } from '../services/parcelService';
import { haversineKm, estimateFareKm } from '../utils/fareCalculator';

export default function LocalParcelScreen() {
	const router = useRouter();
    const [receiverName, setReceiverName] = useState('');
    const [receiverContact, setReceiverContact] = useState('');
    const [pickup, setPickup] = useState(null); // { lat, lng, address }
    const [delivery, setDelivery] = useState(null);
    const [pkg, setPkg] = useState({ name: '', size: '', weight: '', description: '', value: '' });
    const [vehicleType] = useState('bike');
    const [fare, setFare] = useState(null);
	const [loading, setLoading] = useState(false);
    const [pickupSearch, setPickupSearch] = useState('');
    const [deliverySearch, setDeliverySearch] = useState('');
    const [searchResults, setSearchResults] = useState({ pickup: [], delivery: [] });
    const [showResults, setShowResults] = useState({ pickup: false, delivery: false });
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    
    // Refs for map components
    const pickupMapRef = useRef(null);
    const deliveryMapRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const autoSearchTimeoutRef = useRef(null);

    // Default region (Delhi) - will be updated when current location is found
    const region = useMemo(() => {
        if (currentLocation) {
            return {
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            };
        }
        return { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.08, longitudeDelta: 0.08 };
    }, [currentLocation]);
    const mapTilerKey = process.env.EXPO_PUBLIC_MAPTILER_KEY;
    const tileUrl = mapTilerKey
        ? `https://api.maptiler.com/maps/streets/512/{z}/{x}/{y}.png?key=${mapTilerKey}`
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Get user's current location on component mount
    useEffect(() => {
        const getCurrentLocation = async () => {
            try {
                setLocationLoading(true);
                
                // Check if Location is available (not available in web)
                if (!Location.requestForegroundPermissionsAsync) {
                    console.log('Location services not available');
                    setLocationLoading(false);
                    return;
                }

                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Location permission denied');
                    setLocationLoading(false);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                
                // Get address from coordinates
                const address = await getAddressFromCoords(latitude, longitude);
                const currentLocationData = { lat: latitude, lng: longitude, address };
                
                // Store current location for map region
                setCurrentLocation(currentLocationData);
                
                // Set pickup as current location if not already set
                setPickup(currentLocationData);
                setPickupSearch(address);
                
                // Center both maps on current location
                setTimeout(() => {
                    pickupMapRef.current?.animateToRegion({
                        latitude: latitude,
                        longitude: longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                    
                    deliveryMapRef.current?.animateToRegion({
                        latitude: latitude,
                        longitude: longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                }, 500);
                
            } catch (error) {
                console.log('Error getting location:', error);
            } finally {
                setLocationLoading(false);
            }
        };

        getCurrentLocation();
    }, [getAddressFromCoords]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (autoSearchTimeoutRef.current) {
                clearTimeout(autoSearchTimeoutRef.current);
            }
        };
    }, []);

    const getAddressFromCoords = useCallback(async (lat, lng) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
            const res = await fetch(url, { 
                headers: { 
                    'Accept-Language': 'en',
                    'User-Agent': 'WinkgetExpress/1.0'
                } 
            });
            
            // Check if response is HTML (error page)
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Received non-JSON response from Nominatim');
                return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
            
            const data = await res.json();
            
            // Format address to be more user-friendly
            if (data.address) {
                const addr = data.address;
                const parts = [];
                
                if (addr.house_number) parts.push(addr.house_number);
                if (addr.road) parts.push(addr.road);
                if (addr.suburb) parts.push(addr.suburb);
                if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
                if (addr.state) parts.push(addr.state);
                if (addr.postcode) parts.push(addr.postcode);
                
                if (parts.length > 0) {
                    return parts.join(', ');
                }
            }
            
            return data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.warn('Reverse geocoding error', error);
            return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback((query, type) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(async () => {
            if (!query || query.length < 3) {
                setSearchResults(prev => ({ ...prev, [type]: [] }));
                setShowResults(prev => ({ ...prev, [type]: false }));
                return;
            }
            
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`;
                const res = await fetch(url, { 
                    headers: { 
                        'Accept-Language': 'en',
                        'User-Agent': 'WinkgetExpress/1.0'
                    } 
                });
                
                // Check if response is JSON
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('Received non-JSON response from Nominatim search');
                    setSearchResults(prev => ({ ...prev, [type]: [] }));
                    setShowResults(prev => ({ ...prev, [type]: false }));
                    return;
                }
                
                const list = await res.json();
                
                if (Array.isArray(list) && list.length) {
                    const results = list.map(item => {
                        // Format address to be more user-friendly
                        let displayAddress = item.display_name;
                        
                        // Try to create a cleaner address format
                        if (item.address) {
                            const addr = item.address;
                            const parts = [];
                            
                            if (addr.house_number) parts.push(addr.house_number);
                            if (addr.road) parts.push(addr.road);
                            if (addr.suburb) parts.push(addr.suburb);
                            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
                            if (addr.state) parts.push(addr.state);
                            if (addr.postcode) parts.push(addr.postcode);
                            
                            if (parts.length > 0) {
                                displayAddress = parts.join(', ');
                            }
                        }
                        
                        return {
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon),
                            address: displayAddress
                        };
                    });
                    setSearchResults(prev => ({ ...prev, [type]: results }));
                    setShowResults(prev => ({ ...prev, [type]: true }));
                } else {
                    setSearchResults(prev => ({ ...prev, [type]: [] }));
                    setShowResults(prev => ({ ...prev, [type]: false }));
                }
            } catch (e) {
                console.warn('Nominatim search error', e);
                setSearchResults(prev => ({ ...prev, [type]: [] }));
                setShowResults(prev => ({ ...prev, [type]: false }));
            }
        }, 500);
    }, []);

    // Handle search input changes
    const handleSearchChange = (text, type) => {
        if (type === 'pickup') {
            setPickupSearch(text);
        } else {
            setDeliverySearch(text);
        }
        debouncedSearch(text, type);
        
        // Also trigger auto-search after user stops typing for 2 seconds
        if (autoSearchTimeoutRef.current) {
            clearTimeout(autoSearchTimeoutRef.current);
        }
        autoSearchTimeoutRef.current = setTimeout(() => {
            if (text && text.length >= 3) {
                handleAddressSubmit(text, type);
            }
        }, 2000);
    };

    // Handle address selection from search results
    const handleAddressSelect = (address, type) => {
        const point = { lat: address.lat, lng: address.lng, address: address.address };
        
        if (type === 'pickup') {
            setPickup(point);
            setPickupSearch(address.address);
            setShowResults(prev => ({ ...prev, pickup: false }));
            // Smooth map animation to new location
            pickupMapRef.current?.animateToRegion({
                latitude: address.lat,
                longitude: address.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        } else {
            setDelivery(point);
            setDeliverySearch(address.address);
            setShowResults(prev => ({ ...prev, delivery: false }));
            // Smooth map animation to new location
            deliveryMapRef.current?.animateToRegion({
                latitude: address.lat,
                longitude: address.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    // Handle when user types and presses enter (without selecting from dropdown)
    const handleAddressSubmit = async (text, type) => {
        if (!text || text.length < 3) return;
        
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1&addressdetails=1&countrycodes=in`;
            const res = await fetch(url, { 
                headers: { 
                    'Accept-Language': 'en',
                    'User-Agent': 'WinkgetExpress/1.0'
                } 
            });
            
            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Received non-JSON response from Nominatim address submit');
                return;
            }
            
            const list = await res.json();
            
            if (Array.isArray(list) && list.length > 0) {
                const item = list[0];
                
                // Format address to be more user-friendly
                let displayAddress = item.display_name;
                if (item.address) {
                    const addr = item.address;
                    const parts = [];
                    
                    if (addr.house_number) parts.push(addr.house_number);
                    if (addr.road) parts.push(addr.road);
                    if (addr.suburb) parts.push(addr.suburb);
                    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
                    if (addr.state) parts.push(addr.state);
                    if (addr.postcode) parts.push(addr.postcode);
                    
                    if (parts.length > 0) {
                        displayAddress = parts.join(', ');
                    }
                }
                
                const point = { 
                    lat: parseFloat(item.lat), 
                    lng: parseFloat(item.lon), 
                    address: displayAddress 
                };
                
                if (type === 'pickup') {
                    setPickup(point);
                    setPickupSearch(displayAddress);
                    // Smooth map animation to new location
                    pickupMapRef.current?.animateToRegion({
                        latitude: point.lat,
                        longitude: point.lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                } else {
                    setDelivery(point);
                    setDeliverySearch(displayAddress);
                    // Smooth map animation to new location
                    deliveryMapRef.current?.animateToRegion({
                        latitude: point.lat,
                        longitude: point.lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                }
            }
        } catch (error) {
            console.warn('Address search error:', error);
        }
    };

    const onEstimate = async () => {
        try {
            if (!pickup || !delivery) return;
            const payload = { pickup, delivery, vehicleType };
            const res = await estimateFare(payload);
            setFare(res.fare);
        } catch (e) {
            // fallback local estimate
            const km = haversineKm(pickup, delivery);
            setFare(estimateFareKm(km, vehicleType));
        }
    };

    const onMapPress = async (type, e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        
        // Show loading state
        if (type === 'pickup') {
            setPickupSearch('Getting address...');
        } else {
            setDeliverySearch('Getting address...');
        }
        
        const address = await getAddressFromCoords(latitude, longitude);
        const point = { lat: latitude, lng: longitude, address };
        
        if (type === 'pickup') {
            setPickup(point);
            setPickupSearch(address); // This will show the full address
            // Smooth map animation to new location
            pickupMapRef.current?.animateToRegion({
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        } else {
            setDelivery(point);
            setDeliverySearch(address); // This will show the full address
            // Smooth map animation to new location
            deliveryMapRef.current?.animateToRegion({
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    const onSubmit = async () => {
        if (!pickup || !delivery || !pkg.name || !pkg.size || !pkg.weight || !receiverName || !receiverContact) {
            Alert.alert('Missing fields', 'Please fill all required fields');
            return;
        }
        const weightNum = parseFloat(pkg.weight);
        if (isNaN(weightNum) || weightNum <= 0 || weightNum > 20) {
            Alert.alert('Invalid weight', 'Weight must be between 0 and 20 kg.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                pickup,
                delivery,
                package: { name: pkg.name, size: pkg.size, weight: weightNum, description: pkg.description, value: parseFloat(pkg.value || '0') },
                receiverName,
                receiverContact,
                vehicleType,
                fareEstimate: fare ?? 0,
            };
            const created = await createParcel(payload);
            Alert.alert('Parcel created', `Your parcel has been created successfully!`);
            router.push({ pathname: 'parcel-tracking', params: { id: created._id } });
        } catch (e) {
            Alert.alert('Failed', e.message || 'Please try again');
        } finally { setLoading(false); }
    };

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading || locationLoading} />
            <ScrollView contentContainerStyle={styles.content}>
				<BackButton />
                <Text style={styles.title}>Local Parcel</Text>
                <Text style={styles.meta}>Maps start at your current location. Type an address (e.g., "Gorakhpur, Uttar Pradesh") and the map will show a pointer at that location, or tap the map to get the full address in the field.</Text>

                <Text style={styles.label}>Pickup</Text>
                <View style={styles.searchContainer}>
                    <TextInput 
                        style={[styles.input, { flex: 1 }]} 
                        placeholder="Enter pickup address (e.g., Gorakhpur, Uttar Pradesh)"
                        value={pickupSearch}
                        onChangeText={(text) => handleSearchChange(text, 'pickup')}
                        onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'pickup')}
                        onFocus={() => setShowResults(prev => ({ ...prev, pickup: true }))}
                        onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, pickup: false })), 200)}
                    />
                    {showResults.pickup && searchResults.pickup.length > 0 && (
                        <View style={styles.searchResults}>
                            {searchResults.pickup.map((result, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.searchResultItem}
                                    onPress={() => handleAddressSelect(result, 'pickup')}
                                >
                                    <Text style={styles.searchResultText}>{result.address}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                <View style={styles.mapWrap}>
                    <MapView 
                        ref={pickupMapRef}
                        style={styles.map} 
                        initialRegion={region} 
                        onPress={(e) => onMapPress('pickup', e)}
                    >
                        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
                        {pickup ? <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" /> : null}
                    </MapView>
                    <View pointerEvents="none" style={styles.attributionWrap}><Text style={styles.attribution}>© OpenStreetMap contributors{mapTilerKey ? ' • MapTiler' : ''}</Text></View>
                </View>

                <Text style={styles.label}>Delivery</Text>
                <View style={styles.searchContainer}>
                    <TextInput 
                        style={[styles.input, { flex: 1 }]} 
                        placeholder="Enter delivery address (e.g., Lucknow, Uttar Pradesh)"
                        value={deliverySearch}
                        onChangeText={(text) => handleSearchChange(text, 'delivery')}
                        onSubmitEditing={(e) => handleAddressSubmit(e.nativeEvent.text, 'delivery')}
                        onFocus={() => setShowResults(prev => ({ ...prev, delivery: true }))}
                        onBlur={() => setTimeout(() => setShowResults(prev => ({ ...prev, delivery: false })), 200)}
                    />
                    {showResults.delivery && searchResults.delivery.length > 0 && (
                        <View style={styles.searchResults}>
                            {searchResults.delivery.map((result, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.searchResultItem}
                                    onPress={() => handleAddressSelect(result, 'delivery')}
                                >
                                    <Text style={styles.searchResultText}>{result.address}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                <View style={styles.mapWrap}>
                    <MapView 
                        ref={deliveryMapRef}
                        style={styles.map} 
                        initialRegion={region} 
                        onPress={(e) => onMapPress('delivery', e)}
                    >
                        <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
                        {delivery ? <Marker coordinate={{ latitude: delivery.lat, longitude: delivery.lng }} title="Delivery" /> : null}
                    </MapView>
                    <View pointerEvents="none" style={styles.attributionWrap}><Text style={styles.attribution}>© OpenStreetMap contributors{mapTilerKey ? ' • MapTiler' : ''}</Text></View>
                </View>

                <Text style={styles.section}>Package</Text>
                <TextInput style={styles.input} placeholder="Name" value={pkg.name} onChangeText={(t) => setPkg((s) => ({ ...s, name: t }))} />
                <TextInput style={styles.input} placeholder="Size (e.g., small/medium/large)" value={pkg.size} onChangeText={(t) => setPkg((s) => ({ ...s, size: t }))} />
                <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={pkg.weight} onChangeText={(t) => setPkg((s) => ({ ...s, weight: t }))} />
                <TextInput style={[styles.input, styles.multiline]} placeholder="Description" value={pkg.description} onChangeText={(t) => setPkg((s) => ({ ...s, description: t }))} multiline />
                <TextInput style={styles.input} placeholder="Declared Value (₹)" keyboardType="numeric" value={pkg.value} onChangeText={(t) => setPkg((s) => ({ ...s, value: t }))} />

                <Text style={styles.section}>Receiver</Text>
                <TextInput style={styles.input} placeholder="Receiver Name" value={receiverName} onChangeText={setReceiverName} />
                <TextInput style={styles.input} placeholder="Receiver Contact" value={receiverContact} onChangeText={setReceiverContact} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.meta}>Vehicle: {vehicleType}</Text>
                    <TouchableOpacity style={styles.estimateBtn} onPress={onEstimate}>
                        <Text style={styles.estimateTxt}>Estimate Fare</Text>
                    </TouchableOpacity>
                </View>
                {fare != null ? <Text style={styles.fare}>Estimated Fare: ₹{fare}</Text> : null}

				<TouchableOpacity style={styles.btn} onPress={onSubmit}>
                    <Text style={styles.btnTxt}>Create Parcel</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.xl },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.xs },
    meta: { color: Colors.mutedText, marginBottom: Spacing.md },
    section: { marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: '800', color: Colors.text },
    label: { marginTop: Spacing.md, marginBottom: Spacing.xs, color: Colors.text, fontWeight: '700' },
    searchContainer: { position: 'relative', marginBottom: Spacing.md },
	input: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: Radius.md,
		padding: Spacing.md,
		marginBottom: Spacing.md,
	},
    searchResults: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        maxHeight: 150,
        zIndex: 1000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    searchResultItem: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchResultText: {
        color: Colors.text,
        fontSize: 14,
    },
    multiline: { height: 80, textAlignVertical: 'top' },
    map: { height: 200, borderRadius: Radius.md, marginBottom: Spacing.md },
    mapWrap: { height: 200, borderRadius: Radius.md, marginBottom: Spacing.md, overflow: 'hidden' },
    attributionWrap: { position: 'absolute', bottom: 6, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    attribution: { fontSize: 10, color: '#333' },
	btn: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
	btnTxt: { color: '#fff', fontWeight: '700' },
    estimateBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
    estimateTxt: { color: Colors.text, fontWeight: '700' },
    fare: { marginTop: 8, fontWeight: '800', color: Colors.text },
});


