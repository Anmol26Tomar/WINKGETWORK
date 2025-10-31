import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { captainTripApi } from '../lib/api';
import { Colors } from '@/constants/colors';
import { captainTripApiUploadDocument } from '../lib/api';
export default function ProfileScreen() {
  const { captain, logout } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = React.useState(false);
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
      // Use captain data as fallback
      setProfileData({
        city: captain?.city || 'N/A',
        phone: captain?.phone || 'N/A',
        rating: 0
      });
      // brief retry to mitigate transient failures
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
          await logout();
          router.replace('/captain/(auth)');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingValue}>{profileData.rating.toFixed(1)}★</Text>
            <Text style={styles.ratingLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.phone}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
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
              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Driving License</Text>
                  <Text style={styles.documentDesc}>Valid driving license</Text>
                  {!!docUrls.driving_license && (<Text style={styles.docLink}>Uploaded</Text>)}
                </View>
                {docUrls.driving_license ? (
                  <Pressable style={styles.uploadButton} onPress={() => setPreviewUrl(docUrls.driving_license)}>
                    <Text style={styles.uploadText}>View</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.uploadButton} onPress={() => pickAndUpload('driving_license')}>
                    <Text style={styles.uploadText}>Upload</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Aadhar Card</Text>
                  <Text style={styles.documentDesc}>Government ID</Text>
                  {!!docUrls.aadhar_card && (<Text style={styles.docLink}>Uploaded</Text>)}
                </View>
                {docUrls.aadhar_card ? (
                  <Pressable style={styles.uploadButton} onPress={() => setPreviewUrl(docUrls.aadhar_card)}>
                    <Text style={styles.uploadText}>View</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.uploadButton} onPress={() => pickAndUpload('aadhar_card')}>
                    <Text style={styles.uploadText}>Upload</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Vehicle Registration</Text>
                  <Text style={styles.documentDesc}>RC document</Text>
                  {!!docUrls.vehicle_registration && (<Text style={styles.docLink}>Uploaded</Text>)}
                </View>
                {docUrls.vehicle_registration ? (
                  <Pressable style={styles.uploadButton} onPress={() => setPreviewUrl(docUrls.vehicle_registration)}>
                    <Text style={styles.uploadText}>View</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.uploadButton} onPress={() => pickAndUpload('vehicle_registration')}>
                    <Text style={styles.uploadText}>Upload</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Insurance</Text>
                  <Text style={styles.documentDesc}>Valid vehicle insurance</Text>
                  {!!docUrls.insurance && (<Text style={styles.docLink}>Uploaded</Text>)}
                </View>
                {docUrls.insurance ? (
                  <Pressable style={styles.uploadButton} onPress={() => setPreviewUrl(docUrls.insurance)}>
                    <Text style={styles.uploadText}>View</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.uploadButton} onPress={() => pickAndUpload('insurance')}>
                    <Text style={styles.uploadText}>Upload</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📷</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Driver with Vehicle Photo</Text>
                  <Text style={styles.documentDesc}>Clear photo of you with vehicle</Text>
                  {!!docUrls.driver_vehicle_photo && (<Text style={styles.docLink}>Uploaded</Text>)}
                </View>
                {docUrls.driver_vehicle_photo ? (
                  <Pressable style={styles.uploadButton} onPress={() => setPreviewUrl(docUrls.driver_vehicle_photo)}>
                    <Text style={styles.uploadText}>View</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.uploadButton} onPress={() => pickAndUpload('driver_vehicle_photo')}>
                    <Text style={styles.uploadText}>Upload</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.version}>Version Captain</Text>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!previewUrl} transparent animationType="fade" onRequestClose={() => setPreviewUrl(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Pressable style={styles.modalClose} onPress={() => setPreviewUrl(null)}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
            {previewUrl && (
              <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedText,
  },
  ratingBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.25,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  cardText: {
    fontSize: 16,
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
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
    color: Colors.text,
  },
  pendingBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verificationMessage: {
    fontSize: 14,
    color: Colors.mutedText,
    marginBottom: 16,
  },
  documentList: {
    gap: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  documentDesc: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  docLink: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: '#00000088',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 18,
  },
  previewImage: {
    width: '100%',
    height: 320,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  version: {
    textAlign: 'center',
    color: Colors.mutedText,
    fontSize: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.mutedText,
    textAlign: 'center',
  },
});
