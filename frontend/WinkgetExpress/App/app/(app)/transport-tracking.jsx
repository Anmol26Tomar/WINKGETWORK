import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Animated, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { listTransportByUser, getTransportById } from '@/services/transportService';
import { getCaptainById } from '@/services/parcelService';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/services/socket';

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
  in_progress: { 
    label: 'In Progress', 
    color: '#2A5EE4', 
    icon: '🚗',
    bgColor: '#E6F0FF',
    description: 'Your ride is underway'
  },
  completed: { 
    label: 'Completed', 
    color: '#34C759', 
    icon: '🏁',
    bgColor: '#E6F7E6',
    description: 'Ride completed successfully'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: '#FF3B30', 
    icon: '❌',
    bgColor: '#FFE6E6',
    description: 'Ride was cancelled'
  }
};

export default function TransportTrackingScreen() {
	const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth?.() || {};
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      let found = null;
      try {
        found = await getTransportById(id);
      } catch {
        const uid = user?.id || user?._id;
        if (!uid) throw new Error('User not found');
        const data = await listTransportByUser(uid);
        found = (data.transports || []).find(t => t._id === id);
      }
      if (!found) throw new Error('Not found');
      
      const normalized = { ...found };
      if (normalized.rideAccepted && normalized.status !== 'accepted') normalized.status = 'accepted';
      
      // Hydrate captain details if only an id is present
      if (normalized.captainRef && typeof normalized.captainRef === "string") {
        try {
          const cap = await getCaptainById(normalized.captainRef);
          normalized.captainRef = cap?.agent || cap?.captain || cap?.data || cap || { _id: normalized.captainRef };
        } catch (e) {
          // ignore hydrate failure, keep id
        }
      }
      
      setTrip(normalized);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error('Error fetching transport details:', e);
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
    let acceptedHandler;
    let updateHandler;
    let captainAssignedHandler;
    let captainAcceptedHandler;
    
    if (socket) {
      acceptedHandler = (payload) => {
        if (payload?.ride?._id === id) fetchData();
      };
      updateHandler = (payload) => {
        if (payload?.ride?._id === id) fetchData();
      };
      captainAssignedHandler = (payload) => {
        console.log('Captain assigned:', payload);
        fetchData(); // Refresh data to show captain info
      };
      captainAcceptedHandler = (payload) => {
        console.log('Captain accepted:', payload);
        fetchData(); // Refresh data to show captain info
      };
      
      socket.emit('user:subscribe-ride', { rideId: id });
      socket.on('ride-accepted', acceptedHandler);
      socket.on('ride-updated', updateHandler);
      socket.on('captain:assigned', captainAssignedHandler);
      socket.on('captain:accepted', captainAcceptedHandler);
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('ride-accepted', acceptedHandler);
        socket.off('ride-updated', updateHandler);
        socket.off('captain:assigned', captainAssignedHandler);
        socket.off('captain:accepted', captainAcceptedHandler);
      }
    };
  }, [id, user?.id]);

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

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Missing Trip ID</Text>
          <Text style={styles.errorText}>Unable to load tracking information</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && !trip) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tracking details...</Text>
        </View>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="search" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorText}>The requested trip could not be found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(trip.status);

    return (
        <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Transport Ride</Text>
          <Text style={styles.headerSubtitle}>Trip #{trip._id?.slice(-6)}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="car" size={24} color={Colors.primary} />
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
              <Text style={styles.statusDate}>Created: {formatDate(trip.createdAt)}</Text>
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
                  <Text style={styles.routeAddress}>{trip.pickup?.address}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#FF3B30' }]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>Destination</Text>
                  <Text style={styles.routeAddress}>{trip.destination?.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ride Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="car" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Ride Details</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fare</Text>
                <Text style={styles.infoValue}>₹{trip.fareEstimate}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoValue}>{trip.vehicleType}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>{trip.distanceKm} km</Text>
              </View>
            </View>
          </View>

          {/* Captain Details (if accepted) */}
          {(trip.status === 'accepted' || trip.status === 'in_progress' || trip.status === 'completed') && trip.captainRef && (
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
                      {trip.captainRef.fullName || trip.captainRef.name || 'Assigned Captain'}
                    </Text>
                    <Text style={styles.captainMeta}>
                      {trip.captainRef.phone || 'Phone pending'}
                    </Text>
                    {(trip.captainRef.vehicleType || trip.captainRef.vehicleSubType) && (
                      <Text style={styles.captainMeta}>
                        {trip.captainRef.vehicleType}
                        {trip.captainRef.vehicleSubType ? ` • ${trip.captainRef.vehicleSubType}` : ''}
                      </Text>
                    )}
                  </View>
                  {trip.captainRef.phone && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${trip.captainRef.phone}`)}
                    >
                      <Ionicons name="call" size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.captainSubtext}>
                  Your captain will contact you soon
                </Text>
              </View>
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
  // Buttons
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
  },
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
  }
});


