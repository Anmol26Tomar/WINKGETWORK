import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
<<<<<<< Updated upstream
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Animated,
=======
  TextInput,
  Modal,
>>>>>>> Stashed changes
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
  HelpCircle,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  Camera,
  AlertCircle,
  MessageCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
<<<<<<< Updated upstream
import { captainService } from '../../services/api';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '@/context/AuthContext';
import { SERVICE_CONFIGS } from '../../config/serviceConfig';
import { ServiceType, Captain } from '../../types';

const DOCUMENT_TYPES = [
  {
    id: 'license',
    name: 'Driving License',
    description: 'Valid driving license',
    required: true,
  },
  {
    id: 'vehicle',
    name: 'Vehicle Registration',
    description: 'Vehicle registration certificate',
    required: true,
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'PAN card for tax purposes',
    required: true,
  },
  {
    id: 'aadhar',
    name: 'Aadhar Card',
    description: 'Aadhar card for identity verification',
    required: true,
  },
];
=======
import { useAuth } from '../../../../context/AuthContext';
>>>>>>> Stashed changes

export default function ProfileScreen() {
  const router = useRouter();
  const { captain, logout, refreshProfile } = useAuth();
  const [isAvailable, setIsAvailable] = useState(captain?.is_available || false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [city, setCity] = useState(captain?.city || '');
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [captainProfile, setCaptainProfile] = useState<Captain | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [bounceAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  useEffect(() => {
    // Enhanced animations for smoother UX
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start shimmer effect for document status
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    fetchCaptainProfile();
  }, []);

  const fetchCaptainProfile = async () => {
    try {
      setLoading(true);
      const profile = await captainService.getProfile();
      setCaptainProfile(profile);
    } catch (error) {
      console.error('Error fetching captain profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (value: boolean) => {
    try {
      setIsAvailable(value);
      // TODO: Implement API call to update availability
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
      // TODO: Implement API call to update city
      await refreshProfile();
      setEditModalVisible(false);
      Alert.alert('Success', 'City updated successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update city');
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
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
<<<<<<< Updated upstream
          <Settings size={18} color="#FF6B35" />
=======
          <Settings size={18} color="#FB923C" />
>>>>>>> Stashed changes
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
    <Animated.View 
      style={[
        styles.statCard,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -2]
            })}
          ],
        },
      ]}
    >
      <Animated.View 
        style={[
          styles.statIconContainer, 
          { 
            backgroundColor: `${color}20`,
            transform: [{ scale: bounceAnim }]
          }
        ]}
      >
        <Icon size={24} color={color} />
      </Animated.View>
      <Animated.Text 
        style={[
          styles.statValue,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })
          }
        ]}
      >
        {value}
      </Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

<<<<<<< Updated upstream
  const getDocumentStatus = (docId: string) => {
    if (!captainProfile) return 'pending';
    
    switch (docId) {
      case 'license':
        return captainProfile.licenseVerified ? 'verified' : 'pending';
      case 'vehicle':
        return captainProfile.vehicleVerified ? 'verified' : 'pending';
      case 'pan':
        return captainProfile.panVerified ? 'verified' : 'pending';
      case 'aadhar':
        return captainProfile.aadharVerified ? 'verified' : 'pending';
      default:
        return 'pending';
    }
  };

  const getOverallStatus = () => {
    if (!captainProfile) return 'pending';
    return captainProfile.isApproved ? 'verified' : 'pending';
  };
=======
  // Get display name and initial
  const displayName = captain?.fullName || captain?.name || 'Captain';
  const initial = displayName.charAt(0).toUpperCase();
>>>>>>> Stashed changes

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FF6B35" />
      
      {/* Help Button */}
      <TouchableOpacity 
        style={styles.helpButton}
        onPress={() => setHelpModalVisible(true)}
      >
        <HelpCircle size={24} color="#FF6B35" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Shield size={16} color="#10B981" />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.vehicleBadge}>
<<<<<<< Updated upstream
            <Truck size={14} color="#FF6B35" />
=======
            <Truck size={14} color="#FB923C" />
>>>>>>> Stashed changes
            <Text style={styles.vehicleText}>
              {captain?.vehicleType?.toUpperCase() || 'CAPTAIN'} •{' '}
              {captain?.serviceType?.replace('-', ' ').toUpperCase() || 'SERVICE'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={Star}
            label="Rating"
<<<<<<< Updated upstream
            value={typeof displayCaptain?.rating === 'number' ? displayCaptain.rating.toFixed(1) : '0.0'}
            color="#FF6B35"
=======
            value={captain?.rating ? captain.rating.toFixed(1) : '0.0'}
            color="#F59E0B"
>>>>>>> Stashed changes
          />
          <StatCard
            icon={TrendingUp}
            label="Total Trips"
<<<<<<< Updated upstream
            value={typeof displayCaptain?.total_trips === 'number' ? String(displayCaptain.total_trips) : '0'}
            color="#FF6B35"
=======
            value={captain?.totalTrips ? String(captain.totalTrips) : '0'}
            color="#10B981"
>>>>>>> Stashed changes
          />
          <StatCard
            icon={Award}
            label="Experience"
<<<<<<< Updated upstream
            value={`${displayCaptain?.experience_years || 2}Y`}
            color="#FF6B35"
=======
            value={`${captain?.experienceYears || 0}Y`}
            color="#8B5CF6"
>>>>>>> Stashed changes
          />
          <StatCard
            icon={Truck}
            label="Today"
<<<<<<< Updated upstream
            value={`${displayCaptain?.trips_today || 0}`}
            color="#FF6B35"
=======
            value={`${captain?.tripsToday || 0}`}
            color="#FB923C"
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              trackColor={{ false: '#D1D5DB', true: '#FFB399' }}
              thumbColor={isAvailable ? '#FF6B35' : '#F3F4F6'}
=======
              trackColor={{ false: '#D1D5DB', true: '#FED7AA' }}
              thumbColor={isAvailable ? '#FB923C' : '#F3F4F6'}
>>>>>>> Stashed changes
            />
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon={Phone} label="Phone" value={captain?.phone || 'Not provided'} />
            <InfoRow icon={Mail} label="Email" value={captain?.email || 'Not provided'} />
            <InfoRow
              icon={MapPin}
              label="City"
              value={captain?.city || 'Not set'}
              onEdit={() => setEditModalVisible(true)}
            />
          </View>
        </View>

<<<<<<< Updated upstream
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
                      <Truck size={16} color="#FF6B35" />
                    </View>
                    <Text style={styles.serviceText}>{config?.name || serviceType}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Document Verification */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Document Verification</Text>
          <View style={styles.documentsContainer}>
            {/* Overall Status */}
            <View style={styles.overallStatusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>Registration Status</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getOverallStatus() === 'verified' ? '#10B981' : '#FF6B35' }
                ]}>
                  <Text style={styles.statusText}>
                    {getOverallStatus() === 'verified' ? 'VERIFIED' : 'PENDING'}
                  </Text>
                </View>
              </View>
              <Text style={styles.statusDescription}>
                {getOverallStatus() === 'verified' 
                  ? 'All documents verified. You can start accepting trips!'
                  : 'Complete document verification to start accepting trips.'
                }
              </Text>
            </View>

            {/* Individual Documents */}
            {DOCUMENT_TYPES.map((doc, index) => {
              const status = getDocumentStatus(doc.id);
              return (
                <Animated.View
                  key={doc.id}
                  style={[
                    styles.documentItem,
                    {
                      opacity: fadeAnim,
                      transform: [{ 
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50],
                          extrapolate: 'clamp',
                        })
                      }],
                    },
                  ]}
                >
                  <View style={styles.documentLeft}>
                    <View style={[
                      styles.documentIcon,
                      { backgroundColor: status === 'verified' ? '#10B981' : '#FEF3F2' }
                    ]}>
                      {status === 'verified' ? (
                        <CheckCircle size={20} color="#FFFFFF" />
                      ) : (
                        <FileText size={20} color="#6B7280" />
                      )}
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{doc.name}</Text>
                      <Text style={styles.documentDescription}>{doc.description}</Text>
                    </View>
                  </View>
                  <View style={styles.documentRight}>
                    {status === 'verified' ? (
                      <View style={styles.verifiedBadge}>
                        <CheckCircle size={16} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.uploadButton}>
                        <Upload size={16} color="#FF6B35" />
                        <Text style={styles.uploadText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

=======
>>>>>>> Stashed changes
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update City</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your city"
              value={city}
              onChangeText={setCity}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdateCity}
                disabled={updating}
              >
                <Text style={styles.updateButtonText}>
                  {updating ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        title="Help & Support"
      >
        <View style={styles.helpContent}>
          <Text style={styles.helpText}>
            Need help? Contact our support team for assistance with your captain account.
          </Text>
          <View style={styles.helpOptions}>
            <TouchableOpacity style={styles.helpOption}>
              <Phone size={20} color="#FF6B35" />
              <Text style={styles.helpOptionText}>Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption}>
              <Mail size={20} color="#FF6B35" />
              <Text style={styles.helpOptionText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption}>
              <MessageCircle size={20} color="#FF6B35" />
              <Text style={styles.helpOptionText}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
<<<<<<< Updated upstream
    backgroundColor: '#FF6B35',
=======
    backgroundColor: '#FB923C',
>>>>>>> Stashed changes
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
<<<<<<< Updated upstream
    shadowColor: '#FF6B35',
=======
    shadowColor: '#FB923C',
>>>>>>> Stashed changes
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
<<<<<<< Updated upstream
=======
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
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
>>>>>>> Stashed changes
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
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '700',
<<<<<<< Updated upstream
    color: '#FF6B35',
=======
    color: '#FB923C',
>>>>>>> Stashed changes
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
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
<<<<<<< Updated upstream
  helpButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  documentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  overallStatusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  documentDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  documentRight: {
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3F2',
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  helpContent: {
    paddingVertical: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  helpOptions: {
    gap: 12,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  helpOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
=======
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  updateButton: {
    backgroundColor: '#FB923C',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
>>>>>>> Stashed changes
});
