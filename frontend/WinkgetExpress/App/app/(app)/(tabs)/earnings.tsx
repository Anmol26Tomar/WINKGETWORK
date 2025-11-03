import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  // Use SafeAreaView for mobile
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Use lucide-react-native for mobile icons
import { MapPin, Circle, CalendarDays } from 'lucide-react-native';
// Restore original imports
import { useAuth } from '@/context/AuthContext';
import { captainTripApi } from '../lib/api';
import AlertBox from '@/components/ui/AlertBox';

// Define a type for the filter periods
type Period = 'today' | 'week' | 'month' | 'year' | 'total';

// --- New Color Theme ---
const Colors = {
  primary: '#10B981', // green
  accent: '#ECFDF5', // light green
  textDark: '#065F46', // dark green
  text: '#1F2937', // dark text
  mutedText: '#6B7280', // grey text
  background: '#F9FAFB', // light bg
  border: '#E5E7EB', // grey border
  card: '#FFFFFF', // white
  danger: '#DC2626',
  blue: '#2563EB',
  purple: '#7C3AED',
  orange: '#F59E0B',
  shadow: '#000000',
  textOnPrimary: '#FFFFFF', // White text on green bg
};
// --- End New Color Theme ---

// Define a basic interface for a Trip
interface Trip {
  _id: string;
  passengerName: string; // Or passengerId
  createdAt: string; // ISO date string
  fare: number;
  pickupLocation: {
    address: string;
  };
  dropoffLocation: {
    address: string;
  };
  status: 'COMPLETED' | 'CANCELLED' | 'delivered' | 'accepted' | string;
}

export default function EarningsScreen() {
  const { captain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    total: 0,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [transfersLeft, setTransfersLeft] = useState(3);

  const [trips, setTrips] = useState<Trip[]>([]);

  const [filterPeriod, setFilterPeriod] = useState<Period>('week');
  const [showFilter, setShowFilter] = useState(false);

  // Helper to get start date for filtering
  const getStartDate = (period: Period): Date => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'total':
        return new Date(0);
    }
    return start;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [balanceResponse, tripsResponse] = await Promise.all([
        captainTripApi.getWalletBalance(),
        captainTripApi.getAllTrips(),
      ]);

      const calculatedEarnings = {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        total: 0,
      };

      if (
        tripsResponse.data &&
        tripsResponse.data.data &&
        Array.isArray(tripsResponse.data.data)
      ) {
        const actualTrips = tripsResponse.data.data;
        setTrips(actualTrips); // Save trips for the list

        const startOfToday = getStartDate('today');
        const startOfWeek = getStartDate('week');
        const startOfMonth = getStartDate('month');
        const startOfYear = getStartDate('year');

        const completedTrips = actualTrips.filter(
          (trip: Trip) =>
            trip.status === 'delivered' || trip.status === 'COMPLETED'
        );

        for (const trip of completedTrips) {
          const tripDate = new Date(trip.createdAt);
          const fare = trip.fare || 0;
          calculatedEarnings.total += fare;
          if (tripDate >= startOfYear) {
            calculatedEarnings.year += fare;
            if (tripDate >= startOfMonth) {
              calculatedEarnings.month += fare;
              if (tripDate >= startOfWeek) {
                calculatedEarnings.week += fare;
                if (tripDate >= startOfToday) {
                  calculatedEarnings.today += fare;
                }
              }
            }
          }
        }
        setEarnings(calculatedEarnings);
      } else {
        setEarnings(calculatedEarnings);
      }

      if (balanceResponse.data) {
        const balanceData = balanceResponse.data.data || balanceResponse.data;
        setWalletBalance(balanceData.balance || 0);
        setTransfersLeft(balanceData.transfersLeft || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setEarnings({ today: 0, week: 0, month: 0, year: 0, total: 0 });
      setWalletBalance(0);
      setTransfersLeft(3);
      setTrips([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const filteredTrips = useMemo(() => {
    if (!trips || trips.length === 0) return [];
    const startDate = getStartDate(filterPeriod);
    const now = new Date();
    const isCompleted = (status: string) =>
      status === 'delivered' || status === 'COMPLETED';
    if (filterPeriod === 'total') {
      return trips.filter((trip) => isCompleted(trip.status));
    }
    return trips.filter((trip: Trip) => {
      const tripDate = new Date(trip.createdAt);
      return (
        tripDate >= startDate && tripDate <= now && isCompleted(trip.status)
      );
    });
  }, [trips, filterPeriod]);

  // Helper to format labels
  const getPeriodLabel = (period: Period): string => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'total':
        return 'All Time';
    }
  };

  // Helper to format date strings (shortened version for new design)
  const formatTripDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return dateString.split('T')[0];
    }
  };

  if (loading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  const displayedEarning = (earnings[filterPeriod] || 0).toFixed(2);
  const periodLabel = getPeriodLabel(filterPeriod);
  const filterOptions: Period[] = ['today', 'week', 'month', 'year', 'total'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Blue Banner Header */}
      <View style={styles.blueBanner}>
        <Text style={styles.bannerTitle}>Earnings</Text>
        <Text style={styles.bannerSubtitle}>Track your income and trip history</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* --- Top Stats Grid --- */}
        <View style={styles.topStatsGrid}>
          {/* Removed Wallet Card, this is now the only card */}
          <View style={[styles.statCard, { borderLeftColor: Colors.blue, backgroundColor: Colors.blue + '0D' }]}>
            <View style={styles.statCardRow}>
              <Text style={styles.statCardEmojiIcon}>📈</Text>
              <View style={styles.statCardContent}>
                <Text style={styles.statCardTitle}>Total All-Time Earnings</Text>
                <Text style={[styles.statCardAmount, { color: Colors.blue }]}>
                  ₹{earnings.total.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Earnings Summary Card (Filtered) --- */}
        <View
          style={[
            styles.summaryCard,
            { borderLeftColor: Colors.blue }, // Changed to blue like home page
            showFilter && styles.summaryCardOpen,
          ]}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{periodLabel} Earnings</Text>
            <View style={styles.filterAnchor}>
              <Pressable
                style={styles.filterButton}
                onPress={() => setShowFilter((v) => !v)}
              >
                <Text style={styles.filterButtonText}>
                  {periodLabel} ▾
                </Text>
              </Pressable>
              {showFilter && (
                <View style={styles.dropdownMenu}>
                  {filterOptions.map((p) => (
                    <Pressable
                      key={p}
                      style={[
                        styles.filterMenuItem,
                        filterPeriod === p && styles.filterMenuItemActive,
                      ]}
                      onPress={() => {
                        setFilterPeriod(p);
                        setShowFilter(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterMenuItemText,
                          filterPeriod === p &&
                            styles.filterMenuItemTextActive,
                        ]}
                      >
                        {getPeriodLabel(p)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryAmount, { color: Colors.blue }]}>
              ₹{displayedEarning}
            </Text>
            <Text style={styles.summarySubtext}>
              {filteredTrips.length} completed trips
            </Text>
          </View>
        </View>

        {/* --- NEW Trip History Section --- */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Trip History ({periodLabel})</Text>
          <Text style={styles.historyCount}>{filteredTrips.length} trips</Text>
        </View>

        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertBox
              title="No Trips Found"
              message={"You haven't completed any trips in this period. Try changing the filter to a wider range."}
              variant="info"
            />
          </View>
        ) : (
          <View style={styles.tripListContainer}>
            {filteredTrips.map((trip: Trip) => (
              <Pressable key={trip._id} style={styles.tripItem}>
                {/* 1. Header (Fare & Date) */}
                <View style={styles.tripHeader}>
                  <Text style={styles.tripFare}>
                    ₹{(trip.fare || 0).toFixed(2)}
                  </Text>
                  <View style={styles.tripDateContainer}>
                    <CalendarDays size={14} color={Colors.mutedText} />
                    <Text style={styles.tripDate}>
                      {formatTripDate(trip.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* 2. Body (Timeline & Address) */}
                <View style={styles.tripBody}>
                  <View style={styles.tripTimelineGutter}>
                    <Circle
                      size={16}
                      color={Colors.blue}
                      fill={Colors.blue}
                    />
                    <View style={styles.tripTimelineConnector} />
                    <MapPin size={16} color={Colors.mutedText} strokeWidth={2.5} />
                  </View>
                  <View style={styles.tripContent}>
                    <Text style={styles.tripAddress} numberOfLines={1}>
                      {trip.pickupLocation?.address || 'Unknown Pickup'}
                    </Text>
                    <Text
                      style={[styles.tripAddress, styles.tripAddressDropoff]}
                      numberOfLines={1}
                    >
                      {trip.dropoffLocation?.address || 'Unknown Dropoff'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- React Native StyleSheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blue,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  blueBanner: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.blue,
    minHeight: 120,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // --- Top Stats Grid ---
  topStatsGrid: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24, // Increased spacing
  },
  statCard: {
    // This card is now full-width, no flex: 1 needed
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
  },
  statCardIcon: {
    marginBottom: 8,
  },
  statCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statCardEmojiIcon: {
    fontSize: 32, // Emoji icon
  },
  statCardContent: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 15,
    color: Colors.mutedText,
    fontWeight: '500',
    marginBottom: 4,
  },
  statCardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  // --- Filterable Summary Card ---
  filterAnchor: {
    position: 'relative',
    zIndex: 101,
  },
  filterButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonText: {
    color: Colors.textDark, // Changed to darker text
    fontWeight: '600',
    fontSize: 15,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 12,
    width: 150,
  },
  filterMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  filterMenuItemActive: {
    backgroundColor: Colors.accent,
  },
  filterMenuItemText: {
    color: Colors.mutedText,
    fontSize: 15,
    fontWeight: '600',
  },
  filterMenuItemTextActive: {
    color: Colors.primary, // Keep this green
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginBottom: 24, // Consistent spacing
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
    minHeight: 90,
    borderLeftWidth: 5,
    // borderLeftColor set dynamically
  },
  summaryCardOpen: {
    paddingBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    // color set dynamically (to blue)
  },
  summaryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  summarySubtext: {
    fontSize: 16,
    color: Colors.mutedText,
    marginTop: 4,
    fontWeight: '500',
  },

  // --- NEW Trip History Styles ---
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  historyCount: {
    fontSize: 15,
    color: Colors.mutedText,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tripListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // --- Improved Trip Item ---
  tripItem: {
    backgroundColor: Colors.card,
    padding: 16, // More padding
    borderRadius: 16, // More rounded
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 }, // Softer shadow
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3, // Softer elevation
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Space between header and body
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  tripBody: {
    flexDirection: 'row',
  },
  tripTimelineGutter: {
    alignItems: 'center',
    marginRight: 12, // Use margin for spacing
  },
  tripTimelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
    minHeight: 20, // Ensure connector has height
  },
  tripContent: {
    flex: 1,
    paddingTop: 0, // Align with top icon
  },
  tripAddress: {
    fontSize: 15, // Slightly smaller for balance
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  tripAddressDropoff: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.mutedText,
    marginTop: 18, // Space for the connector
  },
  tripFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  tripDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Use gap
  },
  tripDate: {
    fontSize: 14, // Slightly larger date
    color: Colors.mutedText,
    fontWeight: '500',
  },
  // --- End of Improved Trip Item ---

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
});