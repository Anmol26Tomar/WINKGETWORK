import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { captainTripApi } from '../lib/api';

export default function ProfileScreen() {
  const { captain, logout } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    email: '',
    city: '',
    phone: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await captainTripApi.getProfile();
      if (response.data) {
        setProfileData({
          email: response.data.email || captain?.email || 'N/A',
          city: response.data.city || captain?.city || 'N/A',
          phone: response.data.phone || captain?.phone || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use captain data as fallback
      setProfileData({
        email: captain?.email || 'N/A',
        city: captain?.city || 'N/A',
        phone: captain?.phone || 'N/A'
      });
    } finally {
      setLoading(false);
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
        <ActivityIndicator size="large" color="#86CB92" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Available for Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available for Trips</Text>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>You are {isOnline ? 'online' : 'offline'}</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: '#E8E8E8', true: '#86CB92' }}
                thumbColor={isOnline ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

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
              <Text style={styles.infoIcon}>✉️</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileData.email}</Text>
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
                </View>
                <Pressable style={styles.uploadButton}>
                  <Text style={styles.uploadText}>Upload</Text>
                </Pressable>
              </View>
              
              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Vehicle Registration</Text>
                  <Text style={styles.documentDesc}>Vehicle registration certificate</Text>
                </View>
                <Pressable style={styles.uploadButton}>
                  <Text style={styles.uploadText}>Upload</Text>
                </Pressable>
              </View>
              
              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>PAN Card</Text>
                  <Text style={styles.documentDesc}>PAN card for tax purposes</Text>
                </View>
                <Pressable style={styles.uploadButton}>
                  <Text style={styles.uploadText}>Upload</Text>
                </Pressable>
              </View>
              
              <View style={styles.documentItem}>
                <Text style={styles.documentIcon}>📄</Text>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Aadhar Card</Text>
                  <Text style={styles.documentDesc}>Aadhar card for identity verification</Text>
                </View>
                <Pressable style={styles.uploadButton}>
                  <Text style={styles.uploadText}>Upload</Text>
                </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
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
    color: '#2C3E50',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: '#2C3E50',
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
    color: '#7F8C8D',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2C3E50',
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
    color: '#2C3E50',
  },
  pendingBadge: {
    backgroundColor: '#86CB92',
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
    color: '#7F8C8D',
    marginBottom: 16,
  },
  documentList: {
    gap: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
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
    color: '#2C3E50',
    marginBottom: 4,
  },
  documentDesc: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  uploadButton: {
    backgroundColor: '#86CB92',
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
    backgroundColor: '#86CB92',
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
    color: '#95A5A6',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
});
