import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Platform, Linking } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { TripCard } from '../../components/TripCard';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { tripService } from '../../services/api';
import { getRoutePolyline } from '../../services/api';
import type { Trip } from '../../types';
import { resolveEndpoint, getApiBase } from '../../constants/api';

export default function BikeRideScreen() {
  const { captain } = useAuth();
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pickupOtpModalVisible, setPickupOtpModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [pickupOtp, setPickupOtp] = useState('');
  const [dropOtp, setDropOtp] = useState('');
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);

  const bikeCaptain = useMemo(() => {
    const base = captain || {} as any;
    return { ...base, vehicle_type: 'bike', service_scope: 'intra_city' };
  }, [captain]);

  const fetchTrips = useCallback(async (lat?: number, lng?: number) => {
    try {
      const list = await tripService.getPendingRequests(lat, lng, { vehicleType: 'bike', serviceType: 'intra-city' });
      setPendingTrips(list as any);
      // load active trip from backend if any
      try {
        const res = await fetch(resolveEndpoint('GET_ACTIVE_TRIP'));
        if (res.ok) {
          const data = await res.json();
          setActiveTrip(data);
        }
      } catch {}
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLoc({ lat, lng });
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      await fetchTrips(lat, lng);
    })();
  }, []);

  useEffect(() => {
    const base = getApiBase().replace('/api', '');
    const socket = io(base, { transports: ['websocket'] });
    socket.on('captain:new-order', () => {
      if (userLoc) fetchTrips(userLoc.lat, userLoc.lng);
    });
    return () => socket.disconnect();
  }, [userLoc]);

  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;
    (async () => {
      if (!activeTrip) return;
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      watcher = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 25 }, async (loc) => {
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setUserLoc({ lat, lng });
        const pickupLat = (activeTrip as any).pickup?.lat || (activeTrip as any).pickup_lat;
        const pickupLng = (activeTrip as any).pickup?.lng || (activeTrip as any).pickup_lng;
        const dropLat = (activeTrip as any).delivery?.lat || (activeTrip as any).dropoff_lat;
        const dropLng = (activeTrip as any).delivery?.lng || (activeTrip as any).dropoff_lng;
        if (pickupLat && pickupLng) {
          const d = haversineKm({ lat, lng }, { lat: pickupLat, lng: pickupLng });
          if (d <= 0.1 && activeTrip.status === 'accepted') setPickupOtpModalVisible(true);
        }
        if (dropLat && dropLng) {
          const d2 = haversineKm({ lat, lng }, { lat: dropLat, lng: dropLng });
          if (d2 <= 0.1 && activeTrip.status === 'in_progress') setOtpModalVisible(true);
        }
      });
    })();
    return () => { if (watcher) watcher.remove(); };
  }, [activeTrip]);

  function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userLoc) fetchTrips(userLoc.lat, userLoc.lng);
  }, [userLoc, fetchTrips]);

  const openMaps = (lat: number, lng: number) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:', default: 'https:' });
    const url = Platform.select({ ios: `${scheme}?q=${lat},${lng}`, android: `${scheme}${lat},${lng}`, default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` });
    Linking.openURL(url);
  };

  const handleAcceptTrip = async (tripId: string) => {
    try {
      const trip = await tripService.acceptTrip(tripId);
      setActiveTrip(trip);
      setPendingTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (userLoc && (trip as any).pickup) {
        const poly = await getRoutePolyline(userLoc, { lat: (trip as any).pickup.lat, lng: (trip as any).pickup.lng });
        setRouteCoords(poly.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleVerifyPickupOtp = async () => {
    if (!pickupOtp.trim() || pickupOtp.length !== 4) return Alert.alert('Error', 'Enter 4-digit OTP');
    try {
      if (activeTrip) {
        await tripService.verifyPickupOtp((activeTrip as any).id || (activeTrip as any)._id, pickupOtp);
        setPickupOtp('');
        setPickupOtpModalVisible(false);
        // Start ride
        openMaps((activeTrip as any).dropoff_lat, (activeTrip as any).dropoff_lng);
        setActiveTrip({ ...(activeTrip as any), status: 'in_progress' as any });
        if (userLoc && (activeTrip as any).delivery) {
          const poly = await getRoutePolyline(userLoc, { lat: (activeTrip as any).delivery.lat, lng: (activeTrip as any).delivery.lng });
          setRouteCoords(poly.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })));
        }
      }
    } catch {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  const handleEndTrip = async () => {
    if (!dropOtp.trim() || dropOtp.length !== 4) return Alert.alert('Error', 'Enter 4-digit OTP');
    try {
      if (activeTrip) {
        await tripService.endTrip((activeTrip as any).id || (activeTrip as any)._id, dropOtp);
        setDropOtp('');
        setOtpModalVisible(false);
        setActiveTrip(null);
        setRouteCoords(null);
        fetchTrips();
        Alert.alert('Completed', 'Ride completed successfully');
      }
    } catch {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {activeTrip && (
          <View style={{ padding: 16 }}>
            <Text style={styles.sectionTitle}>Active Ride</Text>
            <TripCard trip={activeTrip} showActions={false} onEnd={() => setOtpModalVisible(true)} onStart={() => openMaps((activeTrip as any).pickup_lat, (activeTrip as any).pickup_lng)} />
            {region && (
              <View style={{ height: 220, borderRadius: 12, overflow: 'hidden', marginTop: 12 }}>
                <MapView style={{ flex: 1 }} initialRegion={region}>
                  {userLoc && <Marker coordinate={{ latitude: userLoc.lat, longitude: userLoc.lng }} title="You" />}
                  {(activeTrip as any).pickup_lat && (
                    <Marker coordinate={{ latitude: (activeTrip as any).pickup_lat, longitude: (activeTrip as any).pickup_lng }} title="Pickup" />
                  )}
                  {(activeTrip as any).dropoff_lat && (
                    <Marker coordinate={{ latitude: (activeTrip as any).dropoff_lat, longitude: (activeTrip as any).dropoff_lng }} title="Dropoff" />
                  )}
                  {routeCoords && <Polyline coordinates={routeCoords} strokeColor="#2563EB" strokeWidth={4} />}
                </MapView>
              </View>
            )}
          </View>
        )}

        <View style={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>Incoming Bike Ride Requests</Text>
          {pendingTrips.length === 0 ? (
            <Text style={styles.emptyText}>No ride requests near you</Text>
          ) : (
            pendingTrips.map((t) => (
              <TripCard key={t.id} trip={t} onAccept={handleAcceptTrip} onReject={() => setPendingTrips((prev) => prev.filter((x) => x.id !== t.id))} />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={pickupOtpModalVisible} onClose={() => setPickupOtpModalVisible(false)} title="Verify Pickup OTP">
        <Text style={styles.helper}>Ask customer for the 4-digit OTP to start ride.</Text>
        <Input label="Pickup OTP" placeholder="1234" keyboardType="number-pad" maxLength={4} value={pickupOtp} onChangeText={setPickupOtp} />
        <Button title="Verify & Start Ride" onPress={handleVerifyPickupOtp} />
      </Modal>

      <Modal visible={otpModalVisible} onClose={() => setOtpModalVisible(false)} title="End Ride">
        <Text style={styles.helper}>Enter 4-digit OTP from customer to complete ride.</Text>
        <Input label="Drop OTP" placeholder="1234" keyboardType="number-pad" maxLength={4} value={dropOtp} onChangeText={setDropOtp} />
        <Button title="Complete Ride" onPress={handleEndTrip} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyText: { color: '#6B7280' },
  helper: { color: '#6B7280', marginBottom: 12 },
});


