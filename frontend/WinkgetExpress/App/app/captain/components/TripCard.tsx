import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, DollarSign, Clock } from 'lucide-react-native';
import type { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onAccept?: (tripId: string) => void;
  onReject?: (tripId: string) => void;
  onStart?: (tripId: string) => void;
  onEnd?: (tripId: string) => void;
  showActions?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onAccept,
  onReject,
  onStart,
  onEnd,
  showActions = true,
}) => {
  const getStatusColor = () => {
    switch (trip.status) {
      case 'pending': return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'accepted': return { bg: '#DBEAFE', text: '#2563EB' };
      case 'reached_pickup': return { bg: '#FDE68A', text: '#D97706' };
      case 'in_progress': return { bg: '#D1FAE5', text: '#10B981' };
      default: return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.serviceType}>{trip.service_type}</Text>
          {trip.status === 'pending' && (
            <View style={styles.timeInfo}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.timeText}>Just now</Text>
            </View>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.badgeText, { color: statusColor.text }]}>
            {trip.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.pickupIconContainer}>
            <MapPin size={18} color="#10B981" />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {trip.pickup_location}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.locationRow}>
          <View style={styles.dropoffIconContainer}>
            <MapPin size={18} color="#EF4444" />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Drop-off</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {trip.dropoff_location}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailCard}>
          <Navigation size={16} color="#2563EB" />
          <Text style={styles.detailText}>{trip.distance.toFixed(1)} km</Text>
        </View>
        <View style={[styles.detailCard, styles.fareCard]}>
          <DollarSign size={16} color="#10B981" />
          <Text style={[styles.detailText, styles.fareText]}>₹{trip.estimated_fare}</Text>
        </View>
      </View>

      {showActions && trip.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReject?.(trip.id)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onAccept?.(trip.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {showActions && trip.status === 'accepted' && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => onStart?.(trip.id)}
        >
          <Text style={styles.startButtonText}>Start Trip</Text>
        </TouchableOpacity>
      )}

      {showActions && trip.status === 'in_progress' && (
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => onEnd?.(trip.id)}
        >
          <Text style={styles.endButtonText}>End Trip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  serviceType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropoffIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 17,
    marginVertical: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  fareCard: {
    backgroundColor: '#D1FAE5',
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '700',
  },
  fareText: {
    color: '#10B981',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  endButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
