import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from './LoadingOverlay';
import { getParcelHistory, testConnection } from '../services/parcelService';
import { listTransportByUser } from '../services/transportService';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: Colors.warning || '#FFA500', icon: '⏳' },
    accepted: { label: 'Accepted', color: Colors.info || '#007AFF', icon: '✅' },
    in_transit: { label: 'In Transit', color: Colors.primary, icon: '🚚' },
    delivered: { label: 'Delivered', color: Colors.success || '#34C759', icon: '📦' },
    cancelled: { label: 'Cancelled', color: Colors.error || '#FF3B30', icon: '❌' }
};

export default function ParcelHistory({ serviceType = 'parcel' }) {
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user } = useAuth?.() || {};

    const loadHistory = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);
            
            console.log('Loading parcel history for serviceType:', serviceType);
            
            // Optional connection test in development; never error the UI
            if (__DEV__) {
                try {
                    const testResult = await testConnection();
                    console.log('Connection test result:', testResult);
                } catch (testError) {
                    console.warn('Connection test failed (non-blocking):', testError?.message || testError);
                }
            }
            
            if (serviceType === 'cab' || serviceType === 'bike' || serviceType === 'transport') {
                const uid = user?.id || user?._id;
                if (!uid) throw new Error('User not found');
                const data = await listTransportByUser(uid);
                setParcels((data.transports || []).map((t) => ({
                    _id: t._id,
                    pickup: t.pickup,
                    delivery: { address: t.destination?.address },
                    receiverName: '-',
                    receiverContact: '-',
                    package: { name: t.vehicleType, size: '—' },
                    fareEstimate: t.fareEstimate,
                    vehicleType: t.vehicleType,
                    status: mapTransportStatus(t.status),
                    createdAt: t.createdAt,
                })));
            } else {
                const data = await getParcelHistory(serviceType);
                const normalized = (data.parcels || []).map((p) => {
                    if (p.accepted && p.status !== 'accepted') {
                        return { ...p, status: 'accepted' };
                    }
                    return p;
                });
                setParcels(normalized);
            }
        } catch (e) {
            console.error('Error loading parcel history:', e);
            Alert.alert('Error', e.message || 'Failed to load history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [serviceType]);

    const onRefresh = () => {
        loadHistory(true);
    };

    const onParcelPress = (parcelId) => {
        if (serviceType === 'transport' || serviceType === 'cab' || serviceType === 'bike') {
            router.push({ pathname: '/transport-tracking', params: { id: parcelId } });
        } else {
            router.push({ pathname: '/parcel-tracking', params: { id: parcelId } });
        }
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    };

    function mapTransportStatus(s) {
        if (s === 'in_progress') return 'in_transit';
        if (s === 'completed') return 'delivered';
        return s;
    }

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

    const renderParcelItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.status);
        const isTransport = serviceType === 'transport' || serviceType === 'cab' || serviceType === 'bike';
        
        return (
            <TouchableOpacity 
                style={styles.parcelCard} 
                onPress={() => onParcelPress(item._id)}
            >
                <View style={styles.parcelHeader}>
                    <Text style={styles.parcelId}>#{item._id?.slice(-6)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                        <Text style={styles.statusText}>{statusConfig.label}</Text>
                    </View>
                </View>
                
                <View style={styles.parcelDetails}>
                    <Text style={styles.routeText}>
                        {item.pickup?.address?.split(',')[0]} → {item.delivery?.address?.split(',')[0]}
                    </Text>
                    {isTransport ? (
                        <Text style={styles.packageText}>
                            {item.vehicleType?.toUpperCase()} • ₹{item.fareEstimate}
                        </Text>
                    ) : (
                        <>
                            <Text style={styles.receiverText}>
                                To: {item.receiverName} • {item.receiverContact}
                            </Text>
                            <Text style={styles.packageText}>
                                {item.package?.name} ({item.package?.size}) • ₹{item.fareEstimate}
                            </Text>
                        </>
                    )}
                </View>
                
                <View style={styles.parcelFooter}>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    <Text style={styles.vehicleText}>
                        {item.vehicleType === 'truck' && item.vehicleSubType 
                            ? item.vehicleSubType 
                            : item.vehicleType}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{(serviceType === 'transport' || serviceType === 'cab' || serviceType === 'bike') ? '🚗' : '📦'}</Text>
            <Text style={styles.emptyTitle}>No {(serviceType === 'transport' || serviceType === 'cab' || serviceType === 'bike') ? 'trips' : 'parcels'} history</Text>
            <Text style={styles.emptyDescription}>
                {(serviceType === 'transport' || serviceType === 'cab' || serviceType === 'bike') ? "You haven't booked any trips yet" : "You haven't created any parcels yet"}
            </Text>
        </View>
    );

    if (loading) {
        return <LoadingOverlay visible={true} />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={parcels}
                keyExtractor={(item) => item._id}
                renderItem={renderParcelItem}
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
    container: { flex: 1, backgroundColor: Colors.background },
    listContainer: { padding: Spacing.lg },
    parcelCard: {
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
    parcelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm
    },
    parcelId: {
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
    parcelDetails: {
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
    packageText: {
        fontSize: 12,
        color: Colors.mutedText
    },
    parcelFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateText: {
        fontSize: 11,
        color: Colors.mutedText
    },
    vehicleText: {
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
        paddingHorizontal: Spacing.lg
    }
});
