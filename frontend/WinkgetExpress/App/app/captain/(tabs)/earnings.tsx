import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { captainTripApi } from '../lib/api';
import { Colors } from '@/constants/colors';
import AlertBox from '@/components/ui/AlertBox';

export default function EarningsScreen() {
  const { captain } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [transfersLeft, setTransfersLeft] = useState(3);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'total'>('week');
  const [showFilterSummary, setShowFilterSummary] = useState(false);
  const [showFilterHistory, setShowFilterHistory] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      // Fetch earnings data from backend
      const response = await captainTripApi.getEarnings();
      if (response.data) {
        setEarnings(response.data);
      }
      
      // Fetch wallet balance
      const balanceResponse = await captainTripApi.getWalletBalance();
      if (balanceResponse.data) {
        setWalletBalance(balanceResponse.data.balance);
        setTransfersLeft(balanceResponse.data.transfersLeft);
      }
      
      // Fetch transaction history
      const transactionsResponse = await captainTripApi.getTransactions();
      if (transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Use default values if API fails
      setEarnings({
        today: 0,
        week: 0,
        month: 0,
        total: 0
      });
      setWalletBalance(0);
      setTransfersLeft(3);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const now = new Date();
    const start = new Date();
    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setTime(0);
    }
    return transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d >= start && d <= now;
    });
  }, [transactions, period]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your income</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Earnings Summary</Text>
            <View style={styles.filterAnchor}>
              <Pressable style={styles.filterButton} onPress={() => setShowFilterSummary(v => !v)}>
              <Text style={styles.filterButtonText}>
                {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'} ▾
              </Text>
              </Pressable>
              {showFilterSummary && (
                <View style={styles.dropdownMenu}>
              {(['today','week','month','total'] as const).map(p => (
                    <Pressable key={p} style={[styles.filterMenuItem, period === p && styles.filterMenuItemActive]} onPress={() => { setPeriod(p); setShowFilterSummary(false); }}>
                      <Text style={[styles.filterMenuItemText, period === p && styles.filterMenuItemTextActive]}>
                    {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
          <Text style={styles.summaryAmount}>
            ₹{(period === 'today' ? earnings.today : period === 'week' ? earnings.week : period === 'month' ? earnings.month : earnings.total).toFixed(2)}
          </Text>
          <Text style={styles.summarySubtext}>
            {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'} earnings
          </Text>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <View style={styles.filterAnchor}>
            <Pressable style={styles.filterButton} onPress={() => setShowFilterHistory(v => !v)}>
              <Text style={styles.filterButtonText}>
                {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'} ▾
              </Text>
            </Pressable>
            {showFilterHistory && (
              <View style={styles.dropdownMenu}>
                {(['today','week','month','total'] as const).map(p => (
                  <Pressable key={p} style={[styles.filterMenuItem, period === p && styles.filterMenuItemActive]} onPress={() => { setPeriod(p); setShowFilterHistory(false); }}>
                    <Text style={[styles.filterMenuItemText, period === p && styles.filterMenuItemTextActive]}>
                      {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>₹</Text>
            <AlertBox title="No earnings in this period" message="Complete trips to start earning. Try switching the filter to a wider range." variant="warning" />
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction: any, index: number) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>Trip #{transaction.tripId}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text style={styles.transactionAmount}>+₹{transaction.amount}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  filterAnchor: {
    position: 'relative',
  },
  filterButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.25,
    borderColor: Colors.border,
    overflow: 'hidden',
    zIndex: 10,
  },
  filterMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.card,
  },
  filterMenuItemActive: {
    backgroundColor: Colors.background,
  },
  filterMenuItemText: {
    color: Colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  filterMenuItemTextActive: {
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.25,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summarySubtext: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 4,
  },
  walletLabel: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 8,
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  walletActionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  walletActionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  walletInfoText: {
    fontSize: 12,
    color: Colors.mutedText,
    textAlign: 'center',
  },
  periodGrid: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  periodCard: {
    backgroundColor: Colors.card,
    padding: 18,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.25,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  periodCardActive: {
    backgroundColor: Colors.primary,
  },
  periodAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 13,
    color: Colors.mutedText,
    textAlign: 'center',
    numberOfLines: 1,
  },
  historySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  historyCount: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.25,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyIcon: {
    fontSize: 64,
    color: Colors.border,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.mutedText,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.mutedText,
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: Colors.mutedText,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
