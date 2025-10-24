import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface TripCardProps {
  trip: {
    _id: string;
    serviceType: string;
    pickup: {
      address: string;
    };
    drop: {
      address: string;
    };
    fare: number;
    status: string;
  };
  onPress: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#FDB813';
      case 'accepted': return '#4CAF50';
      case 'payment_confirmed': return '#2196F3';
      default: return '#999';
    }
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.serviceType}>
          {trip.serviceType.replace(/_/g, ' ').toUpperCase()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
          <Text style={styles.statusText}>{trip.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.address}>{trip.pickup.address}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.address}>{trip.drop.address}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.fare}>₹{trip.fare}</Text>
        <Text style={styles.tapText}>Tap to view details</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceType: {
    color: '#FDB813',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  route: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  address: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fare: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tapText: {
    color: '#999',
    fontSize: 12,
  },
});

