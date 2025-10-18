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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { TripCard } from '../../components/TripCard';
import { TripWorkflow } from '../../components/TripWorkflow';
import { MapInterface } from '../../components/MapInterface';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { tripService, getRoutePolyline } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import type { Trip } from '../../types';
import { getSocket } from '../../../../services/socket';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { captain } = useAuth();
  const router = useRouter();
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
  const [mapInterfaceVisible, setMapInterfaceVisible] = useState(false);

  const pulseAnim = useState(new Animated.Value(1))[0];
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [bounceAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));

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
    // Initialize enhanced animations for smoother UX
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start shimmer effect for loading states
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

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

  const handleMenuPress = () => {
    Alert.alert(
      'Menu',
      'Captain Menu',
      [
        { text: 'Profile', onPress: () => router.push('/captain/app/(captabs)/profile') },
        { text: 'Earnings', onPress: () => router.push('/captain/app/(captabs)/earnings') },
        { text: 'Wallet', onPress: () => router.push('/captain/app/(captabs)/transfer-earnings') },
        { text: 'Help', onPress: () => Alert.alert('Help', 'Help feature coming soon!') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Notifications',
      'You have no new notifications',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleAcceptTrip = async (tripId: string) => {
    try {
      setLoading(true);
      const trip = await tripService.acceptTrip(tripId);
      console.log('Trip accepted:', trip);
      setActiveTrip(trip);
      setPendingTrips((prev) => prev.filter((t) => t.id !== tripId && t._id !== tripId));

      if (userLoc && trip.pickup) {
        const poly = await getRoutePolyline(userLoc, { lat: trip.pickup.lat, lng: trip.pickup.lng });
        setRouteCoords(poly.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })));
      }

      // Show success animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert('Success', 'Trip accepted successfully! 🎉');
    } catch (error: any) {
      console.error('Accept trip error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept trip');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTrip = async () => {
    if (!rejectReason.trim()) return Alert.alert('Error', 'Please provide a reason');
    try {
      setLoading(true);
      await tripService.rejectTrip(selectedTripId, rejectReason);
      
      setPendingTrips((prev) => prev.filter((t) => t.id !== selectedTripId && t._id !== selectedTripId));
      setRejectModalVisible(false);
      setRejectReason('');
      setSelectedTripId('');

      Alert.alert('Trip Rejected', 'Trip has been rejected successfully');
    } catch (error: any) {
      console.error('Reject trip error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject trip');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async (tripId: string) => {
    try {
      setLoading(true);
      await tripService.startTrip(tripId);
      
      // Refresh the active trip to get updated status
      const updatedTrip = await tripService.getActiveTrip();
      setActiveTrip(updatedTrip);
      
      // Show map interface after trip starts
      setMapInterfaceVisible(true);
      
      // Success animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      Alert.alert('Trip Started', 'Your trip has started! Navigate to pickup location. 🚗');
    } catch (error: any) {
      console.error('Start trip error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async (tripId: string) => {
    try {
      setLoading(true);
      // First mark as reached destination to get OTP
      await tripService.reachDestination(tripId);
      
      // Success animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      Alert.alert('Trip Completed', 'Trip completed successfully! 🎉');
      setActiveTrip(null);
      setRouteCoords(null);
      setMapInterfaceVisible(false);
      loadTrips(userLoc?.lat, userLoc?.lng);
    } catch (error: any) {
      console.error('End trip error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete trip');
    } finally {
      setLoading(false);
    }
  };

  const handleMapTripComplete = () => {
    setActiveTrip(null);
    setRouteCoords(null);
    setMapInterfaceVisible(false);
    loadTrips(userLoc?.lat, userLoc?.lng);
  };

  const handleMapTripCancel = () => {
    setActiveTrip(null);
    setRouteCoords(null);
    setMapInterfaceVisible(false);
    loadTrips(userLoc?.lat, userLoc?.lng);
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FF6B35" />
      
      {/* Background with decorative elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      {loading ? (
        <Animated.View 
          style={[
            styles.centerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>
      ) : (
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
                <Ionicons name="menu" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
                <Ionicons name="notifications" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subtitle}>{vehicleType} • {serviceScope}</Text>
            <Text style={styles.ratingText}>⭐ {rating} | {totalTrips} trips</Text>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View
            style={[
              styles.quickStats,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.View 
              style={[
                styles.quickStatCard,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -2]
                    })}
                  ],
                },
              ]}
            >
              <Animated.View 
                style={[
                  styles.quickStatIcon,
                  {
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <Ionicons name="flash" size={20} color="#FF6B35" />
              </Animated.View>
              <Animated.Text 
                style={[
                  styles.quickStatValue,
                  {
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }
                ]}
              >
                {pendingTrips.length}
              </Animated.Text>
              <Text style={styles.quickStatLabel}>New Requests</Text>
            </Animated.View>
            <Animated.View 
              style={[
                styles.quickStatCard,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -2]
                    })}
                  ],
                },
              ]}
            >
              <Animated.View 
                style={[
                  styles.quickStatIcon,
                  {
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <Ionicons name="time" size={20} color="#FF6B35" />
              </Animated.View>
              <Animated.Text 
                style={[
                  styles.quickStatValue,
                  {
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }
                ]}
              >
                {activeTrip ? '1' : '0'}
              </Animated.Text>
              <Text style={styles.quickStatLabel}>Active Trip</Text>
            </Animated.View>
          </Animated.View>

          {/* Active Trip */}
          {activeTrip && (
            <Animated.View 
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
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
                onShowMap={() => setMapInterfaceVisible(true)}
              />
            </Animated.View>
          )}

          {/* Pending Trips */}
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Incoming Requests ({pendingTrips.length})</Text>
            {region && (
              <Animated.View
                style={[
                  styles.mapContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <MapView ref={mapRef} style={styles.map} initialRegion={region}>
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
                  {routeCoords && <Polyline coordinates={routeCoords} strokeColor="#FF6B35" strokeWidth={4} />}
                </MapView>
              </Animated.View>
            )}

            {pendingTrips.length === 0 && (
              <Animated.View 
                style={[
                  styles.emptyState,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Ionicons name="navigate" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No pending requests</Text>
              </Animated.View>
            )}

            {pendingTrips.map((trip, index) => (
              <Animated.View
                key={trip.id || trip._id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                }}
              >
                <TripCard
                  trip={trip}
                  onAccept={handleAcceptTrip}
                  onReject={(id) => { setSelectedTripId(id); setRejectModalVisible(true); }}
                />
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      )}

      {loading && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.loadingSpinner,
                {
                  transform: [
                    { rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })},
                    { scale: bounceAnim }
                  ],
                },
              ]}
            >
              <Ionicons name="refresh" size={32} color="#FF6B35" />
            </Animated.View>
            <Animated.Text 
              style={[
                styles.loadingText,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1]
                  })
                }
              ]}
            >
              Loading...
            </Animated.Text>
            <Text style={styles.loadingMessage}>Processing your request</Text>
          </View>
        </Animated.View>
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
                style={[styles.modalBtn, { backgroundColor: '#FF6B35' }]}
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

      {/* Map Interface */}
      {activeTrip && (
        <MapInterface
          trip={activeTrip}
          visible={mapInterfaceVisible}
          onClose={() => setMapInterfaceVisible(false)}
          onTripComplete={handleMapTripComplete}
          onTripCancel={handleMapTripCancel}
        />
      )}
    </SafeAreaView>
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
    backgroundColor: '#FF6B35',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF8C42',
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: 'absolute',
    top: 200,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF8C42',
    opacity: 0.2,
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C42',
    opacity: 0.25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
    fontWeight: '500',
  },
  ratingText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
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
    marginBottom: 24,
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  mapContainer: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 24,
  },
  loadingMessage: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});
