import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from './LoadingOverlay';
import { getPackersHistory } from '../services/packersService';
import { useRouter } from 'expo-router';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: Colors.warning || '#FFA500', icon: '⏳' },
  accepted: { label: 'Accepted', color: Colors.info || '#007AFF', icon: '✅' },
  in_transit: { label: 'In Transit', color: Colors.primary, icon: '🚚' },
  delivered: { label: 'Delivered', color: Colors.success || '#34C759', icon: '📦' },
  cancelled: { label: 'Cancelled', color: Colors.error || '#FF3B30', icon: '❌' },
};

export default function PackersHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      const data = await getPackersHistory();
      setItems(data.bookings || []);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to load packers history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => load(true);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const renderItem = ({ item }) => {
    const statusCfg = getStatusConfig(item.status);
    const totalQty = Object.values(item.selectedItems || {}).reduce((s, n) => s + Number(n || 0), 0);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/packers-tracking', params: { id: item._id } })}>
        <View style={styles.header}>
          <Text style={styles.id}>#{item._id?.slice(-6)}</Text>
          <View style={[styles.badge, { backgroundColor: statusCfg.color }]}>
            <Text style={styles.badgeIcon}>{statusCfg.icon}</Text>
            <Text style={styles.badgeText}>{statusCfg.label}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.route}>{item.pickup?.address?.split(',')[0]} → {item.delivery?.address?.split(',')[0]}</Text>
          <Text style={styles.sub}>Items: {totalQty} • ₹{item.fareEstimate}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.type}>Packers & Movers</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingOverlay visible={true} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}> 
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No Packers & Movers history</Text>
            <Text style={styles.emptyDesc}>Create your first move to see it here</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg },
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  id: { fontSize: 16, fontWeight: '700', color: Colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.md },
  badgeIcon: { fontSize: 12, marginRight: 4, color: '#fff' },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 11 },
  body: { marginBottom: Spacing.sm },
  route: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 12, color: Colors.mutedText },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 11, color: Colors.mutedText },
  type: { fontSize: 11, color: Colors.mutedText },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyDesc: { fontSize: 14, color: Colors.mutedText, textAlign: 'center', paddingHorizontal: Spacing.lg },
});


