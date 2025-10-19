import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { ArrowLeft, Headphones, Building2, RotateCcw, Filter, CheckCircle, XCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react-native';
import { earningsService } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import type { Earning, EarningSummary } from '../../types';

export default function TransferEarningsScreen() {
  const { captain } = useAuth();
  const [activeTab, setActiveTab] = useState('wallet');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<EarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [earningsData, summaryData] = await Promise.all([
        earningsService.getEarnings(),
        earningsService.getSummary(),
      ]);
      setEarnings(earningsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarningsData();
  };

  const handleBack = () => {
    // Navigation logic here
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Contact support for assistance with earnings');
  };

  const handleMoneyTransfer = () => {
    Alert.alert('Money Transfer', 'Transfer your earnings to bank account');
  };

  const handleTransferLeft = () => {
    Alert.alert('Transfer Left', 'You have 3 transfers remaining this week');
  };

  const formatAmount = (amount: number) => {
    return `₹${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderTransactionItem = ({ item }: { item: Earning }) => (
    <Animated.View
      style={[
        styles.transactionItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.transactionContent}>
        <View style={styles.transactionIcon}>
          <Building2 size={20} color="#FFF" />
          <CheckCircle size={12} color="#22C55E" style={styles.statusIcon} />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {item.type === 'transport' ? 'Transport Trip' : 'Parcel Delivery'}
          </Text>
          <Text style={styles.transferId}>Trip ID: {item.id}</Text>
          <Text style={styles.transactionTime}>{formatTime(item.date)}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { color: '#22C55E' }]}>
            + {formatAmount(item.amount)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const getWalletBalance = () => {
    return summary?.total || 0;
  };

  const getTransferLeft = () => {
    // Mock data - in real app this would come from backend
    return 3;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FF6B35" />
      
      {/* Background with decorative elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Earnings</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Inner Header */}
        <View style={styles.innerHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.innerBackButton}>
            <ArrowLeft size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.innerTitle}>Earnings</Text>
          <TouchableOpacity onPress={handleHelp} style={styles.helpButton}>
            <Headphones size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'wallet' && styles.activeTab]}
            onPress={() => setActiveTab('wallet')}
          >
            <Text style={[styles.tabText, activeTab === 'wallet' && styles.activeTabText]}>
              Wallet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance Section */}
        <Animated.View
          style={[
            styles.walletSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.balanceAmount}>₹ {getWalletBalance().toFixed(2)}</Text>
          <Text style={styles.balanceLabel}>Your Wallet Balance</Text>
        </Animated.View>

        {/* Action Cards */}
        <Animated.View
          style={[
            styles.actionCardsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.actionCard} onPress={handleMoneyTransfer}>
            <Building2 size={24} color="#FF6B35" />
            <Text style={styles.actionCardText}>Money Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleTransferLeft}>
            <RotateCcw size={24} color="#FF6B35" />
            <Text style={styles.actionCardText}>Transfer Left: {getTransferLeft()}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Text */}
        <Animated.View
          style={[
            styles.infoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.infoText}>
            Money Transfer renews every Monday! 
            <Text style={styles.learnMoreText}> Learn More</Text>
          </Text>
        </Animated.View>

        {/* Transaction History */}
        <Animated.View
          style={[
            styles.historySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Transaction History</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#6B7280" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Tabs */}
          <View style={styles.subTabContainer}>
            <TouchableOpacity
              style={[styles.subTab, activeSubTab === 'all' && styles.activeSubTab]}
              onPress={() => setActiveSubTab('all')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'all' && styles.activeSubTabText]}>
                All transaction
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, activeSubTab === 'pending' && styles.activeSubTab]}
              onPress={() => setActiveSubTab('pending')}
            >
              <Text style={[styles.subTabText, activeSubTab === 'pending' && styles.activeSubTabText]}>
                Pending
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          <FlatList
            data={earnings}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.transactionList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <DollarSign size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No transactions yet</Text>
                <Text style={styles.emptyStateSubtext}>Complete trips to see your earnings</Text>
              </View>
            }
          />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF8C42',
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: 'absolute',
    top: 200,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF8C42',
    opacity: 0.2,
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C42',
    opacity: 0.25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FF6B35',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  innerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  innerBackButton: {
    padding: 8,
  },
  innerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  helpButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  walletSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  learnMoreText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  subTabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  subTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSubTab: {
    borderBottomColor: '#FF6B35',
  },
  subTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeSubTabText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  transactionList: {
    flex: 1,
  },
  transactionItem: {
    marginBottom: 12,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  statusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  transferId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});