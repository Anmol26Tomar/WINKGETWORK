import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
<<<<<<< Updated upstream
  Linking,
  Platform,
  Animated,
<<<<<<< HEAD
  SafeAreaView,
  StatusBar,
=======
  Dimensions,
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { TripCard } from '../../components/TripCard';
import { TripWorkflow } from '../../components/TripWorkflow';
import { MapInterface } from '../../components/MapInterface';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { tripService, parcelService, getRoutePolyline, getCaptainToPickupRoute, getPickupToDestinationRoute } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
<<<<<<< HEAD
import { Ionicons } from '@expo/vector-icons';
=======
import { Navigation, Zap, Clock, Bell, X } from 'lucide-react-native';
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
import type { Trip } from '../../types';
import { getSocket } from '../../../../services/socket';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { captain } = useAuth();
<<<<<<< HEAD
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
=======
  const mapRef = useRef<MapView | null>(null);
  const socketRef = useRef<any>(null);
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

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
<<<<<<< HEAD
  const [mapInterfaceVisible, setMapInterfaceVisible] = useState(false);

  const pulseAnim = useState(new Animated.Value(1))[0];
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [bounceAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));
=======
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>(
    { visible: false, message: '', type: 'info' }
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(!!captain?.isAvailable);
  const [newTripNotifications, setNewTripNotifications] = useState<Trip[]>([]);
  const [pendingParcels, setPendingParcels] = useState<any[]>([]);

  // Animated values for notifications
  const notificationAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<any>(null);
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

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
<<<<<<< HEAD
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

=======
    let mounted = true;
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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
=======
} from 'react-native';
import AnimatedView from '../../components/AnimatedView';
import AnimatedCard from '../../components/AnimatedCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { Navigation, Zap, Clock, Bell, MapPin } from 'lucide-react-native';

export default function HomeScreen() {
  const { captain } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
>>>>>>> Stashed changes

  const onRefresh = () => {
    setRefreshing(true);
<<<<<<< Updated upstream
<<<<<<< HEAD
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
=======
    try {
      const [pending, active] = await Promise.all([
        tripService.getPendingRequests(userLoc.lat, userLoc.lng, {
          vehicleType: displayCaptain.vehicleType,
          serviceType: displayCaptain.serviceType,
          vehicleSubType: displayCaptain.vehicleSubType,
        }),
        tripService.getActiveTrip(),
      ]);
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

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

<<<<<<< HEAD
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
=======
      showToast('Trips refreshed successfully', 'success');
    } catch (error) {
      console.warn('Refresh error:', error);
      showToast('Failed to refresh trips', 'error');
    } finally {
      setRefreshing(false);
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
    }
  }, [displayCaptain, userLoc, filterEligibleTrips, showToast]);

  // Fetch pending parcels for truck drivers
  const fetchPendingParcels = useCallback(async () => {
    if (!displayCaptain || displayCaptain.vehicleType !== 'truck' || !userLoc) return;
    try {
      const parcels = await parcelService.getPendingParcels(userLoc.lat, userLoc.lng, 50);
      setPendingParcels(parcels || []);
    } catch (error) {
      console.error('Error fetching pending parcels:', error);
      showToast('Failed to fetch pending parcels', 'error');
    }
  }, [displayCaptain, userLoc, showToast]);

  // Fetch pending parcels when component loads or user location changes
  useEffect(() => {
    if (displayCaptain?.vehicleType === 'truck' && userLoc) {
      fetchPendingParcels();
    }
  }, [displayCaptain, userLoc, fetchPendingParcels]);

  const onRefresh = useCallback(() => {
    refreshTrips();
    fetchPendingParcels();
  }, [refreshTrips, fetchPendingParcels]);

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
          console.log('Phase 1: Calculating route from captain to pickup');
          console.log('Captain location:', userLoc);
          console.log('Pickup location:', trip.pickup);
          
          setCurrentPhase('pickup');
          const poly = await getCaptainToPickupRoute(userLoc, { lat: trip.pickup.lat, lng: trip.pickup.lng });
          console.log('Phase 1 route calculated:', poly);
          
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
            console.log('Opening external maps to pickup location');
            openMaps(trip.pickup.lat, trip.pickup.lng);
          }, 1000);
        } catch (routeError) {
          console.warn('Phase 1 route calculation failed:', routeError);
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
<<<<<<< HEAD
      setLoading(true);
      await tripService.rejectTrip(selectedTripId, rejectReason);
      
=======
      await tripService.rejectTrip(selectedTripId, rejectReason.trim());
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
      setPendingTrips((prev) => prev.filter((t) => t.id !== selectedTripId && t._id !== selectedTripId));
      setNewTripNotifications((prev) => prev.filter((t) => t.id !== selectedTripId && t._id !== selectedTripId));
      setRejectModalVisible(false);
      setRejectReason('');
<<<<<<< HEAD
      setSelectedTripId('');

      Alert.alert('Trip Rejected', 'Trip has been rejected successfully');
    } catch (error: any) {
      console.error('Reject trip error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject trip');
    } finally {
      setLoading(false);
=======
      showToast('Trip rejected', 'info');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to reject trip');
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
    }
  }, [rejectReason, selectedTripId, showToast]);

  // Phase 2: Start trip - Switch to pickup to destination route
  const handleStartTrip = useCallback(async (tripId: string) => {
    try {
      setLoading(true);
      await tripService.startTrip(tripId);
<<<<<<< HEAD
      
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
=======
      const updatedTrip = await tripService.getActiveTrip();
      setActiveTrip(updatedTrip);
      
      // Phase 2: Switch to pickup to destination route
      if (updatedTrip && (updatedTrip.destination || updatedTrip.delivery)) {
        try {
          console.log('Phase 2: Switching to pickup to destination route');
          console.log('Updated trip:', updatedTrip);
          
          setCurrentPhase('destination');
          const destination = updatedTrip.destination || updatedTrip.delivery;
          if (destination) {
            console.log('Destination location:', destination);
            
            const poly = await getPickupToDestinationRoute(
              { lat: updatedTrip.pickup.lat, lng: updatedTrip.pickup.lng },
              { lat: destination.lat, lng: destination.lng }
            );
            console.log('Phase 2 route calculated:', poly);
            
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
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

            // Open external maps for navigation to destination
            setTimeout(() => {
              console.log('Opening external maps to destination location');
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
<<<<<<< HEAD
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
=======
      await tripService.reachDestination(tripId);
      showToast('Trip completed successfully', 'success');
      setActiveTrip(null);
      setRouteCoords(null);
      setLocationTracking(false);
      setCurrentPhase('pickup');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to complete trip');
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
    }
  }, [showToast]);

<<<<<<< HEAD
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
=======
  const openMaps = useCallback((lat: number, lng: number) => {
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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
=======
    setTimeout(() => setRefreshing(false), 1000);
  };

  const displayName = captain?.fullName || captain?.name || 'Captain';
>>>>>>> Stashed changes

  return (
<<<<<<< HEAD
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
=======
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome back, {displayName}</Text>
          <Text style={styles.headerSubtitle}>Ready to start your day?</Text>
        </View>

        {/* Status Card */}
        <AnimatedCard style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <Zap size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.statusTitle}>You're Online</Text>
              <Text style={styles.statusSubtitle}>Ready to accept trips</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.statusButton}>
            <Text style={styles.statusButtonText}>Go Offline</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <AnimatedCard style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={20} color="#FB923C" />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Today's Trips</Text>
          </AnimatedCard>
          
          <AnimatedCard style={styles.statCard}>
            <View style={styles.statIcon}>
              <Navigation size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </AnimatedCard>
        </View>

<<<<<<< Updated upstream
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" />
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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
<<<<<<< HEAD
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
=======
            <Text style={styles.serviceInfo}>{vehicleType} • {serviceScope}</Text>
            <Text style={styles.serviceInfo}>⭐ {rating} | {totalTrips} trips</Text>
=======
        {/* Available Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Trips</Text>
          <AnimatedCard style={styles.emptyState}>
            <MapPin size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No trips available</Text>
            <Text style={styles.emptySubtitle}>We'll notify you when new trips come in</Text>
          </AnimatedCard>
        </View>
>>>>>>> Stashed changes

        

        {/* Notifications */}
        <AnimatedCard style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Bell size={20} color="#FB923C" />
            <Text style={styles.notificationTitle}>Stay Updated</Text>
          </View>
<<<<<<< Updated upstream

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
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

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
                onStart={() => handleStartTrip(activeTrip.id || activeTrip._id || '')}
                onEnd={() => handleEndTrip(activeTrip.id || activeTrip._id || '')}
              />

              <TripWorkflow
                trip={activeTrip}
<<<<<<< HEAD
                onTripComplete={() => { setActiveTrip(null); setRouteCoords(null); loadTrips(userLoc?.lat, userLoc?.lng); }}
                onTripCancel={() => { setActiveTrip(null); setRouteCoords(null); loadTrips(userLoc?.lat, userLoc?.lng); }}
                onShowMap={() => setMapInterfaceVisible(true)}
=======
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
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
              />
            </Animated.View>
          )}

<<<<<<< HEAD
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
=======
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
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
            )}

            {pendingTrips.map((trip, index) => (
              <Animated.View
                key={trip.id || trip._id}
<<<<<<< HEAD
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
=======
                trip={trip}
                onAccept={() => handleAcceptTrip(trip.id || trip._id || '')}
                onReject={(id) => { setSelectedTripId(id); setRejectModalVisible(true); }}
              />
            ))}

            {/* Pending Parcels Section for Truck Drivers */}
            {displayCaptain?.vehicleType === 'truck' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Parcels</Text>
                {pendingParcels.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No pending parcels</Text>
                    <Text style={styles.emptySubtext}>
                      Parcels will appear here when available
                    </Text>
                  </View>
                ) : (
                  pendingParcels.map((parcel) => (
                    <View key={parcel._id || parcel.id} style={styles.parcelCard}>
                      <View style={styles.parcelHeader}>
                        <Text style={styles.parcelId}>#{parcel._id?.slice(-6) || parcel.id?.slice(-6)}</Text>
                        <Text style={styles.parcelFare}>₹{parcel.fareEstimate}</Text>
                      </View>
                      <View style={styles.parcelLocations}>
                        <View style={styles.parcelLocationRow}>
                          <View style={styles.pickupDot} />
                          <Text style={styles.parcelAddress} numberOfLines={1}>
                            {parcel.pickup?.address}
                          </Text>
                        </View>
                        <View style={styles.parcelLocationRow}>
                          <View style={styles.dropoffDot} />
                          <Text style={styles.parcelAddress} numberOfLines={1}>
                            {parcel.delivery?.address}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.parcelDetails}>
                        <Text style={styles.parcelReceiver}>To: {parcel.receiverName}</Text>
                        <Text style={styles.parcelPackage}>{parcel.package?.name} ({parcel.package?.size})</Text>
                      </View>
                      <View style={styles.parcelActions}>
                        <TouchableOpacity
                          style={styles.acceptParcelButton}
                          onPress={() => handleAcceptTrip(parcel._id || parcel.id || '')}
                        >
                          <Text style={styles.acceptParcelButtonText}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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
<<<<<<< HEAD
                style={[styles.modalBtn, { backgroundColor: '#FF6B35' }]}
=======
              style={[styles.modalBtn, styles.acceptBtn]}
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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

<<<<<<< HEAD
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
=======
=======
          <Text style={styles.notificationText}>
            Keep your location services enabled for better trip matching.
          </Text>
        </AnimatedCard>
      </ScrollView>
>>>>>>> Stashed changes
    </View>
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: '#FF6B35',
=======
    backgroundColor: '#F8FAFC',
  },
<<<<<<< Updated upstream
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
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: '#FF6B35',
=======
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 16,
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
<<<<<<< HEAD
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
=======
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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
    marginBottom: 24,
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
<<<<<<< HEAD
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
=======
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
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
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
=======
  content: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#FB923C',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statusCard: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
>>>>>>> Stashed changes
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
<<<<<<< Updated upstream
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
<<<<<<< HEAD
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
=======
=======
>>>>>>> Stashed changes
  emptyState: {
    padding: 32,
    alignItems: 'center',
<<<<<<< Updated upstream
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
=======
>>>>>>> Stashed changes
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
<<<<<<< Updated upstream
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
<<<<<<< HEAD
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
=======
  tripDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  fareContainer: {
    backgroundColor: '#F0FDF4',
=======
  notificationCard: {
    margin: 20,
>>>>>>> Stashed changes
    padding: 16,
    backgroundColor: '#FEF3E7',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
