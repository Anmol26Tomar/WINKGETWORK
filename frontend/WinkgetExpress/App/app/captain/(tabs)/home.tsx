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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { captainTripApi, setCaptainApiToken } from '../lib/api';
import { useAuth } from '@/context/AuthContext';
import TripCard from '../components/TripCard';
import TripModal from '../components/TripModal';

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
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [rating, setRating] = useState(4.8);
  const [availableTripsCount, setAvailableTripsCount] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  // FETCH CAPTAIN STATS
  const fetchCaptainStats = useCallback(async () => {
    try {
      const response = await captainTripApi.getCaptainStats();
      if (response.data) {
        setEarnings(response.data.earnings || 0);
        setTodayTrips(response.data.todayTrips || 0);
        setRating(response.data.rating || 4.8);
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

      console.log('API Response:', response.data);

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
      await fetchNearbyTrips();
      setEarnings(Math.floor(Math.random() * 1000) + 200);
      setTodayTrips(Math.floor(Math.random() * 10) + 1);
      setRating(4.2 + Math.random() * 0.8);
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
      
      // Update earnings and trip count
      if (currentTrip) {
        const tripEarnings = Math.round(currentTrip.fareEstimate * 0.7); // 70% of trip value
        setEarnings(prev => prev + tripEarnings);
        setTodayTrips(prev => prev + 1);
        console.log(`Earnings updated: +₹${tripEarnings}, Total: ₹${earnings + tripEarnings}`);
      }
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
        setIsOnline(captain.isActive || false);
        if (token) {
          setCaptainApiToken(token);
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
        <ActivityIndicator size="large" color="#FDB813" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Hello, {captain?.name || 'Captain'} 👋</Text>
          <Text style={styles.vehicleText}>
            {captain?.vehicleType?.toUpperCase() || 'VEHICLE'} • {captain?.servicesOffered?.join(', ') || 'All Services'}
          </Text>
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
            <Text style={styles.statValue}>{todayTrips}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rating.toFixed(1)}★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
                 <View style={styles.statCard}>
                   <Text style={styles.statValue}>{availableTripsCount}</Text>
                   <Text style={styles.statLabel}>Available Trips</Text>
                 </View>
        </View>
      </View>

      {/* Online Toggle */}
      <View style={[styles.onlineContainer, isOnline && styles.onlineContainerActive]}>
        <View style={styles.onlineLeft}>
          <Text style={[styles.onlineText, isOnline && styles.onlineTextActive]}>
            {isOnline ? '🟢 Online' : '⚪ Go Online'}
          </Text>
          <Text style={styles.onlineSubtext}>
            {isOnline ? 'You\'re receiving trips' : 'Tap to start receiving trips'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleOnlineToggle}
          trackColor={{ false: '#E8E8E8', true: '#FF6B35' }}
          thumbColor={isOnline ? '#FFFFFF' : '#FFFFFF'}
        />
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
      </View>

      {/* Trips List */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
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
    backgroundColor: '#FAFAFA',
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    color: '#2C3E50',
    fontSize: 22,
    fontWeight: 'bold',
  },
  vehicleText: {
    color: '#7F8C8D',
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  statValue: {
    color: '#FF6B35',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#7F8C8D',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  onlineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  onlineContainerActive: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  onlineLeft: {
    flex: 1,
  },
  onlineText: {
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineTextActive: {
    color: '#FF6B35',
  },
  onlineSubtext: {
    color: '#7F8C8D',
    fontSize: 12,
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  mapContainer: {
    height: 280,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
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
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
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
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  tripSelectorItemActive: {
    backgroundColor: '#FF6B35',
  },
  tripSelectorText: {
    color: '#2C3E50',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tripSelectorFare: {
    color: '#FF6B35',
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
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF6B35',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noTripsText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noTripsSubtext: {
    color: '#95A5A6',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});