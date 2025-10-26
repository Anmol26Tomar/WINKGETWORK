import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { captainTripApi } from '../lib/api';

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#86CB92" />
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

      <View style={styles.totalEarningsCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>₹{earnings.total.toFixed(2)}</Text>
        <Text style={styles.totalDescription}>Lifetime earnings across all trips</Text>
      </View>

      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Your Wallet</Text>
        <Text style={styles.walletAmount}>₹ {walletBalance.toFixed(2)}</Text>
        <View style={styles.walletActions}>
          <Pressable style={styles.walletActionButton}>
            <Text style={styles.walletActionIcon}>🏦</Text>
            <Text style={styles.walletActionText}>Money Transfer</Text>
          </Pressable>
          <Pressable style={styles.walletActionButton}>
            <Text style={styles.walletActionIcon}>🔄</Text>
            <Text style={styles.walletActionText}>Transfer Left: {transfersLeft}</Text>
          </Pressable>
        </View>
        <Text style={styles.walletInfoText}>
          Money Transfer renews every Monday! Learn More
        </Text>
      </View>

      <View style={styles.periodGrid}>
        <View style={styles.periodRow}>
          <View style={[styles.periodCard, styles.periodCardActive]}>
            <Text style={styles.periodAmount}>₹{earnings.today.toFixed(2)}</Text>
            <Text style={styles.periodLabel}>Today</Text>
          </View>
          <View style={styles.periodCard}>
            <Text style={styles.periodAmount}>₹{earnings.week.toFixed(2)}</Text>
            <Text style={styles.periodLabel}>This Week</Text>
          </View>
        </View>
        <View style={styles.periodRow}>
          <View style={styles.periodCard}>
            <Text style={styles.periodAmount}>₹{earnings.month.toFixed(2)}</Text>
            <Text style={styles.periodLabel}>This Month</Text>
          </View>
          <View style={styles.periodCard}>
            <Text style={styles.periodAmount}>₹{earnings.total.toFixed(2)}</Text>
            <Text style={styles.periodLabel}>All Time</Text>
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        <Text style={styles.historyCount}>{transactions.length} transactions</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>$</Text>
          <Text style={styles.emptyText}>No earnings yet</Text>
          <Text style={styles.emptySubtext}>Complete trips to start</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionsList}>
          {transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Trip #{transaction.tripId}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Text style={styles.transactionAmount}>+₹{transaction.amount}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 60,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  totalEarningsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#86CB92',
    marginBottom: 8,
  },
  totalDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  walletAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#86CB92',
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  walletActionButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#2C3E50',
    fontWeight: '600',
    textAlign: 'center',
  },
  walletInfoText: {
    fontSize: 12,
    color: '#7F8C8D',
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  periodCardActive: {
    backgroundColor: '#86CB92',
  },
  periodAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 14,
    color: '#7F8C8D',
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
    color: '#2C3E50',
  },
  historyCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
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
    color: '#E8E8E8',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
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
    color: '#2C3E50',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86CB92',
  },
});
