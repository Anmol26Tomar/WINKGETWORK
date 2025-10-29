import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { captainTripApi } from '../lib/api';
import { Colors } from '@/constants/colors';

export default function ProfileScreen() {
  const { captain, logout } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    email: '',
    city: '',
    phone: '',
    rating: 4.8
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
          phone: response.data.phone || captain?.phone || 'N/A',
          rating: response.data.rating || 4.8
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use captain data as fallback
      setProfileData({
        email: captain?.email || 'N/A',
        city: captain?.city || 'N/A',
        phone: captain?.phone || 'N/A',
        rating: 4.8
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
            {/* Email removed as requested */}
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
  },
});
