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
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { captainTripApi, setCaptainApiToken } from '../lib/api';
import { connectSocket, setupSocketListeners, emitLocationUpdate, getSocket } from '../lib/socket';
import { useAuth } from '@/context/AuthContext';
import TripCard from '../components/TripCard';

const { width, height } = Dimensions.get('window');

interface Trip {
  _id: string;
  serviceType: string;
  pickup: {
    coords: { lat: number; lng: number };
    address: string;
  };
  drop: {
    coords: { lat: number; lng: number };
    address: string;
  };
  fare: number;
  status: string;
}

interface CaptainProfile {
  _id: string;
  name: string;
  phone: string;
  vehicleType: string;
  servicesOffered: string[];
  isActive: boolean;
}

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
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [locationUpdates, setLocationUpdates] = useState(false);

  useEffect(() => {
    if (captain) {
      setIsOnline(captain.isActive || false);
      setLoading(false);
      
      // Set API token for authenticated requests
      if (token) {
        setCaptainApiToken(token);
        console.log('API token set for captain requests');
      }
    } else {
      // No captain data, redirect to auth
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

  const initializeCaptain = async () => {
    // This function is no longer needed as we get captain from AuthContext
    setLoading(false);
  };

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
      
      // Validate coordinates
      if (coords.lat && coords.lng && !isNaN(coords.lat) && !isNaN(coords.lng)) {
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
      console.log('Nearby trips response:', response.data);
      setAvailableTrips(response.data.trips || []);
    } catch (error) {
      console.error('Error fetching nearby trips:', error);
      // Show user-friendly error message
      Alert.alert('Error', 'Unable to fetch nearby trips. Please check your connection.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNearbyTrips();
      // Simulate fetching captain stats
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
      const socket = await connectSocket(token);
      setupSocketListeners(socket, {
        onTripAssigned: (trip) => {
          console.log('New trip assigned:', trip);
          setAvailableTrips(prev => [...prev, trip]);
          // Show notification
          Alert.alert('New Trip!', `Trip to ${trip.drop.address} for ₹${trip.fare}`);
        },
        onTripCancelled: (data) => {
          console.log('Trip cancelled:', data);
          setAvailableTrips(prev => prev.filter(trip => trip._id !== data.tripId));
        },
        onLocationUpdated: (data) => {
          console.log('Location updated:', data);
        },
      });
      
      // Start location tracking when online
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
      // Send initial location
      emitLocationUpdate(socket, currentLocation);
      
      // Set up periodic location updates
      const locationInterval = setInterval(() => {
        if (isOnline && currentLocation) {
          emitLocationUpdate(socket, currentLocation);
        }
      }, 10000); // Update every 10 seconds
      
      // Store interval for cleanup
      return () => clearInterval(locationInterval);
    }
  };

  const handleOnlineToggle = async (value: boolean) => {
    setIsOnline(value);
    
    if (value && currentLocation) {
      // Start location updates and fetch trips
      startLocationTracking();
      await fetchNearbyTrips();
      
      // Show success message
      Alert.alert('You\'re Online!', 'You can now receive trip requests');
    } else {
      // Stop location updates
      setLocationUpdates(false);
      setAvailableTrips([]);
      
      // Show offline message
      Alert.alert('You\'re Offline', 'You won\'t receive new trip requests');
    }
  };

  const handleTripPress = (trip: Trip) => {
    router.push(`/captain/trip/${trip._id}`);
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

      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
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
      <View style={styles.onlineContainer}>
        <View style={styles.onlineLeft}>
          <Text style={styles.onlineText}>Go Online</Text>
          <Text style={styles.onlineSubtext}>
            {isOnline ? 'You\'re receiving trips' : 'Tap to start receiving trips'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleOnlineToggle}
          trackColor={{ false: '#333', true: '#FDB813' }}
          thumbColor={isOnline ? '#000' : '#fff'}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {currentLocation && currentLocation.lat && currentLocation.lng ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
            showsCompass={false}
            showsScale={false}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
              }}
              title="Your Location"
              pinColor="#FDB813"
            />
            {/* Show trip markers */}
            {availableTrips.map((trip) => (
              <Marker
                key={trip._id}
                coordinate={{
                  latitude: trip.pickup.coords.lat,
                  longitude: trip.pickup.coords.lng,
                }}
                title={`Trip to ${trip.drop.address}`}
                description={`₹${trip.fare}`}
                pinColor="#4CAF50"
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
      <View style={styles.tripsContainer}>
        <View style={styles.tripsHeader}>
          <Text style={styles.tripsTitle}>
            Available Trips ({availableTrips.length})
          </Text>
          <Pressable onPress={onRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
        <ScrollView 
          style={styles.tripsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {availableTrips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              onPress={() => handleTripPress(trip)}
            />
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
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  vehicleText: {
    color: '#999',
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
    backgroundColor: '#333',
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
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  onlineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#333',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  onlineLeft: {
    flex: 1,
  },
  onlineText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  mapContainer: {
    height: 250,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  mapPlaceholderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    color: '#999',
    fontSize: 14,
  },
  tripsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripsTitle: {
    color: '#fff',
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
    flex: 1,
  },
  noTripsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTripsText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noTripsSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
