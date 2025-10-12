import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { TripCard } from '../../components/TripCard';
import { TripWorkflow } from '../../components/TripWorkflow';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { tripService, getRoutePolyline, getCaptainToPickupRoute, getPickupToDestinationRoute } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { Navigation, Zap, Clock, Bell, X } from 'lucide-react-native';
import type { Trip } from '../../types';
import { getSocket } from '../../../../services/socket';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { captain } = useAuth();
  const mapRef = useRef<MapView | null>(null);
  const socketRef = useRef<any>(null);

  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'pickup' | 'destination'>('pickup');
  const [locationTracking, setLocationTracking] = useState(false);
  const [incomingTrip, setIncomingTrip] = useState<Trip | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [orderPreviewVisible, setOrderPreviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Trip | null>(null);
  const [previewDistanceKm, setPreviewDistanceKm] = useState<number | null>(null);
  const [previewDurationMin, setPreviewDurationMin] = useState<number | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>(
    { visible: false, message: '', type: 'info' }
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(!!captain?.isAvailable);
  const [newTripNotifications, setNewTripNotifications] = useState<Trip[]>([]);

  // Animated values for notifications
  const notificationAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<any>(null);

  const displayCaptain = captain;
  const firstName = displayCaptain?.fullName?.split(' ')[0] || 'Captain';
  const vehicleType = (displayCaptain?.vehicleType || '').toUpperCase();
  const serviceScope = (displayCaptain?.serviceType || '').replace('-', ' ').toUpperCase();
  const rating = displayCaptain?.rating ? Number(displayCaptain.rating).toFixed(1) : '0.0';
  const totalTrips = displayCaptain?.totalTrips || 0;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

  // Animate notification bar
  useEffect(() => {
    if (newTripNotifications.length > 0) {
      Animated.spring(notificationAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    } else {
      Animated.timing(notificationAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [newTripNotifications.length]);

  // Haversine distance
  const haversineKmLocal = useCallback((a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }, []);

  // Filter trips based on vehicle type
  const filterEligibleTrips = useCallback((trips: Trip[]) => {
    if (!displayCaptain) return trips;
    return trips.filter((trip) => trip.vehicleType === displayCaptain.vehicleType);
  }, [displayCaptain]);

  // Get user location and initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required');
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({});
        if (!mounted) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setUserLoc({ lat, lng });
        setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 });

        if (displayCaptain) {
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

            setPendingTrips(filterEligibleTrips(pending || []));
            setActiveTrip(active || null);

            if (active?.pickup && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: active.pickup.lat,
                longitude: active.pickup.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });
            }
          } catch (error) {
            console.warn('Initial fetch error:', error);
            showToast('Failed to load initial trips', 'error');
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn('Location error', err);
        Alert.alert('Error', 'Failed to get current location');
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [displayCaptain]);

  // Socket connection and real-time updates
  useEffect(() => {
    if (!displayCaptain || !userLoc) return;

    // Initialize socket connection
    const socket = getSocket();
    if (!socket) {
      console.warn('Socket not available');
      return;
    }

    socketRef.current = socket;

    // Wait for socket to connect
    const setupSocket = () => {
      if (socket.connected) {
        console.log('Socket connected, joining rooms...');
        
        // Join captain-specific room
        socket.emit('captain:join', {
          captainId: displayCaptain.id || displayCaptain._id,
          vehicleType: displayCaptain.vehicleType,
          isAvailable: isAvailable,
        });

        // Emit captain online status
        socket.emit('captain:online', {
          captainId: displayCaptain.id || displayCaptain._id,
          location: userLoc,
          vehicleType: displayCaptain.vehicleType,
          isAvailable: isAvailable,
        });
      } else {
        console.log('Socket not connected, waiting...');
        setTimeout(setupSocket, 1000);
      }
    };

    setupSocket();

    // Handle new trip requests
    const handleNewTrip = (trip: Trip) => {
      console.log('New trip received:', trip);
      console.log('Captain vehicle type:', displayCaptain.vehicleType);
      console.log('Trip vehicle type:', trip.vehicleType);
      console.log('Captain available:', isAvailable);
      
      // Check if captain is available and trip matches vehicle type
      if (!isAvailable) {
        console.log('Captain not available');
        return;
      }

      if (trip.vehicleType !== displayCaptain.vehicleType) {
        console.log('Vehicle type mismatch:', trip.vehicleType, 'vs', displayCaptain.vehicleType);
        return;
      }

      // Check distance (only show trips within 15km)
      const dist = haversineKmLocal(userLoc, trip.pickup);
      if (dist > 15) {
        console.log('Trip too far:', dist);
        return;
      }

      console.log('Trip accepted for display');

      // Add to notifications with animation
      setNewTripNotifications((prev) => {
        const exists = prev.some((t) => t.id === trip.id || t._id === trip._id);
        if (exists) return prev;
        
        // Animate notification bar
        Animated.spring(notificationAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        
        return [...prev, trip];
      });

      // Show incoming trip modal
      setIncomingTrip(trip);
      
      // Add to pending trips if not already exists
      setPendingTrips((prev) => {
        const exists = prev.some((t) => t.id === trip.id || t._id === trip._id);
        if (exists) return prev;
        return [trip, ...prev];
      });

      // Play notification sound (you can implement this)
      showToast(`New trip request! 💰 ₹${trip.fareEstimate || trip.fare}`, 'info');
    };

    // Handle trip updates
    const handleTripUpdate = (payload: any) => {
      console.log('Trip update received:', payload);
      
      // Update active trip if it matches
      setActiveTrip((prev) => {
        if (prev && (prev.id === payload.id || prev._id === payload._id)) {
          return { ...prev, ...payload };
        }
        return prev;
      });

      // Update pending trips
      setPendingTrips((prev) => {
        // Remove if accepted by another captain or cancelled
        if (payload.status === 'accepted' || payload.status === 'cancelled') {
          return prev.filter((t) => t.id !== payload.id && t._id !== payload._id);
        }
        // Update trip data
        return prev.map((t) => 
          (t.id === payload.id || t._id === payload._id) 
            ? { ...t, ...payload } 
            : t
        );
      });

      // Remove from notifications if cancelled or accepted
      if (payload.status === 'accepted' || payload.status === 'cancelled') {
        setNewTripNotifications((prev) => 
          prev.filter((t) => t.id !== payload.id && t._id !== payload._id)
        );
      }
    };

    // Handle trip completion
    const handleTripCompleted = (payload: any) => {
      console.log('Trip completed:', payload);
      if (activeTrip && (activeTrip.id === payload.id || activeTrip._id === payload._id)) {
        setActiveTrip(null);
        setRouteCoords(null);
        showToast('Trip completed successfully! 🎉', 'success');
      }
    };

    // Handle trip cancelled
    const handleTripCancelled = (payload: any) => {
      console.log('Trip cancelled:', payload);
      
      // Remove from pending trips
      setPendingTrips((prev) => 
        prev.filter((t) => t.id !== payload.id && t._id !== payload._id)
      );
      
      // Remove from notifications
      setNewTripNotifications((prev) => 
        prev.filter((t) => t.id !== payload.id && t._id !== payload._id)
      );
      
      // Clear active trip if it was cancelled
      if (activeTrip && (activeTrip.id === payload.id || activeTrip._id === payload._id)) {
        setActiveTrip(null);
        setRouteCoords(null);
        showToast('Trip was cancelled', 'warning');
      }
    };

    // Socket connection events
    socket.on('connect', () => {
      console.log('Socket connected!');
      // Re-join rooms when reconnected
      socket.emit('captain:join', {
        captainId: displayCaptain.id || displayCaptain._id,
        vehicleType: displayCaptain.vehicleType,
        isAvailable: isAvailable,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });

    // Socket event listeners
    socket.on('new-trip', handleNewTrip);
    socket.on('trip:new', handleNewTrip); // Alternative event name
    socket.on('trip:update', handleTripUpdate);
    socket.on('trip:updated', handleTripUpdate);
    socket.on('trip:completed', handleTripCompleted);
    socket.on('trip:cancelled', handleTripCancelled);
    socket.on('order:update', handleTripUpdate);

    // Debug: Listen to all events
    socket.onAny((eventName: any, ...args: any[]) => {
      console.log('Socket event received:', eventName, args);
    });

    // Send heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('captain:heartbeat', {
          captainId: displayCaptain.id || displayCaptain._id,
          location: userLoc,
          isAvailable: isAvailable,
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
      try {
        socket.off('new-trip', handleNewTrip);
        socket.off('trip:new', handleNewTrip);
        socket.off('trip:update', handleTripUpdate);
        socket.off('trip:updated', handleTripUpdate);
        socket.off('trip:completed', handleTripCompleted);
        socket.off('trip:cancelled', handleTripCancelled);
        socket.off('order:update', handleTripUpdate);
        
        // Emit offline status
        socket.emit('captain:offline', {
          captainId: displayCaptain.id || displayCaptain._id,
        });
      } catch (e) {
        console.warn('Socket cleanup error', e);
      }
    };
  }, [displayCaptain, userLoc, isAvailable, activeTrip]);

  // Update availability status via socket
  useEffect(() => {
    if (!displayCaptain || !socketRef.current) return;
    
    socketRef.current.emit('captain:availability', {
      captainId: displayCaptain.id || displayCaptain._id,
      isAvailable: isAvailable,
    });
  }, [isAvailable, displayCaptain]);

  // Location tracking effect
  useEffect(() => {
    if (!locationTracking) return;
    
    const interval = setInterval(async () => {
      try {
        const position = await Location.getCurrentPositionAsync({});
        const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        
        // Update user location
        setUserLoc(newLocation);
        
        // Update route if we have an active trip
        if (activeTrip && currentPhase === 'pickup') {
          try {
            const poly = await getCaptainToPickupRoute(newLocation, { lat: activeTrip.pickup.lat, lng: activeTrip.pickup.lng });
            setRouteCoords(poly.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })));
          } catch (error) {
            console.warn('Route update failed:', error);
          }
        } else if (activeTrip && currentPhase === 'destination') {
          try {
            const destination = activeTrip.destination || activeTrip.delivery;
            if (destination) {
              const poly = await getPickupToDestinationRoute(
                { lat: activeTrip.pickup.lat, lng: activeTrip.pickup.lng },
                { lat: destination.lat, lng: destination.lng }
              );
              setRouteCoords(poly.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })));
            }
          } catch (error) {
            console.warn('Route update failed:', error);
          }
        }
      } catch (error) {
        console.warn('Location tracking error:', error);
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [locationTracking, activeTrip, currentPhase]);

  // Manual refresh
  const refreshTrips = useCallback(async () => {
    if (!displayCaptain || !userLoc) return;

    setRefreshing(true);
    try {
      const [pending, active] = await Promise.all([
        tripService.getPendingRequests(userLoc.lat, userLoc.lng, {
          vehicleType: displayCaptain.vehicleType,
          serviceType: displayCaptain.serviceType,
          vehicleSubType: displayCaptain.vehicleSubType,
        }),
        tripService.getActiveTrip(),
      ]);

      setPendingTrips(filterEligibleTrips(pending || []));
      setActiveTrip(active || null);

      if (active?.pickup && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: active.pickup.lat,
          longitude: active.pickup.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      showToast('Trips refreshed successfully', 'success');
    } catch (error) {
      console.warn('Refresh error:', error);
      showToast('Failed to refresh trips', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [displayCaptain, userLoc, filterEligibleTrips, showToast]);

  const onRefresh = useCallback(() => {
    refreshTrips();
  }, [refreshTrips]);

  // Accept trip - Phase 1: Captain to Pickup
  const handleAcceptTrip = useCallback(async (tripId: string) => {
    if (!tripId) return;
    try {
      setLoading(true);
      const trip = await tripService.acceptTrip(tripId);
      setActiveTrip(trip);
      setPendingTrips((prev) => prev.filter((t) => t.id !== tripId && t._id !== tripId));
      setNewTripNotifications((prev) => prev.filter((t) => t.id !== tripId && t._id !== tripId));

      // Phase 1: Calculate route from captain's current location to pickup point
      if (trip.pickup && userLoc) {
        try {
          setCurrentPhase('pickup');
          const poly = await getCaptainToPickupRoute(userLoc, { lat: trip.pickup.lat, lng: trip.pickup.lng });
          setRouteCoords(poly.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })));
          
          // Animate map to show the route
          if (mapRef.current) {
            const bounds = [
              { latitude: userLoc.lat, longitude: userLoc.lng },
              { latitude: trip.pickup.lat, longitude: trip.pickup.lng }
            ];
            
            mapRef.current.fitToCoordinates(bounds, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }

          // Start location tracking for real-time updates
          setLocationTracking(true);

          // Open external maps for navigation to pickup
          setTimeout(() => {
            openMaps(trip.pickup.lat, trip.pickup.lng);
          }, 1000);
        } catch (routeError) {
          console.warn('Route calculation failed:', routeError);
          // Don't fail the trip acceptance if route calculation fails
        }
      }

      showToast('Trip accepted! Navigate to pickup point 🎯', 'success');
    } catch (error: any) {
      console.warn('Accept error', error);
      showToast(error?.response?.data?.message || 'Failed to accept trip', 'error');
    } finally {
      setLoading(false);
    }
  }, [userLoc, showToast]);

  // Reject trip
  const handleRejectTrip = useCallback(async () => {
    if (!rejectReason.trim()) return Alert.alert('Error', 'Please provide a reason');
    try {
      await tripService.rejectTrip(selectedTripId, rejectReason.trim());
      setPendingTrips((prev) => prev.filter((t) => t.id !== selectedTripId && t._id !== selectedTripId));
      setNewTripNotifications((prev) => prev.filter((t) => t.id !== selectedTripId && t._id !== selectedTripId));
      setRejectModalVisible(false);
      setRejectReason('');
      showToast('Trip rejected', 'info');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to reject trip');
    }
  }, [rejectReason, selectedTripId, showToast]);

  // Phase 2: Start trip - Switch to pickup to destination route
  const handleStartTrip = useCallback(async (tripId: string) => {
    try {
      await tripService.startTrip(tripId);
      const updatedTrip = await tripService.getActiveTrip();
      setActiveTrip(updatedTrip);
      
      // Phase 2: Switch to pickup to destination route
      if (updatedTrip && (updatedTrip.destination || updatedTrip.delivery)) {
        try {
          setCurrentPhase('destination');
          const destination = updatedTrip.destination || updatedTrip.delivery;
          if (destination) {
            const poly = await getPickupToDestinationRoute(
              { lat: updatedTrip.pickup.lat, lng: updatedTrip.pickup.lng },
              { lat: destination.lat, lng: destination.lng }
            );
            setRouteCoords(poly.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })));
            
            // Animate map to show the new route
            if (mapRef.current) {
              const bounds = [
                { latitude: updatedTrip.pickup.lat, longitude: updatedTrip.pickup.lng },
                { latitude: destination.lat, longitude: destination.lng }
              ];
              
              mapRef.current.fitToCoordinates(bounds, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }

            // Open external maps for navigation to destination
            setTimeout(() => {
              openMaps(destination.lat, destination.lng);
            }, 1000);
          }
        } catch (routeError) {
          console.warn('Phase 2 route calculation failed:', routeError);
        }
      }
      
      showToast('Trip started! Navigate to destination 🚀', 'success');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to start trip');
    }
  }, [showToast]);

  const handleEndTrip = useCallback(async (tripId: string) => {
    try {
      await tripService.reachDestination(tripId);
      showToast('Trip completed successfully', 'success');
      setActiveTrip(null);
      setRouteCoords(null);
      setLocationTracking(false);
      setCurrentPhase('pickup');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to complete trip');
    }
  }, [showToast]);

  const openMaps = useCallback((lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    })!;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open maps'));
  }, []);

  // Animated pulse for incoming trip
  useEffect(() => {
    if (!incomingTrip) {
      pulseLoopRef.current && pulseLoopRef.current.stop && pulseLoopRef.current.stop();
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => loop.stop();
  }, [incomingTrip, pulseAnim]);

  const pendingCount = pendingTrips.length;

  const markers = useMemo(() => {
    return pendingTrips.map((o) => (
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
    ));
  }, [pendingTrips, userLoc]);

  return (
    <View style={styles.container}>
      {/* Notification Bar for New Trips */}
      <Animated.View 
        style={[
          styles.notificationBar,
          { transform: [{ translateY: notificationAnim }] }
        ]}
      >
        <View style={styles.notificationContent}>
          <Bell size={20} color="#FFF" />
          <Text style={styles.notificationText}>
            {newTripNotifications.length} new trip{newTripNotifications.length !== 1 ? 's' : ''} available!
          </Text>
          <TouchableOpacity 
            onPress={() => setNewTripNotifications([])}
            style={styles.notificationClose}
          >
            <X size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.serviceInfo}>{vehicleType} • {serviceScope}</Text>
            <Text style={styles.serviceInfo}>⭐ {rating} | {totalTrips} trips</Text>

            {/* Availability toggle */}
            <View style={styles.availabilityToggle}>
              <Text style={styles.availabilityLabel}>{isAvailable ? 'Available' : 'Offline'}</Text>
              <Button
                title={isAvailable ? 'Go Offline' : 'Go Online'}
                onPress={() => { 
                  setIsAvailable((s) => !s); 
                  showToast(isAvailable ? 'You are now offline' : 'You are now online', 'info'); 
                }}
                variant={isAvailable ? 'danger' : 'primary'}
              />
            </View>

            {/* Debug: Test Socket Connection */}
            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>Socket: {socketRef.current?.connected ? 'Connected' : 'Disconnected'}</Text>
              <Text style={styles.debugText}>Vehicle: {displayCaptain?.vehicleType}</Text>
              <Text style={styles.debugText}>Available: {isAvailable ? 'Yes' : 'No'}</Text>
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => {
                  if (socketRef.current) {
                    console.log('Testing socket connection...');
                    socketRef.current.emit('test', { message: 'Hello from captain!' });
                    showToast('Test message sent to socket', 'info');
                  }
                }}
              >
                <Text style={styles.testButtonText}>Test Socket</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: '#10B981', marginTop: 8 }]}
                onPress={async () => {
                  try {
                    const response = await fetch('http://172.20.49.88:5000/test/transport', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ vehicleType: displayCaptain?.vehicleType || 'truck' })
                    });
                    const data = await response.json();
                    console.log('Test transport created:', data);
                    showToast('Test transport request sent!', 'success');
                  } catch (error) {
                    console.error('Test transport error:', error);
                    showToast('Failed to send test request', 'error');
                  }
                }}
              >
                <Text style={styles.testButtonText}>Send Test Trip</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <Zap size={20} color="#10B981" />
              <View>
                <Text style={styles.quickStatValue}>{pendingCount}</Text>
                <Text style={styles.quickStatLabel}>New Requests</Text>
              </View>
            </View>

            <View style={styles.quickStatCard}>
              <Clock size={20} color="#3B82F6" />
              <View>
                <Text style={styles.quickStatValue}>{activeTrip ? '1' : '0'}</Text>
                <Text style={styles.quickStatLabel}>Active Trip</Text>
              </View>
            </View>
          </View>

          {/* Active Trip */}
          {activeTrip && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Trip</Text>
              <TripCard
                trip={activeTrip}
                onStart={() => handleStartTrip(activeTrip.id || activeTrip._id || '')}
                onEnd={() => handleEndTrip(activeTrip.id || activeTrip._id || '')}
              />

              <TripWorkflow
                trip={activeTrip}
                onTripComplete={() => { 
                  setActiveTrip(null); 
                  setRouteCoords(null); 
                  setLocationTracking(false);
                  setCurrentPhase('pickup');
                }}
                onTripCancel={() => { 
                  setActiveTrip(null); 
                  setRouteCoords(null); 
                  setLocationTracking(false);
                  setCurrentPhase('pickup');
                }}
                onRouteUpdate={(coordinates) => setRouteCoords(coordinates)}
                onPhaseChange={(phase) => setCurrentPhase(phase)}
              />
            </View>
          )}

          {/* Pending Trips & Map */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Trips ({pendingCount})</Text>
              {newTripNotifications.length > 0 && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            
            {region ? (
              <MapView ref={mapRef} style={styles.map} initialRegion={region} showsUserLocation>
                {userLoc && <Marker coordinate={{ latitude: userLoc.lat, longitude: userLoc.lng }} title="You" />}
                {markers}

                {/* Active trip route and markers */}
                {activeTrip && (
                  <>
                    {/* Captain location marker */}
                    {userLoc && (
                      <Marker
                        coordinate={{ latitude: userLoc.lat, longitude: userLoc.lng }}
                        title="Your Location"
                        description="Current position"
                      >
                        <View style={styles.captainMarker}>
                          <Text style={styles.markerText}>C</Text>
                        </View>
                      </Marker>
                    )}

                    {/* Pickup marker */}
                    <Marker
                      coordinate={{ latitude: activeTrip.pickup.lat, longitude: activeTrip.pickup.lng }}
                      title="Pickup Location"
                      description="Customer pickup point"
                    >
                      <View style={styles.pickupMarker}>
                        <Text style={styles.markerText}>P</Text>
                      </View>
                    </Marker>

                    {/* Destination marker */}
                    {(activeTrip.destination || activeTrip.delivery) && (
                      <Marker
                        coordinate={{ 
                          latitude: (activeTrip.destination || activeTrip.delivery)!.lat, 
                          longitude: (activeTrip.destination || activeTrip.delivery)!.lng 
                        }}
                        title="Destination"
                        description="Customer destination"
                      >
                        <View style={styles.destinationMarker}>
                          <Text style={styles.markerText}>D</Text>
                        </View>
                      </Marker>
                    )}

                    {/* Route polyline */}
                    {routeCoords && (
                      <Polyline 
                        coordinates={routeCoords} 
                        strokeWidth={4} 
                        strokeColor={currentPhase === 'pickup' ? '#10B981' : '#3B82F6'}
                        strokeColors={[currentPhase === 'pickup' ? '#10B981' : '#3B82F6']}
                      />
                    )}
                  </>
                )}

                {/* Regular route for pending trips */}
                {!activeTrip && routeCoords && (
                  <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#3B82F6" />
                )}

                {incomingTrip && (
                    <Marker
                    coordinate={{ latitude: incomingTrip.pickup.lat, longitude: incomingTrip.pickup.lng }}
                    title={`New: ₹${incomingTrip.fareEstimate || incomingTrip.fare}`}
                  >
                    <Animated.View style={[styles.pulseMarker, { transform: [{ scale: pulseAnim }] }]}>
                      <View style={styles.pulseMarkerInner} />
                    </Animated.View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text>No location available</Text>
              </View>
            )}

            {pendingTrips.length === 0 && (
              <View style={styles.emptyState}>
                <Navigation size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No pending requests</Text>
                <Text style={styles.emptySubtext}>
                  {isAvailable 
                    ? "New requests will appear automatically when available" 
                    : "Go online to receive new requests"}
                </Text>
              </View>
            )}

            {pendingTrips.map((trip) => (
              <TripCard
                key={trip.id || trip._id}
                trip={trip}
                onAccept={() => handleAcceptTrip(trip.id || trip._id || '')}
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
        <Text style={styles.modalText}>Order #{selectedOrder?.id || selectedOrder?._id}</Text>
        <Text style={styles.modalText}>Distance: {previewDistanceKm?.toFixed(1) ?? '-'} km</Text>
        <Text style={styles.modalText}>ETA: {previewDurationMin ? Math.round(previewDurationMin) : '-' } min</Text>
        <Text style={styles.modalText}>Fare: ₹{selectedOrder?.fareEstimate || selectedOrder?.fare}</Text>
        <View style={styles.modalActions}>
          <Button title="Ignore" onPress={() => setOrderPreviewVisible(false)} variant="secondary" />
          <Button title="Accept" onPress={() => { 
            setOrderPreviewVisible(false); 
            handleAcceptTrip(selectedOrder!.id || selectedOrder!._id || ''); 
          }} />
        </View>
      </Modal>

      {/* Incoming Trip Modal */}
      <Modal visible={!!incomingTrip} onClose={() => setIncomingTrip(null)}>
        <View style={styles.incomingTripModal}>
          <Text style={styles.modalTitle}>🎉 New Trip Request!</Text>
          <View style={styles.tripDetails}>
            <Text style={styles.tripDetailLabel}>Pickup:</Text>
            <Text style={styles.tripDetailValue}>{incomingTrip?.pickup.address}</Text>
          </View>
          <View style={styles.tripDetails}>
            <Text style={styles.tripDetailLabel}>Destination:</Text>
            <Text style={styles.tripDetailValue}>
              {incomingTrip?.destination?.address || incomingTrip?.delivery?.address}
            </Text>
          </View>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareValue}>₹{incomingTrip?.fareEstimate || incomingTrip?.fare}</Text>
          </View>
          <View style={styles.modalButtonContainer}>
              <TouchableOpacity
              style={[styles.modalBtn, styles.acceptBtn]}
                onPress={async () => {
                await handleAcceptTrip(incomingTrip!.id || incomingTrip!._id || '');
                  setIncomingTrip(null);
                }}
              >
              <Text style={styles.modalBtnText}>Accept Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={[styles.modalBtn, styles.declineBtn]}
                onPress={() => setIncomingTrip(null)}
              >
              <Text style={styles.modalBtnText}>Decline</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  notificationBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#10B981',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  notificationClose: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  availabilityToggle: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  debugSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  testButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  map: {
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
  },
  mapPlaceholder: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 16,
  },
  pulseMarker: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 24,
  },
  pulseMarkerInner: {
    width: 12,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  captainMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  incomingTripModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#111827',
  },
  tripDetails: {
    marginBottom: 16,
  },
  tripDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  tripDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  fareContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 12,
    color: '#16A34A',
    marginBottom: 4,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#16A34A',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});