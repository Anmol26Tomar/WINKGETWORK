import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { captainTripApi, setCaptainApiToken } from '../lib/api';
import { connectSocket, setupSocketListeners, emitLocationUpdate, getSocket } from '../lib/socket';
import { useAuth } from '@/context/AuthContext';
import TripCard from '../components/TripCard';

const { width, height } = Dimensions.get('window');

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
  package?: any;
  receiverName?: string;
  receiverContact?: string;
  selectedItems?: any;
  receiverAddress?: string;
}

interface CaptainProfile {
  _id: string;
  name: string;
  phone: string;
  vehicleType: string;
  servicesOffered: string[];
  isActive: boolean;
}

// Helper function to validate coordinates
const isValidCoordinate = (lat: any, lng: any): boolean => {
  if (!lat || !lng) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false; // Invalid coordinates
  if (lat < -90 || lat > 90) return false; // Invalid latitude
  if (lng < -180 || lng > 180) return false; // Invalid longitude
  return true;
};

// Safe marker component that never renders invalid coordinates
const SafeMarker = ({ trip, onPress }: { trip: Trip; onPress: (trip: Trip) => void }) => {
  // Triple validation before rendering
  if (!trip || !trip.pickup || !isValidCoordinate(trip.pickup.lat, trip.pickup.lng)) {
    console.warn('SafeMarker: Skipping invalid trip', trip);
    return null;
  }

  // Final coordinate extraction with safety
  const lat = Number(trip.pickup.lat);
  const lng = Number(trip.pickup.lng);
  
  // Ultimate safety check
  if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    console.error('SafeMarker: Invalid coordinates after conversion', { lat, lng, trip });
    return null;
  }

  return (
    <Marker
      key={trip.id}
      coordinate={{
        latitude: lat,
        longitude: lng,
      }}
      title={`${trip?.type?.toUpperCase() || 'TRIP'} Trip to ${
        trip?.delivery?.address || 'destination'
      }`}
      description={`₹${trip?.fareEstimate || 0} - ${trip?.vehicleType || 'vehicle'}`}
      pinColor="#4CAF50"
      onPress={() => onPress(trip)}
    />
  );
};

export default function CaptainHome() {
  const router = useRouter();
  const { captain, token } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [rating, setRating] = useState(0);
  const [locationUpdates, setLocationUpdates] = useState(false);

  useEffect(() => {
    if (captain) {
      setIsOnline(captain.isActive || false);
      setLoading(false);

      if (token) {
        setCaptainApiToken(token);
        console.log('API token set for captain requests');
      }
    } else {
      router.replace('/captain/(auth)');
    }
    requestLocationPermission();
  }, [captain, token]);

  useEffect(() => {
    if (isOnline && currentLocation) {
      fetchNearbyTrips();
      connectSocketAndListen();
    }
  }, [isOnline, currentLocation]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      if (isValidCoordinate(coords.lat, coords.lng)) {
        setCurrentLocation(coords);
        console.log('Location set:', coords);
      } else {
        console.error('Invalid coordinates received:', coords);
        Alert.alert('Error', 'Unable to get valid location coordinates');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to access location. Please check permissions.');
    }
  };

  const fetchNearbyTrips = async () => {
    if (!currentLocation) return;

    try {
      console.log('Fetching nearby trips for location:', currentLocation);
      const response = await captainTripApi.getNearbyTrips({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius: 10,
      });
      setAvailableTrips(response.data.trips || []);
    } catch (error) {
      console.error('Error fetching nearby trips:', error);
      Alert.alert('Error', 'Unable to fetch nearby trips. Please check your connection.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNearbyTrips();
      setEarnings(Math.floor(Math.random() * 1000) + 200);
      setTodayTrips(Math.floor(Math.random() * 10) + 1);
      setRating(4.2 + Math.random() * 0.8);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const connectSocketAndListen = async () => {
    try {
      if (!token) return;
      const socket = await connectSocket(token);
      setupSocketListeners(socket, {
        onTripAssigned: (trip) => {
          console.log('New trip assigned:', trip);
          setAvailableTrips((prev) => [...prev, trip]);
          Alert.alert('New Trip!', `Trip to ${trip.delivery?.address || 'destination'} for ₹${trip.fareEstimate || 0}`);
        },
        onTripCancelled: (data) => {
          console.log('Trip cancelled:', data);
          setAvailableTrips((prev) => prev.filter((trip) => trip.id !== data.tripId));
        },
        onLocationUpdated: (data) => {
          console.log('Location updated:', data);
        },
      });

      if (isOnline && currentLocation) {
        startLocationTracking();
      }
    } catch (error) {
      console.error('Error connecting socket:', error);
    }
  };

  const startLocationTracking = () => {
    if (locationUpdates) return;

    setLocationUpdates(true);
    const socket = getSocket();

    if (socket && currentLocation) {
      emitLocationUpdate(socket, currentLocation);

      const locationInterval = setInterval(() => {
        if (isOnline && currentLocation) {
          emitLocationUpdate(socket, currentLocation);
        }
      }, 10000);

      return () => clearInterval(locationInterval);
    }
  };

  const handleOnlineToggle = async (value: boolean) => {
    setIsOnline(value);

    if (value && currentLocation) {
      startLocationTracking();
      await fetchNearbyTrips();
      Alert.alert('🚀 You\'re Online!', 'You can now receive trip requests.');
    } else {
      setLocationUpdates(false);
      setAvailableTrips([]);
      Alert.alert('📴 You\'re Offline', 'You won’t receive new trip requests.');
    }
  };

  const handleTripPress = (trip: Trip) => {
    router.push(`/captain/trip/${trip.id}?type=${trip.type}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Hello, {captain?.name} 👋</Text>
          <Text style={styles.vehicleText}>
            {captain?.vehicleType?.toUpperCase()} • {captain?.servicesOffered?.join(', ')}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer} contentContainerStyle={styles.statsContent}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{earnings}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayTrips}</Text>
          <Text style={styles.statLabel}>Trips Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{rating.toFixed(1)}★</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{availableTrips.length}</Text>
          <Text style={styles.statLabel}>Available Trips</Text>
        </View>
      </ScrollView>

      {/* Online Toggle */}
      <View style={[styles.onlineContainer, isOnline && styles.onlineContainerActive]}>
        <View style={styles.onlineLeft}>
          <Text style={[styles.onlineText, isOnline && styles.onlineTextActive]}>
            {isOnline ? '🟢 Online' : '⚪ Go Online'}
          </Text>
          <Text style={styles.onlineSubtext}>
            {isOnline ? 'You’re receiving trips' : 'Tap to start receiving trips'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleOnlineToggle}
          trackColor={{ false: '#ddd', true: '#FDB813' }}
          thumbColor={isOnline ? '#000' : '#fff'}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {currentLocation && isValidCoordinate(currentLocation.lat, currentLocation.lng) ? (
          <MapView
            key={`map-${currentLocation.lat}-${currentLocation.lng}`}
            style={styles.map}
            initialRegion={{
              latitude: Number(currentLocation.lat),
              longitude: Number(currentLocation.lng),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
            showsCompass={false}
            showsScale={false}
          >
            {/* Current Location Marker - Triple validated */}
            {isValidCoordinate(currentLocation.lat, currentLocation.lng) && (
              <Marker
                coordinate={{
                  latitude: Number(currentLocation.lat),
                  longitude: Number(currentLocation.lng),
                }}
                title="Your Location"
                pinColor="#FDB813"
              />
            )}

            {/* Trip Markers - Bulletproof Safe Rendering */}
            {availableTrips
              .filter(trip => trip && trip.id) // Basic trip validation
              .map((trip) => (
                <SafeMarker 
                  key={trip.id} 
                  trip={trip} 
                  onPress={handleTripPress} 
                />
              ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              {loading ? 'Loading location...' : 'Location not available'}
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Please enable location permissions
            </Text>
          </View>
        )}
      </View>

      {/* Trips List */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#000',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  vehicleText: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    marginVertical: 10,
  },
  statsContent: {
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    color: '#FDB813',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  onlineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  onlineContainerActive: {
    backgroundColor: '#F0F8FF',
    borderColor: '#FDB813',
    borderWidth: 2,
  },
  onlineLeft: {
    flex: 1,
  },
  onlineText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineTextActive: {
    color: '#FDB813',
  },
  onlineSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    color: '#666',
    fontSize: 14,
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
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FDB813',
    borderRadius: 6,
  },
  refreshText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  tripsList: {
    flex: 0,
  },
  noTripsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTripsText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noTripsSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
