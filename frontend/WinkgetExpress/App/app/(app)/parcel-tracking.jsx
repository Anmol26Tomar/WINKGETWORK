import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Animated, TextInput, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { getParcelTracking, verifyOtp, confirmPayment, getCaptainById } from '@/services/parcelService';

const STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    color: '#FFA500', 
    icon: '⏳',
    bgColor: '#FFF4E6',
    description: 'Waiting for captain assignment'
  },
  accepted: { 
    label: 'Accepted', 
    color: '#007AFF', 
    icon: '✅',
    bgColor: '#E6F3FF',
    description: 'Captain assigned and ready'
  },
  in_transit: { 
    label: 'In Transit', 
    color: '#2A5EE4', 
    icon: '🚚',
    bgColor: '#E6F0FF',
    description: 'Your parcel is on the way'
  },
  delivered: { 
    label: 'Delivered', 
    color: '#34C759', 
    icon: '📦',
    bgColor: '#E6F7E6',
    description: 'Successfully delivered'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: '#FF3B30', 
    icon: '❌',
    bgColor: '#FFE6E6',
    description: 'Order was cancelled'
  }
};

export default function ParcelTrackingScreen() {
    const { id } = useLocalSearchParams();
  const router = useRouter();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otp, setOtp] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getParcelTracking(id);
      const normalized = { ...data };
      
      // Normalize status
      if (normalized.accepted && normalized.status !== "accepted") {
        normalized.status = "accepted";
      }
      
      // Hydrate captain details if only an id is present
      if (normalized.captainRef && typeof normalized.captainRef === "string") {
        try {
          const cap = await getCaptainById(normalized.captainRef);
          const hydrated = cap?.captain || cap?.agent || cap?.data || cap;
          normalized.captainRef = hydrated || { _id: normalized.captainRef };
        } catch (e) {
          // ignore hydrate failure, keep id
        }
      }
      
      setParcel(normalized);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error('Error fetching parcel details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchData();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    // Set up socket listeners for captain matching
    const socket = getSocket();
    let captainAssignedHandler;
    let captainAcceptedHandler;
    
    if (socket) {
      captainAssignedHandler = (payload) => {
        console.log('Captain assigned:', payload);
        fetchData(); // Refresh data to show captain info
      };
      captainAcceptedHandler = (payload) => {
        console.log('Captain accepted:', payload);
        fetchData(); // Refresh data to show captain info
      };
      
      socket.on('captain:assigned', captainAssignedHandler);
      socket.on('captain:accepted', captainAcceptedHandler);
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('captain:assigned', captainAssignedHandler);
        socket.off('captain:accepted', captainAcceptedHandler);
      }
    };
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(id, otp);
      Alert.alert('Verified', 'OTP verified successfully!');
      await fetchData();
    } catch (e) {
      Alert.alert('Failed', e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const onConfirmDelivery = async () => {
    try {
      setLoading(true);
      await confirmPayment(id);
      Alert.alert('Delivered', 'Payment confirmed. Parcel delivered successfully!');
      await fetchData();
    } catch (e) {
      Alert.alert('Failed', e.message || 'Could not confirm delivery');
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Missing Parcel ID</Text>
          <Text style={styles.errorText}>Unable to load tracking information</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && !parcel) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tracking details...</Text>
        </View>
      </View>
    );
  }

  if (!parcel) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="search" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Parcel Not Found</Text>
          <Text style={styles.errorText}>The requested parcel could not be found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
        </View>
    );
}

  const statusConfig = getStatusConfig(parcel.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Parcel Delivery</Text>
          <Text style={styles.headerSubtitle}>Tracking #{parcel._id?.slice(-6)}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="cube" size={24} color={Colors.primary} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Status Card */}
          <View style={[styles.statusCard, { backgroundColor: statusConfig.bgColor }]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusIconContainer}>
                <Text style={styles.statusEmoji}>{statusConfig.icon}</Text>
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
                <Text style={styles.statusDescription}>{statusConfig.description}</Text>
              </View>
            </View>
            <View style={styles.statusFooter}>
              <Text style={styles.statusDate}>Created: {formatDate(parcel.createdAt)}</Text>
            </View>
          </View>

          {/* Route Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Route Details</Text>
            </View>
            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#34C759' }]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.routeAddress}>{parcel.pickup?.address}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#FF3B30' }]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>Delivery</Text>
                  <Text style={styles.routeAddress}>{parcel.delivery?.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Receiver Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Receiver Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{parcel.receiverName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{parcel.receiverContact}</Text>
              </View>
            </View>
          </View>

          {/* Package Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Package Details</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Package</Text>
                <Text style={styles.infoValue}>{parcel.package?.name} ({parcel.package?.size})</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoValue}>
                  {parcel.vehicleType === 'truck' && parcel.vehicleSubType 
                    ? parcel.vehicleSubType 
                    : parcel.vehicleType}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fare</Text>
                <Text style={styles.infoValue}>₹{parcel.fareEstimate}</Text>
              </View>
            </View>
          </View>

          {/* Captain Details (if accepted) */}
          {parcel.status === "accepted" && parcel.captainRef && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Captain Details</Text>
              </View>
              <View style={styles.captainContainer}>
                <View style={styles.captainRow}>
                  <View style={styles.captainAvatar}>
                    <Ionicons name="person" size={22} color="#fff" />
                  </View>
                  <View style={styles.captainInfo}>
                    <Text style={styles.captainName}>
                      {parcel.captainRef.fullName ||
                        parcel.captainRef.name ||
                        parcel.captainRef.username ||
                        "Assigned Captain"}
                    </Text>
                    <Text style={styles.captainMeta}>
                      {parcel.captainRef.phone ||
                        parcel.captainRef.mobile ||
                        parcel.captainRef.contact ||
                        "Phone pending"}
                    </Text>
                    {(parcel.captainRef.vehicle || parcel.captainRef.vehicleType || parcel.captainRef.vehicleNumber || parcel.captainRef.vehicleSubType) && (
                      <Text style={styles.captainMeta}>
                        {parcel.captainRef.vehicleType ||
                          parcel.captainRef.vehicle?.type ||
                          parcel.captainRef.vehicleSubType ||
                          "Vehicle"}{" "}
                        {parcel.captainRef.vehicleNumber
                          ? `• ${parcel.captainRef.vehicleNumber}`
                          : ""}
                      </Text>
                    )}
                  </View>
                  {(parcel.captainRef.phone || parcel.captainRef.mobile) && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() =>
                        Linking.openURL(
                          `tel:${parcel.captainRef.phone || parcel.captainRef.mobile}`
                        )
                      }
                    >
                      <Ionicons name="call" size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.captainSubtext}>
                  Captain has accepted your order
                </Text>
              </View>
            </View>
          )}

          {/* OTP Verification (only when delivered) */}
          {parcel.status === "delivered" && !parcel.otp?.verified && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Verify Delivery</Text>
              </View>
              <Text style={styles.otpDescription}>
                Enter the OTP provided by the captain to confirm delivery
              </Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={onVerifyOtp}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.primaryBtnTxt}>Verify OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment Confirmation (only when OTP verified) */}
          {parcel.status === "delivered" && parcel.otp?.verified && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="card" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Confirm Payment</Text>
              </View>
              <Text style={styles.paymentDescription}>
                Confirm payment to complete the delivery
              </Text>
              <TouchableOpacity style={styles.successBtn} onPress={onConfirmDelivery}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.successBtnTxt}>Confirm Payment & Complete</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={Colors.text} />
              <Text style={styles.secondaryBtnTxt}>Back to History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchData()} disabled={refreshing}>
              <Ionicons name="refresh" size={16} color={Colors.text} />
              <Text style={styles.refreshBtnTxt}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background
  },
  headerContent: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2
  },
  headerIcon: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#f8f9ff'
  },
  scrollContent: {
    paddingBottom: Spacing.xl
  },
  content: {
    padding: Spacing.lg
  },
  // Status Card
  statusCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  statusEmoji: {
    fontSize: 28
  },
  statusInfo: {
    flex: 1
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.mutedText,
    lineHeight: 20
  },
  statusFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: Spacing.md
  },
  statusDate: {
    fontSize: 12,
    color: Colors.mutedText,
    fontWeight: '600'
  },
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: Spacing.sm
  },
  // Route
  routeContainer: {
    paddingLeft: Spacing.md
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: Spacing.md
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 11,
    marginBottom: Spacing.sm
  },
  routeInfo: {
    flex: 1
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 20
  },
  // Info Grid
  infoGrid: {
    gap: Spacing.md
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20
  },
  // Captain
  captainContainer: {
    gap: Spacing.sm
  },
  captainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  captainAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  captainInfo: {
    flex: 1
  },
  captainName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2
  },
  captainMeta: {
    fontSize: 12,
    color: Colors.mutedText,
    marginBottom: 1
  },
  captainSubtext: {
    fontSize: 12,
    color: Colors.mutedText,
    fontStyle: 'italic',
    marginTop: Spacing.sm
  },
  callBtn: {
    backgroundColor: '#34C759',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2
  },
  // OTP
  otpDescription: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
    lineHeight: 20
  },
  otpInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2
  },
  // Payment
  paymentDescription: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: Spacing.md,
    lineHeight: 20
  },
  // Buttons
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  successBtn: {
    backgroundColor: '#34C759',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  successBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm
  },
  secondaryBtnTxt: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16
  },
  refreshBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm
  },
  refreshBtnTxt: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16
  },
  actionContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg
  },
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.mutedText,
    fontSize: 16,
    fontWeight: '600'
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.lg
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm
  },
  errorText: {
    fontSize: 14,
    color: Colors.mutedText,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20
  }
});
