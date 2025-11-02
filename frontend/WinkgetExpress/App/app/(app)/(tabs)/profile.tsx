import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert, 
  ActivityIndicator, 
  Image, 
  Modal,
  // Import SafeAreaView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { captainTripApi, captainTripApiUploadDocument, clearCaptainApiToken } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons'; // Import icons

/* -------------------- THEME -------------------- */
const THEME = {
  primary: '#10B981',
  accent: '#ECFDF5',
  textDark: '#065F46',
  text: '#1F2937',
  textMuted: '#6B7280',
  background: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  successLight: '#ECFDF5',
};

// Define icon mapping
const docIconMap: { [key: string]: React.ComponentProps<typeof Feather>['name'] } = {
  driving_license: 'credit-card',
  aadhar_card: 'user',
  vehicle_registration: 'file-text',
  insurance: 'shield',
  driver_vehicle_photo: 'camera',
};

export default function ProfileScreen() {
  const { captain, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    city: '',
    phone: '',
    rating: 0
  });
  const [docUrls, setDocUrls] = useState({
    driving_license: '',
    aadhar_card: '',
    vehicle_registration: '',
    insurance: '',
    driver_vehicle_photo: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // (All your logic functions are unchanged)
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await captainTripApi.getProfile();
      const stats = await captainTripApi.getCaptainStats();
      if (response.data) {
        setProfileData({
          city: response.data.city || captain?.city || 'N/A',
          phone: response.data.phone || captain?.phone || 'N/A',
          rating: (stats?.data?.rating ?? response.data.rating ?? 0)
        });
        setDocUrls({
          driving_license: response.data.drivingLicenseUrl || '',
          aadhar_card: response.data.aadharCardUrl || '',
          vehicle_registration: response.data.vehicleRegistrationUrl || '',
          insurance: response.data.insuranceUrl || '',
          driver_vehicle_photo: response.data.driverVehiclePhotoUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData({
        city: captain?.city || 'N/A',
        phone: captain?.phone || 'N/A',
        rating: 0
      });
      setTimeout(async () => {
        try {
          const r2 = await captainTripApi.getProfile();
          if (r2?.data?.city) setProfileData(prev => ({ ...prev, city: r2.data.city }));
        } catch {}
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const pickAndUpload = async (type: keyof typeof docUrls) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo access to upload documents');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      const asset = result.assets[0];
      const dataUri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
      const res = await captainTripApiUploadDocument(type, dataUri);
      if (res?.data?.url) {
        setDocUrls(prev => ({ ...prev, [type]: res.data.url }));
        Alert.alert('Success', 'Document uploaded successfully');
      } else {
        Alert.alert('Error', 'Upload failed');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Upload failed');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync('captainToken');
            await SecureStore.deleteItemAsync('captainProfile');
            clearCaptainApiToken();
          } catch (e) {
            console.warn('Error clearing SecureStore:', e);
          }
          
          await logout();
          router.replace('/(app)/(auth)');
        },
      },
    ]);
  };

  // Document data structure for mapping
  const documents = [
    { key: 'driving_license', name: 'Driving License', desc: 'Valid driving license' },
    { key: 'aadhar_card', name: 'Aadhar Card', desc: 'Government ID' },
    { key: 'vehicle_registration', name: 'Vehicle Registration', desc: 'RC document' },
    { key: 'insurance', name: 'Insurance', desc: 'Valid vehicle insurance' },
    { key: 'driver_vehicle_photo', name: 'Driver with Vehicle', desc: 'Clear photo of you with vehicle' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.ratingBadge}>
            <Feather name="star" size={14} color={THEME.white} />
            <Text style={styles.ratingValue}>{profileData.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <View style={[styles.infoRow, styles.infoRowDivider]}>
              <Feather name="phone" size={20} color={THEME.textMuted} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.phone}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={20} color={THEME.textMuted} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{profileData.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Document Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Verification</Text>
          <View style={styles.card}>
            <View style={styles.verificationHeader}>
              <Text style={styles.verificationLabel}>Registration Status</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>PENDING</Text>
              </View>
            </View>
            <Text style={styles.verificationMessage}>
              Complete document verification to start accepting trips
            </Text>
            
            <View style={styles.documentList}>
              {documents.map((doc) => {
                const key = doc.key as keyof typeof docUrls;
                const url = docUrls[key];
                const iconName = docIconMap[key] || 'file';
                const isUploaded = !!url;

                return (
                  <View key={key} style={styles.documentItem}>
                    <Feather name={iconName} size={20} color={THEME.textMuted} style={styles.documentIcon} />
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{doc.name}</Text>
                      <Text style={styles.documentDesc}>{doc.desc}</Text>
                      {isUploaded && (
                        <View style={styles.uploadedBadge}>
                          <Feather name="check-circle" size={12} color={THEME.success} />
                          <Text style={styles.uploadedText}>Uploaded</Text>
                        </View>
                      )}
                    </View>
                    {isUploaded ? (
                      <Pressable style={[styles.uploadButton, styles.viewButton]} onPress={() => setPreviewUrl(url)}>
                        <Text style={[styles.uploadText, styles.viewText]}>View</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={styles.uploadButton} onPress={() => pickAndUpload(key)}>
                        <Text style={styles.uploadText}>Upload</Text>
                      </Pressable>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={THEME.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0 (Captain)</Text>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Pressable style={styles.modalClose} onPress={() => setPreviewUrl(null)}>
              <Feather name="x" size={20} color={THEME.text} />
            </Pressable>
            {previewUrl && (
              <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    // ✅ FIX: Replaced hardcoded paddingTop with vertical padding
    paddingVertical: 16,
    backgroundColor: THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textMuted,
  },
  ratingBadge: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.white,
  },
  content: {
    flex: 1,
    paddingTop: 8, // Add space between header and content
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: THEME.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Add dividers in the JSX instead
  },
  infoRowDivider: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  infoIcon: {
    width: 32, // Give icon a fixed width for alignment
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: THEME.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  pendingBadge: {
    backgroundColor: THEME.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.warning,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.warning,
  },
  verificationMessage: {
    fontSize: 14,
    color: THEME.textMuted,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  documentList: {
    gap: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  documentIcon: {
    width: 24, // Fixed width
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 2,
  },
  documentDesc: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  uploadedText: {
    fontSize: 12,
    color: THEME.success,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 16,
  },
  modalClose: {
    position: 'absolute',
    top: -15,
    right: -10,
    zIndex: 2,
    backgroundColor: THEME.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  uploadButton: {
    backgroundColor: THEME.primary,
   paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.white,
  },
  viewButton: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  viewText: {
    color: THEME.text,
  },
  logoutButton: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: THEME.dangerLight,
    borderColor: THEME.danger,
    borderWidth: 1.5,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.danger,
  },
  version: {
    textAlign: 'center',
    color: THEME.textMuted,
    fontSize: 12,
    marginVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
   },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME.textMuted,
    textAlign: 'center',
  },
});