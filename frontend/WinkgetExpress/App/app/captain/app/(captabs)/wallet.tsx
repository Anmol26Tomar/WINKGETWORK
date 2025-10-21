import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Wallet, IndianRupee, Clock, Filter, ArrowUpRight, HelpCircle } from 'lucide-react-native';
import AnimatedView from '../../components/AnimatedView';
import AnimatedCard from '../../components/AnimatedCard';
import AnimatedButton from '../../components/AnimatedButton';

export default function WalletScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transfer Earnings</Text>
          <Text style={styles.headerSubtitle}>Captain App</Text>
        </View>

        {/* Earnings Navigation */}
        <View style={styles.earningsNav}>
          <Text style={styles.earningsTitle}>Earnings</Text>
          <TouchableOpacity style={styles.supportButton}>
            <HelpCircle size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceAmount}>₹ 0.00</Text>
          <Text style={styles.balanceLabel}>Your Wallet</Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCards}>
          <AnimatedCard style={styles.actionCard}>
            <View style={styles.actionCardIcon}>
              <IndianRupee size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardTitle}>Money Transfer</Text>
          </AnimatedCard>
          
          <AnimatedCard style={styles.actionCard}>
            <View style={styles.actionCardIcon}>
              <ArrowUpRight size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCardTitle}>Transfer Left: 3</Text>
          </AnimatedCard>
        </View>

        <Text style={styles.renewalText}>
          Money Transfer renews every Monday! <Text style={styles.learnMore}>Learn More</Text>
        </Text>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionTitle}>Transaction History</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#6B7280" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionTabs}>
            <TouchableOpacity style={[styles.transactionTab, styles.activeTransactionTab]}>
              <Text style={[styles.transactionTabText, styles.activeTransactionTabText]}>All transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.transactionTab}>
              <Text style={styles.transactionTabText}>Pending</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <IndianRupee size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Complete trips to see your transactions here</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#FB923C',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  earningsNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  earningsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  supportButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FB923C',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FB923C',
    fontWeight: '700',
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  actionCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  renewalText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  learnMore: {
    color: '#FB923C',
    fontWeight: '600',
  },
  transactionSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  transactionTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
  },
  activeTransactionTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FB923C',
  },
  transactionTabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTransactionTabText: {
    color: '#FB923C',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});
