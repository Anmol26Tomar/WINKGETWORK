import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function HelpScreen() {
  const { captain } = useAuth();

  const faqCategories = [
    {
      icon: '❓',
      title: 'General FAQs',
      description: 'Basic information about Winkget Express',
      color: '#FDB813',
    },
    {
      icon: '📱',
      title: 'App Issues',
      description: 'Troubleshooting app problems',
      color: '#F44336',
    },
    {
      icon: '💰',
      title: 'Earnings & Payments',
      description: 'Payment, rates, and incentives',
      color: '#4CAF50',
    },
    {
      icon: '📦',
      title: 'Trip Management',
      description: 'Accepting, completing, and managing trips',
      color: '#2196F3',
    },
    {
      icon: '📄',
      title: 'Profile & Documents',
      description: 'Profile updates and document verification',
      color: '#FDB813',
    },
    {
      icon: '💬',
      title: 'Contact Support',
      description: 'Get help from our support team',
      color: '#9C27B0',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Pressable style={styles.ticketButton}>
          <Text style={styles.ticketIcon}>🎧</Text>
          <Text style={styles.ticketText}>Ticket</Text>
        </Pressable>
      </View>

      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>{captain?.name?.[0] || 'C'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{captain?.name || 'Captain'}</Text>
          <Text style={styles.profileDetails}>
            {captain?.vehicleType?.toUpperCase()} • {captain?.city || 'Unknown'}
          </Text>
          <View style={styles.profileContact}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactNumber}>{captain?.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search your queries</Text>
      </View>

      {/* FAQs Section */}
      <View style={styles.faqsSection}>
        <Text style={styles.faqsTitle}>FAQs</Text>
        <Text style={styles.faqsSubtitle}>Find answers to common questions</Text>

        <ScrollView style={styles.faqsList}>
          {faqCategories.map((faq, index) => (
            <Pressable key={index} style={styles.faqCard}>
              <View style={[styles.faqIconContainer, { backgroundColor: faq.color + '20' }]}>
                <Text style={styles.faqIcon}>{faq.icon}</Text>
              </View>
              <View style={styles.faqContent}>
                <Text style={styles.faqTitle}>{faq.title}</Text>
                <Text style={styles.faqDescription}>{faq.description}</Text>
              </View>
              <Text style={styles.faqArrow}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ticketIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  ticketText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  profileContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  contactNumber: {
    fontSize: 14,
    color: '#2C3E50',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  faqsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  faqsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  faqsSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  faqsList: {
    flex: 1,
  },
  faqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  faqIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  faqIcon: {
    fontSize: 24,
  },
  faqContent: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  faqArrow: {
    fontSize: 24,
    color: '#7F8C8D',
  },
});
