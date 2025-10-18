import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Package, User, Phone, CheckCircle } from 'lucide-react-native';
import type { Parcel } from '../types';

interface ParcelCardProps {
  parcel: Parcel;
  isSelected: boolean;
  onSelect: (parcelId: string) => void;
  onDeselect: (parcelId: string) => void;
}

export const ParcelCard: React.FC<ParcelCardProps> = ({
  parcel,
  isSelected,
  onSelect,
  onDeselect,
}) => {
  const handlePress = () => {
    if (isSelected) {
      onDeselect(parcel.id || parcel._id || '');
    } else {
      onSelect(parcel.id || parcel._id || '');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Package size={20} color={isSelected ? '#10B981' : '#6B7280'} />
          <Text style={[styles.parcelId, isSelected && styles.selectedText]}>
            #{parcel.id || parcel._id}
          </Text>
        </View>
        <View style={styles.rightHeader}>
          <Text style={[styles.fare, isSelected && styles.selectedText]}>
            ₹{parcel.fareEstimate}
          </Text>
          {isSelected && (
            <CheckCircle size={20} color="#10B981" style={styles.checkIcon} />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.locationRow}>
          <MapPin size={16} color="#6B7280" />
          <View style={styles.locationText}>
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.address}>{parcel.pickup.address}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={16} color="#6B7280" />
          <View style={styles.locationText}>
            <Text style={styles.label}>Delivery:</Text>
            <Text style={styles.address}>{parcel.delivery.address}</Text>
          </View>
        </View>

        <View style={styles.packageRow}>
          <Package size={16} color="#6B7280" />
          <Text style={styles.packageText}>
            {parcel.package.name} • {parcel.package.weight}kg • {parcel.package.size}
          </Text>
        </View>

        <View style={styles.receiverRow}>
          <User size={16} color="#6B7280" />
          <Text style={styles.receiverText}>{parcel.receiverName}</Text>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.phoneText}>{parcel.receiverContact}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.statusText}>
          Status: <Text style={styles.statusValue}>{parcel.status}</Text>
        </Text>
        <Text style={styles.timeText}>
          {new Date(parcel.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedContainer: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parcelId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fare: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  checkIcon: {
    marginLeft: 8,
  },
  content: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: '#111827',
    marginTop: 2,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiverText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    marginRight: 16,
  },
  phoneText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusValue: {
    color: '#059669',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedText: {
    color: '#10B981',
  },
});
