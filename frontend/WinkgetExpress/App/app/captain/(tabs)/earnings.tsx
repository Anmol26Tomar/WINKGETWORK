import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function EarningsScreen() {
  const { captain } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your income</Text>
      </View>

      <View style={styles.totalEarningsCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>₹0.00</Text>
        <Text style={styles.totalDescription}>Lifetime earnings across all trips</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodContainer}>
        <View style={[styles.periodCard, styles.periodCardActive]}>
          <Text style={styles.periodAmount}>₹0.00</Text>
          <Text style={styles.periodLabel}>Today</Text>
        </View>
        <View style={styles.periodCard}>
          <Text style={styles.periodAmount}>₹0.00</Text>
          <Text style={styles.periodLabel}>This Week</Text>
        </View>
        <View style={styles.periodCard}>
          <Text style={styles.periodAmount}>₹0.00</Text>
          <Text style={styles.periodLabel}>This Month</Text>
        </View>
      </ScrollView>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        <Text style={styles.historyCount}>0 transactions</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>$</Text>
        <Text style={styles.emptyText}>No earnings yet</Text>
        <Text style={styles.emptySubtext}>Complete trips to start</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 60,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  totalEarningsCard: {
    backgroundColor: '#333',
    margin: 20,
    padding: 24,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FDB813',
    marginBottom: 8,
  },
  totalDescription: {
    fontSize: 14,
    color: '#999',
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodCard: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  periodCardActive: {
    backgroundColor: '#FDB813',
  },
  periodAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 14,
    color: '#999',
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
    color: '#fff',
  },
  historyCount: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#333',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
