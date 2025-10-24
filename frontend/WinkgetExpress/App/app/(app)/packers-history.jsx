import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/colors';
import LoadingOverlay from '@/components/LoadingOverlay';
import { getPackersHistory } from '@/services/packersService';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: Colors.warning || '#FFA500', icon: '⏳' },
    accepted: { label: 'Accepted', color: Colors.info || '#007AFF', icon: '✅' },
    in_transit: { label: 'In Transit', color: Colors.primary, icon: '🚚' },
    delivered: { label: 'Delivered', color: Colors.success || '#34C759', icon: '📦' },
    cancelled: { label: 'Cancelled', color: Colors.error || '#FF3B30', icon: '❌' },
};

export default function PackersHistoryScreen() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadBookings = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);
            
            console.log('Loading Packers & Movers history...');
            const data = await getPackersHistory();
            setBookings(data.bookings || []);
            console.log('Found bookings:', data.bookings?.length || 0);
        } catch (e) {
            console.error('Error loading packers history:', e);
            Alert.alert('Error', e.message || 'Failed to load Packers & Movers history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const onRefresh = () => {
        loadBookings(true);
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

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    };

    const getTotalItems = (selectedItems) => {
        return Object.values(selectedItems || {}).reduce((sum, qty) => sum + Number(qty || 0), 0);
    };

    const onBookingPress = (bookingId) => {
        router.push({ pathname: '/packers-tracking', params: { id: bookingId } });
    };

    const renderBookingItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.status);
        const totalItems = getTotalItems(item.selectedItems);
        
        return (
            <TouchableOpacity 
                style={styles.bookingCard} 
                onPress={() => onBookingPress(item._id)}
            >
                <View style={styles.bookingHeader}>
                    <Text style={styles.bookingId}>#{item._id?.slice(-6)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                        <Text style={styles.statusText}>{statusConfig.label}</Text>
                    </View>
                </View>
                
                <View style={styles.bookingDetails}>
                    <Text style={styles.routeText}>
                        {item.pickup?.address?.split(',')[0]} → {item.delivery?.address?.split(',')[0]}
                    </Text>
                    <Text style={styles.receiverText}>
                        To: {item.receiverName} • {item.receiverContact}
                    </Text>
                    <Text style={styles.itemsText}>
                        Items: {totalItems} • ₹{item.fareEstimate?.toFixed?.(2) || item.fareEstimate}
                    </Text>
                </View>
                
                <View style={styles.bookingFooter}>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    <Text style={styles.serviceText}>Packers & Movers</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No Packers & Movers History</Text>
            <Text style={styles.emptyDescription}>
                You haven't created any Packers & Movers bookings yet
            </Text>
            <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/')}
            >
                <Text style={styles.createButtonText}>Create Booking</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return <LoadingOverlay visible={true} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Packers & Movers</Text>
                <View style={styles.placeholder} />
            </View>

            <FlatList
                data={bookings}
                keyExtractor={(item) => item._id}
                renderItem={renderBookingItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text
    },
    placeholder: {
        width: 40,
        height: 40
    },
    listContainer: { 
        padding: Spacing.lg 
    },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm
    },
    bookingId: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.md
    },
    statusIcon: {
        fontSize: 12,
        marginRight: 4
    },
    statusText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 11
    },
    bookingDetails: {
        marginBottom: Spacing.sm
    },
    routeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4
    },
    receiverText: {
        fontSize: 12,
        color: Colors.mutedText,
        marginBottom: 2
    },
    itemsText: {
        fontSize: 12,
        color: Colors.mutedText
    },
    bookingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateText: {
        fontSize: 11,
        color: Colors.mutedText
    },
    serviceText: {
        fontSize: 11,
        color: Colors.mutedText,
        textTransform: 'capitalize'
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xl * 2
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: Spacing.md
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.sm
    },
    emptyDescription: {
        fontSize: 14,
        color: Colors.mutedText,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg
    },
    createButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.lg
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    }
});
