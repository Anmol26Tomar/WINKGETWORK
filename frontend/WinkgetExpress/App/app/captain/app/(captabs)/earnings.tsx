import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react-native';
import { earningsService } from '../../services/api';
import type { Earning, EarningSummary } from '../../types';
import { useDummyData } from '../../services/dummyData';

export default function EarningsScreen() {
  const dummyData = useDummyData();
  const [summary, setSummary] = useState<EarningSummary>(dummyData.earningSummary);
  const [earnings, setEarnings] = useState<Earning[]>(dummyData.earnings);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  const fetchEarnings = async () => {
    try {
      const [summaryData, earningsData] = await Promise.all([
        earningsService.getSummary(),
        earningsService.getEarnings(),
      ]);
      setSummary(summaryData);
      setEarnings(earningsData);
    } catch (error) {
      console.log('Using dummy data');
      setSummary(dummyData.earningSummary);
      setEarnings(dummyData.earnings);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  const getTodayChange = () => {
    const yesterday = summary.week - summary.today;
    const change = summary.today - (yesterday / 7);
    const percentage = ((change / (yesterday / 7)) * 100).toFixed(1);
    return { change, percentage };
  };

  const todayChange = getTodayChange();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>Track your income</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summarySection}>
          <View style={styles.mainCard}>
            <View style={styles.mainCardHeader}>
              <View style={styles.mainCardIconContainer}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <View style={styles.mainCardTitleContainer}>
                <Text style={styles.mainCardLabel}>Total Earnings</Text>
                <View style={styles.changeIndicator}>
                  <ArrowUpRight size={14} color="#10B981" />
                  <Text style={styles.changeText}>+{todayChange.percentage}%</Text>
                </View>
              </View>
            </View>
            <Text style={styles.mainCardAmount}>{formatCurrency(summary.total)}</Text>
            <Text style={styles.mainCardSubtext}>Lifetime earnings across all trips</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.summaryCardToday]}>
              <View style={styles.summaryCardIcon}>
                <DollarSign size={18} color="#2563EB" />
              </View>
              <Text style={styles.summaryCardLabel}>Today</Text>
              <Text style={[styles.summaryCardAmount, { color: '#2563EB' }]}>
                {formatCurrency(summary.today)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardIcon}>
                <Calendar size={18} color="#6B7280" />
              </View>
              <Text style={styles.summaryCardLabel}>This Week</Text>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(summary.week)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardIcon}>
                <Calendar size={18} color="#6B7280" />
              </View>
              <Text style={styles.summaryCardLabel}>This Month</Text>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(summary.month)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPeriod === 'week' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedPeriod === 'week' && styles.filterButtonTextActive,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPeriod === 'month' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedPeriod === 'month' && styles.filterButtonTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.transactionCount}>{earnings.length} transactions</Text>
          </View>
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySubtext}>
                Complete trips to start earning
              </Text>
            </View>
          ) : (
            earnings.map((earning, index) => (
              <View key={earning.id} style={styles.earningCard}>
                <View style={styles.earningLeft}>
                  <View style={styles.iconContainer}>
                    <DollarSign size={20} color="#10B981" />
                  </View>
                  <View style={styles.earningInfo}>
                    <Text style={styles.earningTitle}>Trip Payment</Text>
                    <View style={styles.earningMeta}>
                      <Calendar size={12} color="#9CA3AF" />
                      <Text style={styles.earningDate}>
                        {formatDate(earning.date)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.earningRight}>
                  <Text style={styles.earningAmount}>
                    {formatCurrency(earning.amount)}
                  </Text>
                  {index === 0 && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mainCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardTitleContainer: {
    flex: 1,
  },
  mainCardLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  mainCardAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },
  mainCardSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  summaryCardToday: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  summaryCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryCardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  filterSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#2563EB',
  },
  historySection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  transactionCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  earningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  earningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningInfo: {
    flex: 1,
  },
  earningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  earningMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  earningRight: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  newBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
