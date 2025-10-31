import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { captainTripApi, setCaptainApiToken } from '../lib/api';
import { useAuth } from '@/context/AuthContext';
import TripCard from '../components/TripCard';
import TripModal from '../components/TripModal';
import { connectSocket, setupSocketListeners, emitLocationUpdate, getSocket } from '../lib/socket';

const { width, height } = Dimensions.get('window');

// BULLETPROOF COORDINATE VALIDATION
const validateCoordinate = (lat: any, lng: any): { isValid: boolean; latitude: number; longitude: number } => {
  const defaultCoords = { latitude: 19.0760, longitude: 72.8777 }; // Mumbai coordinates
  
  try {
    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return { isValid: false, ...defaultCoords };
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { isValid: false, ...defaultCoords };
    }
    
    if (latitude === 0 && longitude === 0) {
      return { isValid: false, ...defaultCoords };
    }
    
    return { isValid: true, latitude, longitude };
  } catch (error) {
    return { isValid: false, ...defaultCoords };
  }
};

interface Trip {
  id: string;
  type: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  delivery: {
    lat: number;
    lng: number;
    address: string;
  };
  fareEstimate: number;
  status: string;
  vehicleType: string;
  vehicleSubType: string;
  distanceKm: number;
  createdAt: string;
}

export default function CaptainHome() {
  const router = useRouter();
  const { captain, token } = useAuth();
  
  // STATE
  const [isOnline, setIsOnline] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [rating, setRating] = useState(0);
  const [availableTripsCount, setAvailableTripsCount] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [newTripToast, setNewTripToast] = useState<Trip | null>(null);

  // FETCH CAPTAIN STATS
  const fetchCaptainStats = useCallback(async () => {
    try {
      const response = await captainTripApi.getCaptainStats();
      console.log('XXXX---RESPONSE---XXXX', response.data);
      if (response.data) {
        setEarnings(response.data.earnings || 0);
        setTodayTrips(response.data.todayTrips || 0);
        setRating(typeof response.data.rating === 'number' ? response.data.rating : 0);
      }
    } catch (error) {
      console.error('Error fetching captain stats:', error);
    }
  }, []);

  // BULLETPROOF LOCATION HANDLER
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation({ lat: 19.0760, lng: 72.8777 }); // Mumbai coordinates
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const validation = validateCoordinate(location.coords.latitude, location.coords.longitude);
      setCurrentLocation({
        lat: validation.latitude,
        lng: validation.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      setCurrentLocation({ lat: 19.0760, lng: 72.8777 }); // Mumbai coordinates
    }
  }, []);

  // BULLETPROOF TRIP FETCHER
  const fetchNearbyTrips = useCallback(async () => {
    if (!currentLocation) return;

    try {
      console.log('Fetching trips for location:', currentLocation);
      const response = await captainTripApi.getNearbyTrips({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius: 10,
      });

      console.log('API Response:', response);

      // BULLETPROOF TRIP FILTERING
      const safeTrips: Trip[] = (response.data?.trips || [])
        .filter((trip: any) => {
          if (!trip || !trip.id || !trip.pickup) return false;
          
          const pickupValidation = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
          return pickupValidation.isValid;
        })
        .map((trip: any) => {
          const pickupValidation = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
          const deliveryValidation = validateCoordinate(trip.delivery?.lat, trip.delivery?.lng);
          
          return {
            ...trip,
            pickup: {
              ...trip.pickup,
              lat: pickupValidation.latitude,
              lng: pickupValidation.longitude,
            },
            delivery: {
              ...trip.delivery,
              lat: deliveryValidation.latitude,
              lng: deliveryValidation.longitude,
            }
          };
        });

      console.log('Safe trips:', safeTrips);
      setAvailableTrips(safeTrips);
      setAvailableTripsCount(safeTrips.length);
      
      // Auto-select first trip if available
      if (safeTrips.length > 0 && !selectedTrip) {
        setSelectedTrip(safeTrips[0]);
      }
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      console.error('Error details:', error?.message || 'Unknown error');
      
      // Show user-friendly error message
      if (error?.message?.includes('Network Error')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
      
      setAvailableTrips([]);
    }
  }, [currentLocation, selectedTrip]);

  // REFRESH
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchNearbyTrips(),
        fetchCaptainStats(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchNearbyTrips]);

  // GOOGLE MAPS REDIRECT
  const openInGoogleMaps = useCallback((trip: Trip) => {
    const pickup = trip.pickup;
    const delivery = trip.delivery;
    
    // Create Google Maps URL for navigation
    const googleMapsUrl = `https://www.google.com/maps/dir/${pickup.lat},${pickup.lng}/${delivery.lat},${delivery.lng}`;
    
    Alert.alert(
      'Navigate to Trip',
      `Navigate to pickup location: ${pickup.address}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open in Google Maps',
          onPress: () => {
            Linking.openURL(googleMapsUrl).catch(err => {
              console.error('Error opening Google Maps:', err);
              Alert.alert('Error', 'Could not open Google Maps');
            });
          },
        },
      ]
    );
  }, []);

  // TRIP PRESS - Open Trip Modal
  const handleTripPress = useCallback((trip: Trip) => {
    setCurrentTrip(trip);
    setTripModalVisible(true);
  }, []);

  // AUTO-REDIRECT TO GOOGLE MAPS ON TRIP ACCEPTANCE
  const handleTripAcceptance = useCallback((trip: Trip) => {
    // Automatically redirect to Google Maps for navigation to pickup
    openInGoogleMaps(trip);
  }, [openInGoogleMaps]);

  // TRIP MODAL HANDLERS
  const handleAcceptTrip = useCallback(async (tripId: string) => {
    try {
      // Determine trip type based on trip data
      const tripType = currentTrip?.type || 'transport';
      await captainTripApi.acceptTrip(tripId, tripType);
      console.log('Trip accepted:', tripId, 'type:', tripType);
      await fetchCaptainStats();
      
      // Automatically redirect to Google Maps for navigation to pickup
      if (currentTrip) {
        handleTripAcceptance(currentTrip);
      }
    } catch (error) {
      console.error('Error accepting trip:', error);
      throw error;
    }
  }, [currentTrip, handleTripAcceptance]);

  const handleStartTrip = useCallback(async (tripId: string) => {
    try {
      // API call to start trip
      console.log('Trip started:', tripId);
    } catch (error) {
      console.error('Error starting trip:', error);
      throw error;
    }
  }, []);

  const handleReachedPickup = useCallback(async (tripId: string) => {
    try {
      const tripType = currentTrip?.type || 'transport';
      await captainTripApi.reachedPickup(tripId, tripType);
      console.log('Reached pickup:', tripId, 'type:', tripType);
    } catch (error) {
      console.error('Error updating pickup status:', error);
      throw error;
    }
  }, [currentTrip]);

  const handleNavigateToDestination = useCallback((trip: Trip) => {
    openInGoogleMaps(trip);
  }, [openInGoogleMaps]);

  const handleCompleteTrip = useCallback(async (tripId: string) => {
    try {
      const tripType = currentTrip?.type || 'transport';
      await captainTripApi.reachedDestination(tripId, tripType);
      console.log('Trip completed:', tripId, 'type:', tripType);
      
      // Refresh stats from backend to avoid stale/random values
      await fetchCaptainStats();
    } catch (error) {
      console.error('Error completing trip:', error);
      throw error;
    }
  }, [currentTrip, earnings]);

  const handleCloseTripModal = useCallback(() => {
    setTripModalVisible(false);
    setCurrentTrip(null);
  }, []);

  // ONLINE TOGGLE
  const handleOnlineToggle = useCallback(async (value: boolean) => {
    setIsOnline(value);
    
    if (value) {
      Alert.alert('🚀 You\'re Online!', 'You can now receive trip requests.');
      await fetchNearbyTrips();
    } else {
      setAvailableTrips([]);
      setSelectedTrip(null);
      Alert.alert('📴 You\'re Offline', 'You won\'t receive new trip requests.');
    }
  }, [fetchNearbyTrips]);

  // INITIALIZATION
  useEffect(() => {
    const initializeCaptain = async () => {
      if (captain) {
        setIsOnline(false);
        if (token) {
          setCaptainApiToken(token);
        }
        // Try to fetch profile/city first with retry to avoid occasional misses
        try {
          const profile = await captainTripApi.getProfile();
          if (profile?.data?.city) {
            setCity(profile.data.city);
          } else if (captain?.city) {
            setCity(captain.city);
          } else {
            setTimeout(async () => {
              try {
                const p2 = await captainTripApi.getProfile();
                if (p2?.data?.city) setCity(p2.data.city);
              } catch {}
            }, 500);
          }
        } catch {
          if (captain?.city) setCity(captain.city);
        }
        await requestLocationPermission();
        await fetchCaptainStats();
      } else {
        router.replace('/captain/(auth)');
      }
      setLoading(false);
    };

    initializeCaptain();
  }, [captain, token, router, requestLocationPermission, fetchCaptainStats]);

  // ONLINE/OFFLINE EFFECT
  useEffect(() => {
    if (isOnline && currentLocation) {
      fetchNearbyTrips();
    } else if (!isOnline) {
      setAvailableTrips([]);
      setSelectedTrip(null);
    }
  }, [isOnline, currentLocation, fetchNearbyTrips]);

  // SOCKET: Connect and live update trips (connect as long as we have a token)
  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      try {
        if (!token) return;
        const socket = await connectSocket(token);

        if (!isMounted) return;

        // prevent duplicate handlers
        socket.off('trip:assigned');
        socket.off('new-trip');

        setupSocketListeners(socket, {
          onTripAssigned: (trip: any) => {
            setAvailableTrips(prev => {
              const exists = prev.some(t => t.id === trip.id);
              if (exists) return prev;
              return [trip, ...prev];
            });
            setAvailableTripsCount(prev => prev + 1);
            setNewTripToast(trip);
            setTimeout(() => setNewTripToast(null), 5000);
            // Optionally refresh stats
            fetchCaptainStats();
          },
          onTripCancelled: (data: any) => {
            const { tripId } = data || {};
            if (!tripId) return;
            setAvailableTrips(prev => prev.filter(t => t.id !== tripId));
            setAvailableTripsCount(prev => Math.max(0, prev - 1));
          },
        });

        // Send initial location
        if (currentLocation) {
          emitLocationUpdate(socket, currentLocation);
        }
      } catch (e) {
        console.warn('Socket init failed:', e);
      }
    };
    setup();

    return () => {
      isMounted = false;
      const s = getSocket();
      // listeners are ephemeral; rely on page unmount to drop them
      void s;
    };
  }, [token, currentLocation]);

  // Fallback polling while online (in case sockets fail on some networks)
  useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(() => {
      fetchNearbyTrips();
    }, 15000);
    return () => clearInterval(id);
  }, [isOnline, fetchNearbyTrips]);

  // BULLETPROOF MAP REGION
  const mapRegion = useMemo(() => {
    const defaultCoords = { latitude: 19.0760, longitude: 72.8777 }; // Mumbai coordinates
    
    if (!currentLocation) {
      return {
        ...defaultCoords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const validation = validateCoordinate(currentLocation.lat, currentLocation.lng);
    return {
      latitude: validation.latitude,
      longitude: validation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [currentLocation]);

  // TRIP MARKER COMPONENT
  const TripMarker = React.memo(({ trip, onPress }: { trip: Trip; onPress: () => void }) => {
    const pickupValidation = validateCoordinate(trip.pickup.lat, trip.pickup.lng);
    
    if (!pickupValidation.isValid) {
      return null;
    }

    return (
      <Marker
        coordinate={{
          latitude: pickupValidation.latitude,
          longitude: pickupValidation.longitude,
        }}
        title={`${trip.type?.toUpperCase() || 'TRIP'} Trip`}
        description={`₹${trip.fareEstimate || 0} - ${trip.vehicleType || 'vehicle'}`}
        pinColor="#4CAF50"
        onPress={onPress}
      />
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {newTripToast && (
        <Pressable style={styles.newTripToast} onPress={() => { setCurrentTrip(newTripToast); setTripModalVisible(true); setNewTripToast(null); }}>
          <Text style={styles.newTripToastText}>New Trip • ₹{Math.round(newTripToast.fareEstimate || 0)} • Tap to view</Text>
        </Pressable>
      )}
      {/* Profile Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileLeft}>
          <Text style={styles.profileGreeting}>Welcome back</Text>
          <Text style={styles.profileName}>{captain?.name || 'Captain'}</Text>
          <Text style={styles.profileMeta}>
            {(captain?.vehicleType?.toUpperCase() || 'VEHICLE')} • {(captain?.servicesOffered?.join(', ') || 'All Services')}{city ? ` • ${city}` : ''}
          </Text>
        </View>
        <View style={styles.profileRight}>
          <Pressable
            style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
            onPress={() => handleOnlineToggle(!isOnline)}
          >
            <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
              {isOnline ? '🟢 Online' : '⚪ Go Online'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{earnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availableTripsCount}</Text>
            <Text style={styles.statLabel}>Active Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayTrips}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>
        </View>
      </View>

      {/* NATIVE MAPVIEW WITH CURRENT LOCATION */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={false}
          showsScale={false}
          onMapReady={() => console.log('Map ready')}
        >
          {/* Captain's current location marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
              }}
              title="Your Location"
              description="Captain's current location"
              pinColor="#4285F4"
            />
          )}
          
          {/* Trip markers */}
          {availableTrips.map((trip) => (
            <TripMarker
              key={trip.id}
              trip={trip}
              onPress={() => openInGoogleMaps(trip)}
            />
          ))}
        </MapView>
        
        {/* TRIP SELECTOR OVERLAY */}
        {availableTrips.length > 0 && (
          <View style={styles.tripSelectorOverlay}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripSelector}>
              {availableTrips.map((trip) => (
                <Pressable
                  key={trip.id}
                  style={[
                    styles.tripSelectorItem,
                    selectedTrip?.id === trip.id && styles.tripSelectorItemActive
                  ]}
                  onPress={() => setSelectedTrip(trip)}
                >
                  <Text style={styles.tripSelectorText}>
                    {trip.type?.toUpperCase() || 'TRIP'}
                  </Text>
                  <Text style={styles.tripSelectorFare}>₹{trip.fareEstimate || 0}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Trips List */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.tripsContainer}>
          <View style={styles.tripsHeader}>
            <Text style={styles.tripsTitle}>Available Trips ({availableTrips.length})</Text>
            <Pressable onPress={onRefresh} style={styles.refreshButton}>
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          {availableTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => handleTripPress(trip)} />
          ))}

          {availableTrips.length === 0 && (
            <View style={styles.noTripsContainer}>
              <Text style={styles.noTripsText}>
                {isOnline ? 'No trips available nearby' : 'Go online to see trips'}
              </Text>
              <Text style={styles.noTripsSubtext}>
                {isOnline ? 'Trips will appear here when available' : 'Toggle the switch above to start receiving trips'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Trip Modal */}
      <TripModal
        visible={tripModalVisible}
        trip={currentTrip}
        onClose={handleCloseTripModal}
        onAcceptTrip={handleAcceptTrip}
        onStartTrip={handleStartTrip}
        onReachedPickup={handleReachedPickup}
        onNavigateToDestination={handleNavigateToDestination}
        onCompleteTrip={handleCompleteTrip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#2C3E50',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1.25,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  profileLeft: { flex: 1 },
  profileRight: { alignItems: 'flex-end' },
  profileGreeting: { color: Colors.mutedText, fontSize: 12 },
  profileName: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  profileMeta: { color: Colors.mutedText, fontSize: 12, marginTop: 4 },
  onlineButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.25,
    borderColor: Colors.border,
  },
  onlineButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  onlineButtonText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  onlineButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  statCard: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.25,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  statValue: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.mutedText,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
  },
  mapContainer: {
    height: 500,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  map: {
    flex: 1,
  },
  tripSelectorOverlay: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 237, 223, 0.96)',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripSelector: {
    paddingHorizontal: 8,
  },
  tripSelectorItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripSelectorItemActive: {
    backgroundColor: Colors.primary,
  },
  tripSelectorText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tripSelectorFare: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripsTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tripsList: {
    flex: 0,
  },
  noTripsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 20,
    borderWidth: 1.25,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noTripsText: {
    color: Colors.mutedText,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noTripsSubtext: {
    color: Colors.mutedText,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  newTripToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  newTripToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});