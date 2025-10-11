import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { TripCard } from '../../components/TripCard';
import { TripWorkflow } from '../../components/TripWorkflow';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { tripService, getRoutePolyline } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { Navigation, Zap, Clock } from 'lucide-react-native';
import type { Trip } from '../../types';
import { getSocket } from '../../../../services/socket';

export default function HomeScreen() {
  const { captain } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [incomingTrip, setIncomingTrip] = useState<Trip | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [orderPreviewVisible, setOrderPreviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Trip | null>(null);
  const [previewDistanceKm, setPreviewDistanceKm] = useState<number | null>(null);
  const [previewDurationMin, setPreviewDurationMin] = useState<number | null>(null);

  const pulseAnim = useState(new Animated.Value(1))[0];

  const displayCaptain = captain;
  const firstName = displayCaptain?.fullName?.split(' ')[0] || 'Captain';
  const vehicleType = displayCaptain?.vehicleType?.toUpperCase() || '';
  const serviceScope = displayCaptain?.serviceType?.replace('-', ' ').toUpperCase() || '';
  const rating = displayCaptain?.rating?.toFixed(1) || '0';
  const totalTrips = displayCaptain?.totalTrips || 0;

  // Haversine distance
  const haversineKmLocal = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // Filter trips based on vehicle type
  const filterEligibleTrips = (trips: Trip[]) => {
    if (!displayCaptain) return trips;
    return trips.filter((trip) => trip.vehicleType === displayCaptain.vehicleType);
  };

  // Centralized fetch
  const loadTrips = useCallback(
    async (lat?: number, lng?: number) => {
      if (!displayCaptain || !lat || !lng) return;

      setLoading(true);
      try {
        const [pending, active] = await Promise.all([
          tripService.getPendingRequests(lat, lng, {
            vehicleType: displayCaptain.vehicleType,
            serviceType: displayCaptain.serviceType,
            vehicleSubType: displayCaptain.vehicleSubType,
          }),
          tripService.getActiveTrip(),
        ]);

        setPendingTrips(filterEligibleTrips(pending));
        setActiveTrip(active);

        if (active?.pickup && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: active.pickup.lat,
            longitude: active.pickup.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } catch (error) {
        console.log('Fetch trips error:', error);
        Alert.alert('Error', 'Failed to fetch trips.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [displayCaptain]
  );

  // Get user location once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'Location permission is required');

      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setUserLoc({ lat, lng });
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 });

      loadTrips(lat, lng);
    })();
  }, [loadTrips]);

  // Real-time socket
  useEffect(() => {
    if (!displayCaptain || !userLoc) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewTrip = (trip: Trip) => {
      if (!displayCaptain.isAvailable || trip.vehicleType !== displayCaptain.vehicleType) return;

      const dist = haversineKmLocal(userLoc, trip.pickup);
      if (dist > 10) return;

      setIncomingTrip(trip);

      setPendingTrips((prev) => {
        const exists = prev.some((t) => t.id === trip.id || t._id === trip._id);
        if (exists) return prev;
        return filterEligibleTrips([trip, ...prev]);
      });
    };

    socket.on('new-trip', handleNewTrip);
    socket.on('order:update', (payload: any) => {
      setActiveTrip((prev) =>
        prev && (prev.id === payload.id || prev._id === payload._id)
          ? { ...prev, status: payload.status }
          : prev
      );
      setPendingTrips((prev) =>
        prev.map((t) =>
          t.id === payload.id || t._id === payload._id ? { ...t, status: payload.status } : t
        )
      );
    });

    return () => {
      socket.off('new-trip', handleNewTrip);
      socket.disconnect();
    };
  }, [displayCaptain, userLoc]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userLoc) loadTrips(userLoc.lat, userLoc.lng);
  }, [userLoc, loadTrips]);

  const handleAcceptTrip = async (tripId: string) => {
    try {
      const trip = await tripService.acceptTrip(tripId);
      console.log('Trip accepted:', trip);
      setActiveTrip(trip);
      setPendingTrips((prev) => prev.filter((t) => t.id !== tripId && t._id !== tripId));

      if (userLoc && trip.pickup) {
        const poly = await getRoutePolyline(userLoc, { lat: trip.pickup.lat, lng: trip.pickup.lng });
        setRouteCoords(poly.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })));
      }

      Alert.alert('Success', 'Trip accepted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept trip');
    }
  };

  const handleRejectTrip = async () => {
    if (!rejectReason.trim()) return Alert.alert('Error', 'Please provide a reason');
    try {
      await tripService.rejectTrip(selectedTripId, rejectReason);
      setPendingTrips((prev) => prev.filter((t) => t.id !== selectedTripId && t._id !== selectedTripId));
      setRejectModalVisible(false);
      setRejectReason('');
      Alert.alert('Success', 'Trip rejected');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject trip');
    }
  };

  const handleStartTrip = async (tripId: string) => {
    try {
      await tripService.startTrip(tripId);
      // Refresh the active trip to get updated status
      const updatedTrip = await tripService.getActiveTrip();
      setActiveTrip(updatedTrip);
      Alert.alert('Success', 'Trip started successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start trip');
    }
  };

  const handleEndTrip = async (tripId: string) => {
    try {
      // First mark as reached destination to get OTP
      await tripService.reachDestination(tripId);
      Alert.alert('Success', 'Trip completed successfully');
      setActiveTrip(null);
      setRouteCoords(null);
      loadTrips(userLoc?.lat, userLoc?.lng);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete trip');
    }
  };

  const openMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    })!;
    Linking.openURL(url);
  };

  // Animated pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text>{vehicleType} • {serviceScope}</Text>
            <Text>⭐ {rating} | {totalTrips} trips</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <Zap size={20} color="#10B981" />
              <Text>{pendingTrips.length}</Text>
              <Text>New Requests</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Clock size={20} color="#2563EB" />
              <Text>{activeTrip ? '1' : '0'}</Text>
              <Text>Active Trip</Text>
            </View>
          </View>

          {/* Active Trip */}
          {activeTrip && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Trip</Text>
              <TripCard 
                trip={activeTrip} 
                onStart={handleStartTrip}
                onEnd={handleEndTrip}
              />
              <TripWorkflow
                trip={activeTrip}
                onTripComplete={() => { setActiveTrip(null); setRouteCoords(null); loadTrips(userLoc?.lat, userLoc?.lng); }}
                onTripCancel={() => { setActiveTrip(null); setRouteCoords(null); loadTrips(userLoc?.lat, userLoc?.lng); }}
              />
            </View>
          )}

          {/* Pending Trips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incoming Requests ({pendingTrips.length})</Text>
            {region && (
              <MapView ref={mapRef} style={{ height: 260 }} initialRegion={region}>
                {userLoc && <Marker coordinate={{ latitude: userLoc.lat, longitude: userLoc.lng }} title="You" />}
                {pendingTrips.map((o) => (
                  <Marker
                    key={o.id || o._id}
                    coordinate={{ latitude: o.pickup.lat, longitude: o.pickup.lng }}
                    title={`₹${o.fareEstimate || o.fare}`}
                    description={`${(o.distanceKm || 0).toFixed(1)} km away`}
                    onPress={async () => {
                      setSelectedOrder(o);
                      if (userLoc) {
                        const poly = await getRoutePolyline(userLoc, { lat: o.pickup.lat, lng: o.pickup.lng });
                        setPreviewDistanceKm(poly.distance / 1000);
                        setPreviewDurationMin(poly.duration / 60);
                      }
                      setOrderPreviewVisible(true);
                    }}
                  />
                ))}
                {routeCoords && <Polyline coordinates={routeCoords} strokeColor="#2563EB" strokeWidth={4} />}
              </MapView>
            )}

            {pendingTrips.length === 0 && (
              <View style={styles.emptyState}>
                <Navigation size={48} color="#D1D5DB" />
                <Text>No pending requests</Text>
              </View>
            )}

            {pendingTrips.map((trip) => (
              <TripCard
                key={trip.id || trip._id}
                trip={trip}
                onAccept={handleAcceptTrip}
                onReject={(id) => { setSelectedTripId(id); setRejectModalVisible(true); }}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {/* Modals */}
      <Modal visible={rejectModalVisible} onClose={() => setRejectModalVisible(false)} title="Reject Trip">
        <Input label="Reason" value={rejectReason} onChangeText={setRejectReason} multiline numberOfLines={4} />
        <Button title="Submit" onPress={handleRejectTrip} />
      </Modal>

      <Modal visible={orderPreviewVisible} onClose={() => setOrderPreviewVisible(false)} title="Order Details">
        <Text>Order #{selectedOrder?.id || selectedOrder?._id}</Text>
        <Text>Distance: {previewDistanceKm?.toFixed(1)} km</Text>
        <Text>ETA: {previewDurationMin ? Math.round(previewDurationMin) : '-'} min</Text>
        <Text>Fare: ₹{selectedOrder?.fareEstimate || selectedOrder?.fare}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Button title="Ignore" onPress={() => setOrderPreviewVisible(false)} variant="secondary" />
          <Button title="Accept" onPress={() => { setOrderPreviewVisible(false); handleAcceptTrip(selectedOrder!.id || selectedOrder!._id || ''); }} />
        </View>
      </Modal>

      <Modal visible={!!incomingTrip} onClose={() => setIncomingTrip(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Trip Available!</Text>
            <Text>Pickup: {incomingTrip?.pickup.address}</Text>
            <Text>Destination: {incomingTrip?.destination?.address || incomingTrip?.delivery?.address}</Text>
            <Text>Fare: ₹{incomingTrip?.fare}</Text>
            <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#10B981' }]}
                onPress={async () => {
                  await handleAcceptTrip(incomingTrip!.id || incomingTrip!._id || '');
                  setIncomingTrip(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => setIncomingTrip(null)}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },

  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  serviceInfo: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tripActions: {
    marginTop: 16,
    gap: 12,
  },
  navigateButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    width: '100%',
  },
  reachedButton: {
    width: '100%',
    marginTop: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  otpInstruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  stickyControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
});
