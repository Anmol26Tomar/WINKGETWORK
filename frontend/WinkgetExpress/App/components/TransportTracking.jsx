import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/colors';
import LoadingOverlay from './LoadingOverlay';
import { listTransportByUser, getTransportById } from '../services/transportService';
import { getCaptainById } from '../services/parcelService';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';

const STATUS_CONFIG = {
	pending: { label: 'Pending', description: 'Waiting for captain to accept', color: Colors.warning || '#FFA500', icon: '⏳' },
	accepted: { label: 'Accepted', description: 'Captain has accepted your ride', color: Colors.info || '#007AFF', icon: '✅' },
	in_progress: { label: 'In Progress', description: 'Ride is underway', color: Colors.primary, icon: '🚗' },
	completed: { label: 'Completed', description: 'Ride completed', color: Colors.success || '#34C759', icon: '🏁' },
	cancelled: { label: 'Cancelled', description: 'Ride was cancelled', color: Colors.error || '#FF3B30', icon: '❌' },
};

export default function TransportTracking({ transportId }) {
	const { user } = useAuth?.() || {};
	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const loadTrip = async (showRefresh = false) => {
		try {
			if (showRefresh) setRefreshing(true); else setLoading(true);
			let found = null;
			try {
				found = await getTransportById(transportId);
			} catch {
				const uid = user?.id || user?._id;
				if (!uid) throw new Error('User not found');
				const data = await listTransportByUser(uid);
				found = (data.transports || []).find(t => t._id === transportId);
			}
			if (!found) throw new Error('Not found');
			const normalized = { ...found };
			if (normalized.rideAccepted && normalized.status !== 'accepted') normalized.status = 'accepted';
			if (normalized.captainRef && typeof normalized.captainRef === 'string') {
				try {
					const cap = await getCaptainById(normalized.captainRef);
					normalized.captainRef = cap?.agent || cap?.captain || cap?.data || cap || { _id: normalized.captainRef };
				} catch (e) { /* ignore */ }
			}
			setTrip(normalized);
		} catch (e) {
			console.error('Error loading transport:', e);
			Alert.alert('Error', e.message || 'Failed to load trip');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		loadTrip();
		const id = setInterval(() => loadTrip(true), 10000);
		const socket = getSocket();
		let acceptedHandler;
		let updateHandler;
		if (socket) {
			acceptedHandler = (payload) => {
				if (payload?.ride?._id === transportId) loadTrip(true);
			};
			updateHandler = (payload) => {
				if (payload?.ride?._id === transportId) loadTrip(true);
			};
			socket.emit('user:subscribe-ride', { rideId: transportId });
			socket.on('ride-accepted', acceptedHandler);
			socket.on('ride-updated', updateHandler);
		}
		return () => {
			clearInterval(id);
			if (socket) {
				socket.off('ride-accepted', acceptedHandler);
				socket.off('ride-updated', updateHandler);
			}
		};
	}, [transportId, user?.id]);

	if (loading && !trip) return <LoadingOverlay visible={true} />;
	if (!trip) return (
		<View style={styles.container}><Text style={styles.errorText}>Trip not found</Text></View>
	);

	const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pending;

	return (
		<View style={styles.container}>
			<LoadingOverlay visible={loading && !refreshing} />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Trip #{trip._id?.slice(-6)}</Text>
					<View style={[styles.statusBadge, { backgroundColor: status.color }]}>
						<Text style={styles.statusIcon}>{status.icon}</Text>
						<Text style={styles.statusText}>{status.label}</Text>
					</View>
				</View>
				<Text style={styles.description}>{status.description}</Text>

				<View style={styles.detailsCard}>
					<Text style={styles.cardTitle}>Ride Details</Text>
					<View style={styles.detailRow}><Text style={styles.detailLabel}>Fare:</Text><Text style={styles.detailValue}>₹{trip.fareEstimate}</Text></View>
					<View style={styles.detailRow}><Text style={styles.detailLabel}>Vehicle:</Text><Text style={styles.detailValue}>{trip.vehicleType}</Text></View>
					<View style={styles.detailRow}><Text style={styles.detailLabel}>Distance:</Text><Text style={styles.detailValue}>{trip.distanceKm} km</Text></View>
				</View>

				<View style={styles.detailsCard}>
					<Text style={styles.cardTitle}>Route</Text>
					<View style={styles.locationRow}><Text style={styles.locationLabel}>From:</Text><Text style={styles.locationValue}>{trip.pickup?.address}</Text></View>
					<View style={styles.locationRow}><Text style={styles.locationLabel}>To:</Text><Text style={styles.locationValue}>{trip.destination?.address}</Text></View>
				</View>

				{(trip.status === 'accepted' || trip.status === 'in_progress' || trip.status === 'completed') && trip.captainRef && (
					<View style={styles.detailsCard}>
						<Text style={styles.cardTitle}>Captain Details</Text>
						<View style={styles.captainRow}>
							<View style={styles.captainAvatar}><Ionicons name="person" size={22} color="#fff" /></View>
							<View style={{ flex: 1 }}>
								<Text style={styles.captainName}>{trip.captainRef.fullName || trip.captainRef.name || 'Assigned Captain'}</Text>
								<Text style={styles.captainMeta}>{trip.captainRef.phone || 'Phone pending'}</Text>
								{(trip.captainRef.vehicleType || trip.captainRef.vehicleSubType) ? (
									<Text style={styles.captainMeta}>{trip.captainRef.vehicleType}{trip.captainRef.vehicleSubType ? ` • ${trip.captainRef.vehicleSubType}` : ''}</Text>
								) : null}
							</View>
							{trip.captainRef.phone && (
								<TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${trip.captainRef.phone}`)}>
									<Ionicons name="call" size={18} color="#fff" />
								</TouchableOpacity>
							)}
						</View>
						<Text style={styles.captainSubtext}>Your captain will contact you soon</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },
	content: { padding: Spacing.xl },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
	title: { fontSize: 22, fontWeight: '800', color: Colors.text },
	statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.lg },
	statusIcon: { fontSize: 16, marginRight: Spacing.xs },
	statusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
	description: { color: Colors.mutedText, marginBottom: Spacing.lg },
	detailsCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
	cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
	detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
	detailLabel: { color: Colors.mutedText },
	detailValue: { color: Colors.text, fontWeight: '600' },
	locationRow: { marginBottom: Spacing.sm },
	locationLabel: { color: Colors.mutedText, fontSize: 12, marginBottom: 2 },
	locationValue: { color: Colors.text, fontWeight: '500' },
	captainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
	captainAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
	captainName: { color: Colors.text, fontWeight: '700' },
	captainMeta: { color: Colors.mutedText, fontSize: 12 },
	captainSubtext: { color: Colors.mutedText, fontSize: 12 },
	callBtn: { backgroundColor: Colors.success || '#34C759', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
	errorText: { textAlign: 'center', color: Colors.error || '#FF3B30', fontSize: 16, marginTop: Spacing.xl }
});


