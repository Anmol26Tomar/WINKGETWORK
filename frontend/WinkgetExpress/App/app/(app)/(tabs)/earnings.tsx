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
import { MapPin, Circle, CalendarDays, Wallet } from 'lucide-react-native';
// Restore original imports
import { useAuth } from '@/context/AuthContext';
import { captainTripApi } from '../lib/api';
import AlertBox from '@/components/ui/AlertBox';

// Define a type for the filter periods
type Period = 'today' | 'week' | 'month' | 'year' | 'total';

// --- New Color Theme ---
const Colors = {
  primary: '#10B981',    // green
  accent: '#ECFDF5',      // light green
  textDark: '#065F46',    // dark green
  text: '#1F2937',        // dark text
  mutedText: '#6B7280',   // grey text
  background: '#F9FAFB',  // light bg
  border: '#E5E7EB',      // grey border
  card: '#FFFFFF',        // white
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
        captainTripApi.getAllTrips()
      ]);

      const calculatedEarnings = {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        total: 0,
      };

      if (tripsResponse.data && tripsResponse.data.data && Array.isArray(tripsResponse.data.data)) {
        const actualTrips = tripsResponse.data.data;
        setTrips(actualTrips); // Save trips for the list
        
        const startOfToday = getStartDate('today');
        const startOfWeek = getStartDate('week');
        const startOfMonth = getStartDate('month');
        const startOfYear = getStartDate('year');
        
        const completedTrips = actualTrips.filter(
          (trip: Trip) => trip.status === 'delivered' || trip.status === 'COMPLETED'
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
    const isCompleted = (status: string) => status === 'delivered' || status === 'COMPLETED';
    if (filterPeriod === 'total') {
      return trips.filter(trip => isCompleted(trip.status));
    }
    return trips.filter((trip: Trip) => {
      const tripDate = new Date(trip.createdAt);
      return tripDate >= startDate && tripDate <= now && isCompleted(trip.status);
    });
  }, [trips, filterPeriod]);

  // Helper to format labels
  const getPeriodLabel = (period: Period): string => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'total': return 'All Time';
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your income and trip history</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* --- Top Stats Grid --- */}
        <View style={styles.topStatsGrid}>
          <View style={[styles.statCard, { borderLeftColor: Colors.blue }]}>
            <Wallet size={28} color={Colors.blue} style={styles.statCardIcon} />
            <Text style={styles.statCardTitle}>Wallet Balance</Text>
            <Text style={[styles.statCardAmount, { color: Colors.blue }]}>
              ₹{walletBalance.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.purple }]}>
            <Text style={styles.statCardEmojiIcon}>📈</Text>
            <Text style={styles.statCardTitle}>Total Earnings</Text>
            <Text style={[styles.statCardAmount, { color: Colors.purple }]}>
              ₹{earnings.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* --- Earnings Summary Card (Filtered) --- */}
        <View style={[styles.summaryCard, showFilter && styles.summaryCardOpen]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{periodLabel} Earnings</Text>
            <View style={styles.filterAnchor}>
              <Pressable style={styles.filterButton} onPress={() => setShowFilter(v => !v)}>
                <Text style={styles.filterButtonText}>
                  {periodLabel} ▾
                </Text>
              </Pressable>
              {showFilter && (
                <View style={styles.dropdownMenu}>
                  {filterOptions.map(p => (
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
                          filterPeriod === p && styles.filterMenuItemTextActive,
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
            <Text style={styles.summaryAmount}>
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
              message={`You haven't completed any trips in this period. Try changing the filter to a wider range.`} 
              variant="info" 
            />
          </View>
        ) : (
          <View style={styles.tripListContainer}>
            {filteredTrips.map((trip: Trip) => (
              <Pressable key={trip._id} style={styles.tripItem}>
                {/* 1. Timeline Gutter */}
                <View style={styles.tripTimelineGutter}>
                  <Circle size={18} color={Colors.primary} fill={Colors.primary} />
                  <View style={styles.tripTimelineConnector} />
                  <MapPin size={18} color={Colors.mutedText} />
                </View>

                {/* 2. Main Content */}
                <View style={styles.tripContent}>
                  <Text style={styles.tripAddress} numberOfLines={1}>
                    {trip.pickupLocation?.address || 'Unknown Pickup'}
                  </Text>
                  <Text style={[styles.tripAddress, styles.tripAddressDropoff]} numberOfLines={1}>
                    {trip.dropoffLocation?.address || 'Unknown Dropoff'}
                  </Text>
                </View>

                {/* 3. Fare & Date Gutter */}
                <View style={styles.tripFareGutter}>
                  <Text style={styles.tripFare}>+₹{(trip.fare || 0).toFixed(2)}</Text>
                  <View style={styles.tripDateContainer}>
                    <CalendarDays size={14} color={Colors.mutedText} />
                    <Text style={styles.tripDate}>{formatTripDate(trip.createdAt)}</Text>
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
    padding:8,
    paddingTop:8,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 20, // Use safeareaview, so less padding needed
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 36, // Larger text
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18, // Larger text
    color: Colors.mutedText,
  },
  
  // --- Top Stats Grid ---
  topStatsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8, // "Popped up"
    borderLeftWidth: 5,
  },
  statCardIcon: {
    marginBottom: 8,
  },
  statCardEmojiIcon: {
    fontSize: 28, // Emoji icon
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 15, // Larger text
    color: Colors.mutedText,
    fontWeight: '500',
    marginBottom: 4,
  },
  statCardAmount: {
    fontSize: 28, // Larger text
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
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15, // Larger text
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
    fontSize: 15, // Larger text
    fontWeight: '600',
  },
  filterMenuItemTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 4, 
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10, // "Popped up"
    zIndex: 2,
    minHeight: 160,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
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
    fontSize: 20, // Larger text
    color: Colors.text,
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: 48, // Larger text
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  summarySubtext: {
    fontSize: 16, // Larger text
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
    fontSize: 22, // Larger text
    fontWeight: 'bold',
    color: Colors.text,
  },
  historyCount: {
    fontSize: 15, // Larger text
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
  tripItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the top for timeline
    backgroundColor: Colors.card,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4, // "Popped up"
  },
  tripTimelineGutter: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tripTimelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border, // Use solid color
    marginVertical: 4,
  },
  tripContent: {
    flex: 1,
    paddingHorizontal: 8,
    marginTop: -2, // Align text with top icon
  },
  tripAddress: {
    fontSize: 16, // Larger text
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  tripAddressDropoff: {
    fontSize: 15, // Larger text
    fontWeight: '500',
    color: Colors.mutedText,
    marginTop: 16, // Space for the connector
  },
  tripFareGutter: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  tripFare: {
    fontSize: 18, // Larger text
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  tripDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripDate: {
    fontSize: 13, // Larger text
    color: Colors.mutedText,
    fontWeight: '500',
  },
  // --- End of NEW Trip History Styles ---

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
