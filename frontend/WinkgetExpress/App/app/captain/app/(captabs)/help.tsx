import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { 
  HelpCircle, 
  ChevronRight, 
  Phone, 
  MapPin, 
  MessageCircle,
  FileText,
  IndianRupee,
  Car,
  User,
  Settings
} from 'lucide-react-native';
import AnimatedView from '../../components/AnimatedView';
import AnimatedCard from '../../components/AnimatedCard';
import { useAuth } from '../../../../context/AuthContext';

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, captain, role } = useAuth();

  const displayName = useMemo(() => {
    const name = (role === 'captain' ? captain?.fullName || captain?.name : user?.name || user?.fullName) || 'Guest';
    return name;
  }, [user, captain, role]);

  const phone = useMemo(() => {
    return (role === 'captain' ? captain?.phone : user?.phone) || '—';
  }, [user, captain, role]);

  const initial = useMemo(() => (displayName ? displayName.charAt(0).toUpperCase() : 'G'), [displayName]);

  const faqCategories = [
    {
      id: 'general',
      title: 'General FAQs',
      description: 'Basic information about Winkget Express',
      icon: HelpCircle,
      color: '#FB923C',
    },
    {
      id: 'app',
      title: 'App Issues',
      description: 'Troubleshooting app problems',
      icon: Settings,
      color: '#EF4444',
    },
    {
      id: 'earnings',
      title: 'Earnings & Payments',
      description: 'Payment, rates, and incentives',
      icon: IndianRupee,
      color: '#10B981',
    },
    {
      id: 'trips',
      title: 'Trip Management',
      description: 'Accepting, completing, and managing trips',
      icon: Car,
      color: '#3B82F6',
    },
    {
      id: 'profile',
      title: 'Profile & Documents',
      description: 'Profile updates and document verification',
      icon: User,
      color: '#FB923C',
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: MessageCircle,
      color: '#8B5CF6',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity style={styles.ticketButton}>
          <MessageCircle size={20} color="#FFFFFF" />
          <Text style={styles.ticketText}>Ticket</Text>
        </TouchableOpacity>
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userService}>{role === 'captain' ? 'CAPTAIN' : 'USER'}</Text>
          <View style={styles.userContact}>
            <Phone size={14} color="#6B7280" />
            <Text style={styles.userPhone}>{phone}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <HelpCircle size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your queries"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* FAQs Section */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>FAQs</Text>
        <Text style={styles.faqSubtitle}>Find answers to common questions</Text>

        <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
          {faqCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <AnimatedView 
                key={category.id} 
                animationType="slideUp" 
                delay={index * 100}
                style={styles.faqItem}
              >
                <AnimatedCard style={styles.faqItem}>
                  <View style={[styles.faqIcon, { backgroundColor: category.color }]}>
                    <IconComponent size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.faqContent}>
                    <Text style={styles.faqItemTitle}>{category.title}</Text>
                    <Text style={styles.faqDescription}>{category.description}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </AnimatedCard>
              </AnimatedView>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FB923C',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  ticketText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  faqSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  faqSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  faqList: {
    flex: 1,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  faqContent: {
    flex: 1,
  },
  faqItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
