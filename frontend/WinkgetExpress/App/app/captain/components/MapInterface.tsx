import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';
import { tripService, getRoutePolyline } from '../services/api';
import type { Trip } from '../types';

const { width, height } = Dimensions.get('window');

interface MapInterfaceProps {
  trip: Trip;
  onTripComplete: () => void;
  onTripCancel: () => void;
  visible: boolean;
  onClose: () => void;
}

export const MapInterface: React.FC<MapInterfaceProps> = ({
  trip,
  onTripComplete,
  onTripCancel,
  visible,
  onClose,
}) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [tripStatus, setTripStatus] = useState(trip.status);

  // Get destination coordinates based on trip type
  const destination = trip.destination || trip.delivery;
  const destinationCoords = destination ? { lat: destination.lat, lng: destination.lng } : null;

  useEffect(() => {
    if (visible && trip) {
      getCurrentLocation();
      if (destinationCoords) {
        getRouteToDestination();
      }
    }
  }, [visible, trip]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for navigation');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(location);

      // Animate map to show both user location and destination
      if (mapRef.current && destinationCoords) {
        mapRef.current.fitToCoordinates([
          { latitude: location.lat, longitude: location.lng },
          { latitude: destinationCoords.lat, longitude: destinationCoords.lng },
        ], {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getRouteToDestination = async () => {
    if (!userLocation || !destinationCoords) return;

    try {
      const route = await getRoutePolyline(userLocation, destinationCoords);
      const coordinates = route.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
      setRouteCoords(coordinates);
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  const openExternalMaps = () => {
    if (!destinationCoords) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${destinationCoords.lat},${destinationCoords.lng}`,
      android: `geo:${destinationCoords.lat},${destinationCoords.lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${destinationCoords.lat},${destinationCoords.lng}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleReachedDestination = async () => {
    setLoading(true);
    try {
      await tripService.reachDestination(trip.id || trip._id || '');
      setShowEndTripModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark destination reached');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await tripService.endTrip(trip.id || trip._id || '', otp);
      setShowEndTripModal(false);
      setOtp('');
      onTripComplete();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete trip');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      await tripService.cancelTrip(trip.id || trip._id || '', cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      onTripCancel();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel trip');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Active Trip</Text>
          <Text style={styles.headerSubtitle}>
            {trip.type || trip.serviceType || 'Transport'} • ₹{trip.fareEstimate || trip.fare || 0}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{tripStatus.toUpperCase()}</Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Your Location"
            description="You are here"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Pickup Marker */}
        {trip.pickup && (
          <Marker
            coordinate={{ latitude: trip.pickup.lat, longitude: trip.pickup.lng }}
            title="Pickup Location"
            description={trip.pickup.address}
          >
            <View style={styles.pickupMarker}>
              <MapPin size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationCoords && (
          <Marker
            coordinate={{ latitude: destinationCoords.lat, longitude: destinationCoords.lng }}
            title="Destination"
            description={destination?.address}
          >
            <View style={styles.destinationMarker}>
              <MapPin size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#2563EB"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Trip Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.tripInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pickup:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {trip.pickup?.address || 'Pickup location'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destination:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {destination?.address || 'Destination'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>
              {(trip.distanceKm || trip.distance || 0).toFixed(1)} km
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.navigateButton} onPress={openExternalMaps}>
          <Navigation size={20} color="#FFFFFF" />
          <Text style={styles.navigateButtonText}>Open Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reachedButton}
          onPress={handleReachedDestination}
          disabled={loading}
        >
          <CheckCircle size={20} color="#FFFFFF" />
          <Text style={styles.reachedButtonText}>Reached Destination</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowCancelModal(true)}
        >
          <AlertCircle size={20} color="#FFFFFF" />
          <Text style={styles.cancelButtonText}>Cancel Trip</Text>
        </TouchableOpacity>
      </View>

      {/* End Trip Modal */}
      <Modal
        visible={showEndTripModal}
        onClose={() => setShowEndTripModal(false)}
        title="Complete Trip"
      >
        <Text style={styles.modalText}>
          Enter the 6-digit OTP provided by the customer to complete the trip.
        </Text>
        <Input
          label="Completion OTP"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          title="Complete Trip"
          onPress={handleEndTrip}
          loading={loading}
        />
      </Modal>

      {/* Cancel Trip Modal */}
      <Modal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Trip"
      >
        <Text style={styles.modalText}>
          Please provide a reason for cancelling this trip.
        </Text>
        <Input
          label="Cancellation Reason"
          placeholder="Enter reason..."
          value={cancelReason}
          onChangeText={setCancelReason}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />
        <Button
          title="Cancel Trip"
          onPress={handleCancelTrip}
          variant="danger"
          loading={loading}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tripInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navigateButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  reachedButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  reachedButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
});

export default MapInterface;
