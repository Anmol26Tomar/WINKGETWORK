import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput, // Cleaned up imports
} from 'react-native';
// Use react-native-safe-area-context for better edge control
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { captainTripApi } from '../lib/api';
import { Feather } from '@expo/vector-icons';

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
  blue: '#2563EB', // The blue you requested
  purple: '#7C3AED',
  orange: '#F59E0B',
};

// Define icon mapping (no changes)
const faqIconMap: { [key: string]: React.ComponentProps<typeof Feather>['name'] } = {
  'General FAQs': 'help-circle',
  'App Issues': 'smartphone',
  'Earnings & Payments': 'dollar-sign',
  'Trip Management': 'map-pin',
  'Profile & Documents': 'file-text',
  'Contact Support': 'message-square',
};

// Define color mapping (no changes)
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
  // ✅ POLISH: Add state for the search bar
  const [searchQuery, setSearchQuery] = useState('');

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
    // ✅ POLISH: Use SafeAreaView to handle status bar with the new blue header
    // Use edges to only apply top inset padding, background color handles the rest.
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ✅ FIX: Fixed Header (the "Blue Tab") */}
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Pressable 
          style={styles.ticketButton}
          // ✅ POLISH: Added placeholder onPress
          onPress={() => console.log('Navigate to My Tickets')}
        >
          <Feather name="message-square" size={16} color={THEME.white} />
          <Text style={styles.ticketText}>My Tickets</Text>
        </Pressable>
      </View>

      {/* ✅ POLISH: Moved ScrollView here to only scroll content, not the header */}
      <ScrollView style={styles.scrollContainer}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>{(profileData?.name || captain?.name || 'C')?.[0] || 'C'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData?.name || captain?.name || 'Captain'}</Text>
            </View>
          </View>
          <View style={styles.profileRight}>
            <View style={styles.profileDetailRow}>
              <Feather name="phone" size={14} color={THEME.textMuted} />
              <Text style={styles.contactNumber}>{profileData?.phone || captain?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.profileVehicleRow}>
              <Text style={styles.profileDetails}>
                {(profileData?.vehicleType || 'UNKNOWN')?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileCity}>
              {profileData?.city || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={THEME.textMuted} />
          <TextInput
            // ✅ POLISH: Renamed style to 'searchInput' and applied state
            style={styles.searchInput}
            placeholder="Search your queries"
            placeholderTextColor={THEME.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
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
                <Pressable 
                  key={index} 
                  style={styles.faqCard}
                  // ✅ POLISH: Added placeholder onPress
                  onPress={() => console.log('Navigate to FAQ:', faq.title)}
                >
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
    // ✅ FIX: Set base background to blue for the header/status bar area
    backgroundColor: THEME.blue,
  },
  // ✅ POLISH: Added a separate scroll container for the content
  scrollContainer: {
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
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: THEME.blue,
    minHeight: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    // ✅ FIX: Changed text to white to be visible on blue
    color: THEME.white,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // ✅ FIX: Changed to an "outline" style button for better contrast
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.white,
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
    // ✅ POLISH: Added margin to top to space it from the fixed header
    marginTop: 24,
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
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.blue,
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
  },
  profileRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  profileDetails: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  profileVehicleRow: {
    marginBottom: 6,
  },
  profileCity: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '500',
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
  // ✅ POLISH: Renamed from 'searchPlaceholder' for clarity
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    // ✅ POLISH: Set text color for what the user types
    color: THEME.text,
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