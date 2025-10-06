import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from './LoadingOverlay';
import { getParcel, verifyOtp, confirmPayment, getParcelTracking, getCaptainById } from '../services/parcelService';

const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        description: 'Waiting for captain to accept',
        color: Colors.warning || '#FFA500',
        icon: '⏳'
    },
    accepted: {
        label: 'Accepted',
        description: 'Captain has accepted your order',
        color: Colors.info || '#007AFF',
        icon: '✅'
    },
    in_transit: {
        label: 'In Transit',
        description: 'Your parcel is on the way',
        color: Colors.primary,
        icon: '🚚'
    },
    delivered: {
        label: 'Delivered',
        description: 'Parcel delivered successfully',
        color: Colors.success || '#34C759',
        icon: '📦'
    },
    cancelled: {
        label: 'Cancelled',
        description: 'Order was cancelled',
        color: Colors.error || '#FF3B30',
        icon: '❌'
    }
};

export default function ParcelTracking({ parcelId, onStatusUpdate }) {
    const [parcel, setParcel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otp, setOtp] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadParcel = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);
            
            const data = await getParcelTracking(parcelId);
            const normalized = { ...data };
            if (normalized.accepted && normalized.status !== 'accepted') {
                normalized.status = 'accepted';
            }
            // Hydrate captain/agent details if only an id is present
            if (normalized.captainRef && typeof normalized.captainRef === 'string') {
                try {
                    const cap = await getCaptainById(normalized.captainRef);
                    const hydrated = cap?.captain || cap?.agent || cap?.data || cap;
                    normalized.captainRef = hydrated || { _id: normalized.captainRef };
                } catch (e) {
                    // ignore hydrate failure, keep id
                }
            }
            setParcel(normalized);
            if (onStatusUpdate) onStatusUpdate(normalized);
        } catch (e) {
            console.error('Error loading parcel details:', e);
            Alert.alert('Error', e.message || 'Failed to load parcel details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!parcelId) {
            console.error('No parcel ID provided');
            setLoading(false);
            return;
        }
        
        loadParcel();
        
        // Set up polling for real-time updates
        const interval = setInterval(() => {
            loadParcel(true);
        }, 10000); // Poll every 10 seconds instead of 5

        return () => clearInterval(interval);
    }, [parcelId]);

    const onVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
            return;
        }

        try {
            setLoading(true);
            await verifyOtp(parcelId, otp);
            Alert.alert('Verified', 'OTP verified successfully!');
            await loadParcel();
        } catch (e) {
            Alert.alert('Failed', e.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const onConfirmDelivery = async () => {
        try {
            setLoading(true);
            await confirmPayment(parcelId);
            Alert.alert('Delivered', 'Payment confirmed. Parcel delivered successfully!');
            await loadParcel();
        } catch (e) {
            Alert.alert('Failed', e.message || 'Could not confirm delivery');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    };

    if (!parcelId) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No parcel ID provided</Text>
            </View>
        );
    }

    if (loading && !parcel) {
        return <LoadingOverlay visible={true} />;
    }

    if (!parcel) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Parcel not found</Text>
            </View>
        );
    }

    const statusConfig = getStatusConfig(parcel.status);

    return (
        <View style={styles.container}>
            <LoadingOverlay visible={loading && !refreshing} />
            
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Parcel #{parcel._id?.slice(-6)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                        <Text style={styles.statusText}>{statusConfig.label}</Text>
                    </View>
                </View>

                <Text style={styles.description}>{statusConfig.description}</Text>

                {/* Parcel Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Parcel Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fare:</Text>
                        <Text style={styles.detailValue}>₹{parcel.fareEstimate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Vehicle:</Text>
                        <Text style={styles.detailValue}>{parcel.vehicleType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Package:</Text>
                        <Text style={styles.detailValue}>{parcel.package?.name} ({parcel.package?.size})</Text>
                    </View>
                </View>

                {/* Location Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Location Details</Text>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>From:</Text>
                        <Text style={styles.locationValue}>{parcel.pickup?.address}</Text>
                    </View>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>To:</Text>
                        <Text style={styles.locationValue}>{parcel.delivery?.address}</Text>
                    </View>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>Receiver:</Text>
                        <Text style={styles.locationValue}>{parcel.receiverName} • {parcel.receiverContact}</Text>
                    </View>
                </View>

                {/* Captain Details (if accepted) */}
                {parcel.status === 'accepted' && parcel.captainRef && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.cardTitle}>Captain Details</Text>
                        <View style={styles.captainRow}>
                            <View style={styles.captainAvatar}>
                                <Ionicons name="person" size={22} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.captainName}>
                                    {parcel.captainRef.fullName || parcel.captainRef.name || parcel.captainRef.username || 'Assigned Captain'}
                                </Text>
                                <Text style={styles.captainMeta}>
                                    {parcel.captainRef.phone || parcel.captainRef.mobile || parcel.captainRef.contact || 'Phone pending'}
                                </Text>
                                {(parcel.captainRef.vehicle || parcel.captainRef.vehicleType || parcel.captainRef.vehicleNumber || parcel.captainRef.vehicleSubType) ? (
                                    <Text style={styles.captainMeta}>
                                        {(parcel.captainRef.vehicleType || parcel.captainRef.vehicle?.type || parcel.captainRef.vehicleSubType || 'Vehicle')} {parcel.captainRef.vehicleNumber ? `• ${parcel.captainRef.vehicleNumber}` : ''}
                                    </Text>
                                ) : null}
                            </View>
                            {(parcel.captainRef.phone || parcel.captainRef.mobile) && (
                                <TouchableOpacity
                                    style={styles.callBtn}
                                    onPress={() => Linking.openURL(`tel:${parcel.captainRef.phone || parcel.captainRef.mobile}`)}
                                >
                                    <Ionicons name="call" size={18} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.captainSubtext}>Captain has accepted your order</Text>
                    </View>
                )}

                {/* OTP Verification (only when delivered) */}
                {parcel.status === 'delivered' && !parcel.otp?.verified && (
                    <View style={styles.otpCard}>
                        <Text style={styles.cardTitle}>Verify Delivery</Text>
                        <Text style={styles.otpDescription}>
                            Enter the OTP provided by the captain to confirm delivery
                        </Text>
                        <TextInput 
                            style={styles.otpInput} 
                            placeholder="Enter 6-digit OTP" 
                            keyboardType="numeric" 
                            value={otp} 
                            onChangeText={setOtp}
                            maxLength={6}
                        />
                        <TouchableOpacity style={styles.verifyBtn} onPress={onVerifyOtp}>
                            <Text style={styles.verifyBtnText}>Verify OTP</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Payment Confirmation (only when OTP verified) */}
                {parcel.status === 'delivered' && parcel.otp?.verified && (
                    <View style={styles.paymentCard}>
                        <Text style={styles.cardTitle}>Confirm Payment</Text>
                        <Text style={styles.paymentDescription}>
                            Confirm payment to complete the delivery
                        </Text>
                        <TouchableOpacity style={styles.paymentBtn} onPress={onConfirmDelivery}>
                            <Text style={styles.paymentBtnText}>Confirm Payment & Complete</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Refresh Button */}
                <TouchableOpacity 
                    style={styles.refreshBtn} 
                    onPress={() => loadParcel(true)}
                    disabled={refreshing}
                >
                    <Text style={styles.refreshBtnText}>
                        {refreshing ? 'Refreshing...' : 'Refresh Status'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: Spacing.sm 
    },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text },
    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: Spacing.md, 
        paddingVertical: Spacing.sm, 
        borderRadius: Radius.lg 
    },
    statusIcon: { fontSize: 16, marginRight: Spacing.xs },
    statusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    description: { color: Colors.mutedText, marginBottom: Spacing.lg },
    detailsCard: { 
        backgroundColor: '#fff', 
        borderRadius: Radius.lg, 
        padding: Spacing.lg, 
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: Spacing.sm 
    },
    detailLabel: { color: Colors.mutedText },
    detailValue: { color: Colors.text, fontWeight: '600' },
    locationRow: { marginBottom: Spacing.sm },
    locationLabel: { color: Colors.mutedText, fontSize: 12, marginBottom: 2 },
    locationValue: { color: Colors.text, fontWeight: '500' },
    captainText: { color: Colors.text, fontWeight: '600', marginBottom: Spacing.xs },
    captainSubtext: { color: Colors.mutedText, fontSize: 12 },
    captainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm
    },
    captainAvatar: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    captainName: { color: Colors.text, fontWeight: '700' },
    captainMeta: { color: Colors.mutedText, fontSize: 12 },
    callBtn: {
        backgroundColor: Colors.success || '#34C759',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center'
    },
    otpCard: { 
        backgroundColor: '#fff', 
        borderRadius: Radius.lg, 
        padding: Spacing.lg, 
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border
    },
    otpDescription: { color: Colors.mutedText, marginBottom: Spacing.md },
    otpInput: { 
        backgroundColor: '#f8f9fa', 
        borderWidth: 1, 
        borderColor: Colors.border, 
        borderRadius: Radius.md, 
        padding: Spacing.md, 
        marginBottom: Spacing.md,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600'
    },
    verifyBtn: { 
        backgroundColor: Colors.primary, 
        padding: Spacing.md, 
        borderRadius: Radius.lg, 
        alignItems: 'center' 
    },
    verifyBtnText: { color: '#fff', fontWeight: '700' },
    paymentCard: { 
        backgroundColor: '#fff', 
        borderRadius: Radius.lg, 
        padding: Spacing.lg, 
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border
    },
    paymentDescription: { color: Colors.mutedText, marginBottom: Spacing.md },
    paymentBtn: { 
        backgroundColor: Colors.success || '#34C759', 
        padding: Spacing.md, 
        borderRadius: Radius.lg, 
        alignItems: 'center' 
    },
    paymentBtnText: { color: '#fff', fontWeight: '700' },
    refreshBtn: { 
        backgroundColor: Colors.background, 
        borderWidth: 1, 
        borderColor: Colors.border, 
        padding: Spacing.md, 
        borderRadius: Radius.lg, 
        alignItems: 'center',
        marginTop: Spacing.sm
    },
    refreshBtnText: { color: Colors.text, fontWeight: '600' },
    errorText: { 
        textAlign: 'center', 
        color: Colors.error || '#FF3B30', 
        fontSize: 16, 
        marginTop: Spacing.xl 
    }
});
