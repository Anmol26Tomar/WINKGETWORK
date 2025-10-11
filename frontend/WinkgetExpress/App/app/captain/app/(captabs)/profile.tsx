import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  LogOut,
  Truck,
  Settings,
  Shield,
  Award,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { captainService } from '../../services/api';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '@/context/AuthContext';
import { SERVICE_CONFIGS } from '../../config/serviceConfig';
import { ServiceType } from '../../types';

export default function ProfileScreen() {
  const router = useRouter();
  const { captain, logout, refreshProfile } = useAuth();
  const displayCaptain = captain;
  const [isAvailable, setIsAvailable] = useState(displayCaptain?.is_available || false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [city, setCity] = useState(displayCaptain?.city || '');
  const [updating, setUpdating] = useState(false);

  const handleToggleAvailability = async (value: boolean) => {
    try {
      setIsAvailable(value);
      await captainService.updateAvailability(value);
      await refreshProfile();
    } catch (error: any) {
      setIsAvailable(!value);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleUpdateCity = async () => {
    if (!city.trim()) {
      Alert.alert('Error', 'City cannot be empty');
      return;
    }
    setUpdating(true);
    try {
      await captainService.updateProfile({ city });
      await refreshProfile();
      setEditModalVisible(false);
      Alert.alert('Success', 'City updated successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update city');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    onEdit,
  }: {
    icon: any;
    label: string;
    value: string;
    onEdit?: () => void;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.iconContainer}>
          <Icon size={20} color="#6B7280" />
        </View>
        <View>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Settings size={18} color="#2563EB" />
        </TouchableOpacity>
      )}
    </View>
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color="#FFFFFF" />
            </View>
            <View style={styles.verifiedBadge}>
              <Shield size={16} color="#10B981" />
            </View>
          </View>
          <Text style={styles.name}>{displayCaptain?.full_name}</Text>
          <View style={styles.vehicleBadge}>
            <Truck size={14} color="#2563EB" />
            <Text style={styles.vehicleText}>
              {displayCaptain?.vehicle_type?.toUpperCase()} •{' '}
              {displayCaptain?.service_scope?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Real-World Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={Star}
            label="Rating"
            value={typeof displayCaptain?.rating === 'number' ? displayCaptain.rating.toFixed(1) : '0.0'}
            color="#F59E0B"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Trips"
            value={typeof displayCaptain?.total_trips === 'number' ? String(displayCaptain.total_trips) : '0'}
            color="#10B981"
          />
          <StatCard
            icon={Award}
            label="Experience"
            value={`${displayCaptain?.experience_years || 2}Y`}
            color="#8B5CF6"
          />
          <StatCard
            icon={Truck}
            label="Today"
            value={`${displayCaptain?.trips_today || 0}`}
            color="#2563EB"
          />
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <View style={styles.availabilityRow}>
            <View>
              <Text style={styles.availabilityTitle}>Available for Trips</Text>
              <Text style={styles.availabilitySubtext}>
                {isAvailable ? 'You are online' : 'You are offline'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={isAvailable ? '#2563EB' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon={Phone} label="Phone" value={displayCaptain?.phone || ''} />
            <InfoRow icon={Mail} label="Email" value={displayCaptain?.email || ''} />
            <InfoRow
              icon={MapPin}
              label="City"
              value={displayCaptain?.city || 'Not set'}
              onEdit={() => setEditModalVisible(true)}
            />
          </View>
        </View>

        {/* Services */}
        {displayCaptain?.service_types?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Provided</Text>
            <View style={styles.servicesContainer}>
              {displayCaptain.service_types.map((serviceType: ServiceType) => {
                const config = SERVICE_CONFIGS[serviceType];
                return (
                  <View key={serviceType} style={styles.serviceItem}>
                    <View style={styles.serviceIcon}>
                      <Truck size={16} color="#2563EB" />
                    </View>
                    <Text style={styles.serviceText}>{config?.name || serviceType}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>Captain App</Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Update City"
      >
        <Input
          label="City"
          placeholder="Enter your city"
          value={city}
          onChangeText={setCity}
        />
        <Button
          title="Update"
          onPress={handleUpdateCity}
          loading={updating}
        />
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  availabilityRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  availabilitySubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  servicesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
});
