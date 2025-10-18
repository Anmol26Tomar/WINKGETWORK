import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';
import { PaymentQRModal } from './PaymentQRModal';
import { OrderDetailsInput } from './OrderDetailsInput';
import type { ServiceType, Trip } from '../types';
import { getServiceConfig, SERVICE_CONFIGS } from '../config/serviceConfig';
import { tripService } from '../services/api';

// ----- Dummy trip for testing -----
const dummyTrip: Trip = {
  id: 'trip_123',
  status: 'accepted', // change to 'in_progress' to test other flow
  service_type: 'delivery', // must match a key in SERVICE_CONFIGS or use fallback
  estimated_fare: 150,
  pickup_lat: 12.9716,
  pickup_lng: 77.5946,
  dropoff_lat: 12.9352,
  dropoff_lng: 77.6245,
  requiresPaymentAfterPickup: false,
  requiresPickupOtp: true,
  requiresDropOtp: true,
  workflow: 'default',
};

interface TripWorkflowProps {
  trip?: Trip; // optional so we can use dummy
  onTripComplete?: () => void;
  onTripCancel?: () => void;
  onShowMap?: () => void;
}

export function TripWorkflow({
  trip = dummyTrip,
  onTripComplete = () => Alert.alert('Trip Complete'),
  onTripCancel = () => Alert.alert('Trip Cancelled'),
  onShowMap,
}: TripWorkflowProps) {
  const [pickupOtpModalVisible, setPickupOtpModalVisible] = useState(false);
  const [dropOtpModalVisible, setDropOtpModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [orderDetailsModalVisible, setOrderDetailsModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [pickupOtp, setPickupOtp] = useState('');
  const [dropOtp, setDropOtp] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [orderDetails, setOrderDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const serviceType = (trip.serviceType || trip.type) as ServiceType;

  // Fallback config if SERVICE_CONFIGS doesn't have this type
  const config = getServiceConfig(serviceType) || {
    requiresPickupOtp: false,
    requiresDropOtp: false,
    requiresPaymentAfterPickup: false,
    workflow: 'default',
  };

  const status = trip.status;

  const openMaps = (lat: number, lng: number) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:', default: 'https:' });
    const url = Platform.select({
      ios: `${scheme}?q=${lat},${lng}`,
      android: `${scheme}${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url);
  };

  // ----- API Handlers -----
  const handleReachedPickup = async () => {
    setLoading(true);
    try {
      await tripService.reachTrip(trip.id || trip._id);
      if (config.requiresPickupOtp) setPickupOtpModalVisible(true);
      else if (config.requiresPaymentAfterPickup) setPaymentModalVisible(true);
      else setOrderDetailsModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark as reached');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPickupOtp = async () => {
    if (!pickupOtp.trim() || pickupOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await tripService.verifyPickupOtp(trip.id || trip._id, pickupOtp);
      // After OTP verification, start the trip
      await tripService.startTrip(trip.id || trip._id);
      setPickupOtpModalVisible(false);
      setPickupOtp('');
      setOrderDetailsModalVisible(false);
      onShowMap?.(); // Show map interface
      Alert.alert('Success', 'Trip started successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmed = () => {
    setPaymentModalVisible(false);
    setOrderDetailsModalVisible(true);
  };

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      // First mark as reached pickup to get OTP
      await tripService.reachTrip(trip.id || trip._id);
      
      if (config.requiresPickupOtp) {
        setPickupOtpModalVisible(true);
      } else {
        // Start trip directly if no OTP required
        await tripService.startTrip(trip.id || trip._id);
        setOrderDetailsModalVisible(false);
        onShowMap?.(); // Show map interface
        Alert.alert('Success', 'Trip started successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  const handleReachedDestination = async () => {
    setLoading(true);
    try {
      const result = await tripService.reachDestination(trip.id || trip._id);
      if (config.requiresDropOtp) {
        setDropOtpModalVisible(true);
        // Store the OTP for verification
        if (result.otp) {
          // OTP is provided by the backend
        }
      } else if (config.workflow === 'pickup_deliver_pay') {
        setPaymentModalVisible(true);
      } else {
        // Auto-complete trip if no OTP or payment required
        await tripService.endTrip(trip.id || trip._id, '000000'); // Use dummy OTP for auto-completion
        onTripComplete();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark destination reached');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDropOtp = async () => {
    if (!dropOtp.trim() || dropOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await tripService.endTrip(trip.id || trip._id, dropOtp);
      setDropOtpModalVisible(false);
      setDropOtp('');
      if (config.workflow === 'pickup_deliver_pay') {
        setPaymentModalVisible(true);
      } else {
        onTripComplete();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalPaymentConfirmed = () => {
    setPaymentModalVisible(false);
    onTripComplete();
  };

  const handleCancelTrip = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }
    setLoading(true);
    try {
      await tripService.cancelTrip(trip.id || trip._id, cancelReason);
      setCancelModalVisible(false);
      setCancelReason('');
      onTripCancel();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel trip');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {status === 'accepted' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => openMaps(trip.pickup.lat, trip.pickup.lng)}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.navigateButtonText}>Navigate to Pickup</Text>
          </TouchableOpacity>
          <Button
            title="Reached Pickup"
            onPress={handleReachedPickup}
            loading={loading}
          />
          <Button
            title="Cancel Trip"
            onPress={() => setCancelModalVisible(true)}
            variant="danger"
          />
        </View>
      )}

      {status === 'in_progress' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => openMaps(trip.destination?.lat || trip.delivery?.lat || 0, trip.destination?.lng || trip.delivery?.lng || 0)}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.navigateButtonText}>Navigate to Dropoff</Text>
          </TouchableOpacity>
          <Button
            title="Reached Destination"
            onPress={handleReachedDestination}
            loading={loading}
          />
          <Button
            title="Cancel Trip"
            onPress={() => setCancelModalVisible(true)}
            variant="danger"
          />
        </View>
      )}

      <Modal
        visible={pickupOtpModalVisible}
        onClose={() => setPickupOtpModalVisible(false)}
        title="Verify Pickup OTP"
      >
        <Text style={styles.modalText}>
          Enter the 6-digit pickup OTP provided by the customer
        </Text>
        <Input
          label="Pickup OTP"
          placeholder="Enter 6-digit OTP"
          value={pickupOtp}
          onChangeText={setPickupOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          title="Verify & Continue"
          onPress={handleVerifyPickupOtp}
          loading={loading}
        />
      </Modal>

      <Modal
        visible={dropOtpModalVisible}
        onClose={() => setDropOtpModalVisible(false)}
        title="Verify Drop OTP"
      >
        <Text style={styles.modalText}>
          Enter the 6-digit drop OTP provided by the recipient
        </Text>
        <Input
          label="Drop OTP"
          placeholder="Enter 6-digit OTP"
          value={dropOtp}
          onChangeText={setDropOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          title="Verify & Complete"
          onPress={handleVerifyDropOtp}
          loading={loading}
        />
      </Modal>

      <PaymentQRModal
        visible={paymentModalVisible}
        amount={trip.fareEstimate || trip.fare || trip.estimatedFare || 0}
        onPaymentConfirmed={
          config.requiresPaymentAfterPickup
            ? handlePaymentConfirmed
            : handleFinalPaymentConfirmed
        }
        onClose={() => setPaymentModalVisible(false)}
      />

      <Modal
        visible={orderDetailsModalVisible}
        onClose={() => setOrderDetailsModalVisible(false)}
        title="Order Details"
      >
        <OrderDetailsInput
          serviceType={serviceType}
          value={orderDetails}
          onChange={setOrderDetails}
        />
        <Button
          title="Start Trip"
          onPress={handleStartTrip}
          loading={loading}
          style={styles.startButton}
        />
      </Modal>

      <Modal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        title="Cancel Trip"
      >
        <Input
          label="Reason for Cancellation"
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
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  actions: {
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
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  startButton: {
    marginTop: 16,
  },
});

export default TripWorkflow;
