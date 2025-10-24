import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPackersById } from '@/services/packersService';
import { Colors, Spacing, Radius } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

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
    description: 'Your items are on the way'
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
    description: 'Booking was cancelled'
  }
};

export default function PackersTrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getPackersById(id);
      setBooking(data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error('Error fetching booking:', e);
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

  const getTotalItems = () => {
    return Object.values(booking?.selectedItems || {}).reduce((sum, qty) => sum + Number(qty || 0), 0);
  };

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Missing Booking ID</Text>
          <Text style={styles.errorText}>Unable to load tracking information</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tracking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="search" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorText}>The requested booking could not be found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const totalItems = getTotalItems();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Packers & Movers</Text>
          <Text style={styles.headerSubtitle}>Booking #{booking._id?.slice(-6)}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="home" size={24} color={Colors.primary} />
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
              <Text style={styles.statusDate}>Created: {formatDate(booking.createdAt)}</Text>
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
                  <Text style={styles.routeAddress}>{booking.pickup?.address}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#FF3B30' }]} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>Delivery</Text>
                  <Text style={styles.routeAddress}>{booking.delivery?.address}</Text>
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
                <Text style={styles.infoValue}>{booking.receiverName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{booking.receiverContact}</Text>
              </View>
              {booking.receiverAddress && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{booking.receiverAddress}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Items Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Items to Move ({totalItems})</Text>
            </View>
            <View style={styles.itemsContainer}>
              {Object.entries(booking.selectedItems || {}).map(([itemId, qty]) => (
                <View key={itemId} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{itemId}</Text>
                    <Text style={styles.itemQuantity}>×{qty}</Text>
                  </View>
                  <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>{qty}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Fare Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Fare Details</Text>
            </View>
            <View style={styles.fareContainer}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Total Items</Text>
                <Text style={styles.fareValue}>{totalItems}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance</Text>
                <Text style={styles.fareValue}>{booking.distanceKm?.toFixed(1) || 'N/A'} km</Text>
              </View>
              <View style={styles.fareDivider} />
              <View style={styles.fareRow}>
                <Text style={styles.fareTotalLabel}>Total Fare</Text>
                <Text style={styles.fareTotalValue}>₹{booking.fareEstimate?.toFixed(2) || booking.fareEstimate}</Text>
              </View>
            </View>
          </View>

          {/* Additional Notes */}
          {booking.additionalNotes && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Additional Notes</Text>
              </View>
              <Text style={styles.notesText}>{booking.additionalNotes}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={Colors.text} />
              <Text style={styles.secondaryBtnTxt}>Back to History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.primaryBtnTxt}>Contact Support</Text>
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
  // Items
  itemsContainer: {
    gap: Spacing.sm
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: Radius.md
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize'
  },
  itemQuantity: {
    fontSize: 12,
    color: Colors.mutedText,
    marginLeft: Spacing.sm
  },
  itemBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4
  },
  itemBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  // Fare
  fareContainer: {
    gap: Spacing.sm
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm
  },
  fareLabel: {
    fontSize: 14,
    color: Colors.mutedText,
    fontWeight: '600'
  },
  fareValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600'
  },
  fareDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm
  },
  fareTotalLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '700'
  },
  fareTotalValue: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '800'
  },
  // Notes
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: Spacing.md,
    borderRadius: Radius.md
  },
  // Actions
  actionContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg
  },
  primaryBtn: {
    flex: 1,
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


