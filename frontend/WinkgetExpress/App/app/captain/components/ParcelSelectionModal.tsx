import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { X, Package, CheckCircle, Truck } from 'lucide-react-native';
import { ParcelCard } from './ParcelCard';
import { Button } from './Button';
import { parcelService } from '../services/api';
import type { Parcel } from '../types';

interface ParcelSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onTripCreated: (trip: any) => void;
  captainId: string;
  userLocation: { lat: number; lng: number };
}

export const ParcelSelectionModal: React.FC<ParcelSelectionModalProps> = ({
  visible,
  onClose,
  onTripCreated,
  captainId,
  userLocation,
}) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchParcels();
    }
  }, [visible]);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const data = await parcelService.getPendingParcels(
        userLocation.lat, 
        userLocation.lng, 
        50 // 50km radius
      );
      setParcels(data);
    } catch (error) {
      console.error('Error fetching parcels:', error);
      Alert.alert('Error', 'Failed to fetch pending parcels');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParcel = (parcelId: string) => {
    setSelectedParcels(prev => [...prev, parcelId]);
  };

  const handleDeselectParcel = (parcelId: string) => {
    setSelectedParcels(prev => prev.filter(id => id !== parcelId));
  };

  const handleCreateTrip = async () => {
    if (selectedParcels.length === 0) {
      Alert.alert('No Selection', 'Please select at least one parcel to create a trip');
      return;
    }

    setCreating(true);
    try {
      const result = await parcelService.createCombinedTrip(selectedParcels, captainId);
      
      Alert.alert(
        'Trip Created! 🚛',
        `Successfully created trip with ${result.updatedParcels} parcels. Total fare: ₹${result.trip.totalFare}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onTripCreated(result.trip);
              onClose();
              setSelectedParcels([]);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', error.message || 'Failed to create combined trip');
    } finally {
      setCreating(false);
    }
  };

  const totalFare = selectedParcels.reduce((total, parcelId) => {
    const parcel = parcels.find(p => (p.id || p._id) === parcelId);
    return total + (parcel?.fareEstimate || 0);
  }, 0);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Truck size={24} color="#10B981" />
            <Text style={styles.title}>Select Parcels</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {selectedParcels.length} parcel{selectedParcels.length !== 1 ? 's' : ''} selected
          </Text>
          <Text style={styles.totalFare}>Total: ₹{totalFare}</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading parcels...</Text>
            </View>
          ) : parcels.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Package size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No pending parcels</Text>
              <Text style={styles.emptySubtext}>
                All parcels in your area have been assigned
              </Text>
            </View>
          ) : (
            parcels.map((parcel) => (
              <ParcelCard
                key={parcel.id || parcel._id}
                parcel={parcel}
                isSelected={selectedParcels.includes(parcel.id || parcel._id || '')}
                onSelect={handleSelectParcel}
                onDeselect={handleDeselectParcel}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.cancelButton}
          />
          <Button
            title={creating ? "Creating..." : `Create Trip (${selectedParcels.length})`}
            onPress={handleCreateTrip}
            disabled={selectedParcels.length === 0 || creating}
            style={styles.createButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalFare: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 2,
  },
});
