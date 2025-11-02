import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
   // Import SafeAreaView
  TextInput // Import TextInput

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { captainTripApi } from '../lib/api';
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
  blue: '#2563EB',
  purple: '#7C3AED',
  orange: '#F59E0B',
};

// Define icon mapping
const faqIconMap: { [key: string]: React.ComponentProps<typeof Feather>['name'] } = {
  'General FAQs': 'help-circle',
  'App Issues': 'smartphone',
  'Earnings & Payments': 'dollar-sign',
  'Trip Management': 'map-pin',
  'Profile & Documents': 'file-text',
  'Contact Support': 'message-square',
};

const faqColorMap: { [key: string]: string } = {
  'General FAQs': THEME.blue,
  'App Issues': THEME.danger,
  'Earnings & Payments': THEME.primary,
  'Trip Management': THEME.orange,
  'Profile & Documents': THEME.textDark,
  'Contact Support': THEME.purple,
};


export default function HelpScreen() {
  const { captain } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await captainTripApi.getProfile();
        if (response?.data) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.warn('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const faqCategories = [
    {
      title: 'General FAQs',
      description: 'Basic information about Winkget Express',
    },
    {
      title: 'App Issues',
      description: 'Troubleshooting app problems',
    },
    {
      title: 'Earnings & Payments',
      description: 'Payment, rates, and incentives',
    },
    {
      title: 'Trip Management',
      description: 'Accepting, completing, and managing trips',
    },
    {
      title: 'Profile & Documents',
      description: 'Profile updates and document verification',
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Pressable style={styles.ticketButton}>
            <Feather name="message-square" size={16} color={THEME.white} />
            <Text style={styles.ticketText}>My Tickets</Text>
          </Pressable>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{(profileData?.name || captain?.name || 'C')?.[0] || 'C'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData?.name || captain?.name || 'Captain'}</Text>
            <Text style={styles.profileDetails}>
              {(profileData?.vehicleType || 'UNKNOWN')?.toUpperCase()} • {profileData?.city || 'Unknown'}
            </Text>
            <View style={styles.profileContact}>
              <Feather name="phone" size={14} color={THEME.textMuted} />
              <Text style={styles.contactNumber}>{profileData?.phone || captain?.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={THEME.textMuted} />
          <TextInput 
            style={styles.searchPlaceholder} 
            placeholder="Search your queries"
            placeholderTextColor={THEME.textMuted}
          />
        </View>

        {/* FAQs Section */}
        <View style={styles.faqsSection}>
          <Text style={styles.faqsTitle}>FAQs</Text>
          <Text style={styles.faqsSubtitle}>Find answers to common questions</Text>

          <View style={styles.faqsList}>
            {faqCategories.map((faq, index) => {
              const iconName = faqIconMap[faq.title] || 'help-circle';
              const iconColor = faqColorMap[faq.title] || THEME.primary;
              return (
                <Pressable key={index} style={styles.faqCard}>
                  <View style={[styles.faqIconContainer, { backgroundColor: iconColor + '1A' }]}>
                    <Feather name={iconName} size={22} color={iconColor} />
                  </View>
                  <View style={styles.faqContent}>
                    <Text style={styles.faqTitle}>{faq.title}</Text>
                    <Text style={styles.faqDescription}>{faq.description}</Text>
                  </View>
                  <Feather name="chevron-right" size={22} color={THEME.textMuted} />
                </Pressable>
              )
            })}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  ticketText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.white,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: THEME.white,
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 24,
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
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: '600',
    color: THEME.white,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: THEME.textMuted,
    marginBottom: 8,
    fontWeight: '500',
  },
  profileContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactNumber: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: THEME.textMuted,
  },
  faqsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  faqsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  faqsSubtitle: {
    fontSize: 16,
    color: THEME.textMuted,
    marginBottom: 20,
  },
  faqsList: {
    flex: 1,
  },
  faqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  faqIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  faqContent: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: THEME.textMuted,
  },
});