import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { captainTripApi } from '../lib/api';
import { emitTripAccepted, emitTripCompleted, getSocket } from '../lib/socket';
import OTPInput from '../components/OTPInput';

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
  otpPickupHash?: string;
  otpDropHash?: string;
}

export default function TripDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPhase, setOtpPhase] = useState<'pickup' | 'drop'>('pickup');
  const [otp, setOtp] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (id) {
      fetchTripDetails();
      requestLocationPermission();
    }
  }, [id]);

  useEffect(() => {
    if (currentLocation && trip) {
      checkAutoArrival();
    }
  }, [currentLocation, trip]);

  const fetchTripDetails = async () => {
    try {
      // This would be a GET endpoint to fetch trip details
      // For now, we'll simulate with the trip data
      setTrip({
        _id: id!,
        serviceType: 'local_parcel',
        pickup: {
          coords: { lat: 12.9716, lng: 77.5946 },
          address: 'MG Road, Bangalore'
        },
        drop: {
          coords: { lat: 12.9352, lng: 77.6245 },
          address: 'Koramangala, Bangalore'
        },
        fare: 150,
        status: 'assigned',
      });
    } catch (error) {
      console.error('Error fetching trip details:', error);
      Alert.alert('Error', 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const checkAutoArrival = () => {
    if (!currentLocation || !trip) return;

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c * 1000; // Distance in meters
    };

    const pickupDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      trip.pickup.coords.lat,
      trip.pickup.coords.lng
    );

    const dropDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      trip.drop.coords.lat,
      trip.drop.coords.lng
    );

    // Auto-trigger arrival if within 100 meters
    if (trip.status === 'enroute_pickup' && pickupDistance < 100) {
      handleReachedPickup();
    } else if (trip.status === 'enroute_drop' && dropDistance < 100) {
      handleReachedDestination();
    }
  };

  const handleAcceptTrip = async () => {
    setActionLoading(true);
    try {
      const response = await captainTripApi.acceptTrip(id!);
      setTrip(response.data.trip);
      
      const socket = getSocket();
      if (socket) {
        emitTripAccepted(socket, id!);
      }
      
      Alert.alert('Success', 'Trip accepted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReachedPickup = async () => {
    setActionLoading(true);
    try {
      await captainTripApi.reachedPickup(id!);
      setTrip(prev => prev ? { ...prev, status: 'at_pickup' } : null);
      Alert.alert('Success', 'Marked as reached pickup location');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReachedDestination = async () => {
    setActionLoading(true);
    try {
      await captainTripApi.reachedDestination(id!);
      setTrip(prev => prev ? { ...prev, status: 'at_destination' } : null);
      Alert.alert('Success', 'Marked as reached destination');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setActionLoading(true);
    try {
      await captainTripApi.verifyOtp(id!, { otp, phase: otpPhase });
      
      if (otpPhase === 'pickup') {
        setTrip(prev => prev ? { ...prev, status: 'enroute_drop' } : null);
      } else {
        setTrip(prev => prev ? { ...prev, status: 'completed' } : null);
        
        const socket = getSocket();
        if (socket) {
          emitTripCompleted(socket, id!);
        }
        
        Alert.alert('Success', 'Trip completed!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
      
      setShowOtpModal(false);
      setOtp('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'OTP verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openOtpModal = (phase: 'pickup' | 'drop') => {
    setOtpPhase(phase);
    setShowOtpModal(true);
  };

  const renderActionButtons = () => {
    if (!trip) return null;

    switch (trip.status) {
      case 'assigned':
        return (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAcceptTrip}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>
                {actionLoading ? 'Accepting...' : 'Accept Trip'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </Pressable>
          </View>
        );

      case 'accepted':
      case 'payment_confirmed':
        return (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleReachedPickup}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>
                {actionLoading ? 'Updating...' : "I've Reached Pickup"}
              </Text>
            </Pressable>
          </View>
        );

      case 'at_pickup':
        return (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => openOtpModal('pickup')}
            >
              <Text style={styles.actionButtonText}>Verify Pickup OTP</Text>
            </Pressable>
          </View>
        );

      case 'enroute_drop':
        return (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleReachedDestination}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>
                {actionLoading ? 'Updating...' : "I've Reached Destination"}
              </Text>
            </Pressable>
          </View>
        );

      case 'at_destination':
        return (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => openOtpModal('drop')}
            >
              <Text style={styles.actionButtonText}>Verify Drop-off OTP</Text>
            </Pressable>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.actionContainer}>
            <Text style={styles.completedText}>Trip Completed Successfully!</Text>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.actionButtonText}>Back to Dashboard</Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Trip Details</Text>
          <Text style={styles.statusText}>Status: {trip.status.toUpperCase()}</Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: trip.pickup.coords.lat,
              longitude: trip.pickup.coords.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
          >
            <Marker
              coordinate={trip.pickup.coords}
              title="Pickup"
              pinColor="#4CAF50"
            />
            <Marker
              coordinate={trip.drop.coords}
              title="Drop"
              pinColor="#F44336"
            />
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                pinColor="#FDB813"
              />
            )}
          </MapView>
        </View>

        <View style={styles.tripInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Type:</Text>
            <Text style={styles.infoValue}>{trip.serviceType.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fare:</Text>
            <Text style={styles.infoValue}>₹{trip.fare}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pickup:</Text>
            <Text style={styles.infoValue}>{trip.pickup.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Drop:</Text>
            <Text style={styles.infoValue}>{trip.drop.address}</Text>
          </View>
        </View>
      </ScrollView>

      {renderActionButtons()}

      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Verify {otpPhase === 'pickup' ? 'Pickup' : 'Drop-off'} OTP
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit OTP provided by the customer
            </Text>
            
            <OTPInput
              value={otp}
              onChangeText={setOtp}
              length={6}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowOtpModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.verifyButton]}
                onPress={handleVerifyOtp}
                disabled={actionLoading}
              >
                <Text style={styles.verifyButtonText}>
                  {actionLoading ? 'Verifying...' : 'Verify'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#000',
    fontSize: 18,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FDB813',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    color: '#FDB813',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 250,
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  tripInfo: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 20,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#666',
    fontSize: 16,
  },
  infoValue: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  primaryButton: {
    backgroundColor: '#FDB813',
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  verifyButton: {
    backgroundColor: '#FDB813',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

