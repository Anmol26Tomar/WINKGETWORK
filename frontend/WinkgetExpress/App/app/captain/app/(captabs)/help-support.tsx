import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { ArrowLeft, Search, Headphones, ChevronRight, HelpCircle, Smartphone, DollarSign, Package, Coins, MapPin, CreditCard, FileX, Phone, Mail, MessageCircle } from 'lucide-react-native';
import { captainService } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import type { Captain } from '../../types';

const FAQ_CATEGORIES = [
  {
    id: 'general',
    title: 'General FAQs',
    icon: HelpCircle,
    color: '#FF6B35',
    description: 'Basic information about Winkget Express',
  },
  {
    id: 'app',
    title: 'App Issues',
    icon: Smartphone,
    color: '#FF4444',
    description: 'Troubleshooting app problems',
  },
  {
    id: 'earnings',
    title: 'Earnings & Payments',
    icon: DollarSign,
    color: '#22C55E',
    description: 'Payment, rates, and incentives',
  },
  {
    id: 'trips',
    title: 'Trip Management',
    icon: Package,
    color: '#3B82F6',
    description: 'Accepting, completing, and managing trips',
  },
  {
    id: 'profile',
    title: 'Profile & Documents',
    icon: FileX,
    color: '#F59E0B',
    description: 'Profile updates and document verification',
  },
  {
    id: 'support',
    title: 'Contact Support',
    icon: MessageCircle,
    color: '#8B5CF6',
    description: 'Get help from our support team',
  },
];

export default function HelpSupportScreen() {
  const { captain } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [captainProfile, setCaptainProfile] = useState<Captain | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    fetchCaptainProfile();
  }, []);

  const fetchCaptainProfile = async () => {
    try {
      setLoading(true);
      const profile = await captainService.getProfile();
      setCaptainProfile(profile);
    } catch (error) {
      console.error('Error fetching captain profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigation logic here
  };

  const handleTicket = () => {
    Alert.alert(
      'Create Support Ticket',
      'Contact our support team for assistance',
      [
        { text: 'Call Support', onPress: () => handleCallSupport() },
        { text: 'Email Support', onPress: () => handleEmailSupport() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCallSupport = () => {
    // Implement call support functionality
    Alert.alert('Call Support', 'Calling support team...');
  };

  const handleEmailSupport = () => {
    // Implement email support functionality
    Alert.alert('Email Support', 'Opening email client...');
  };

  const handleFAQPress = (categoryId: string) => {
    const category = FAQ_CATEGORIES.find(cat => cat.id === categoryId);
    if (category) {
      Alert.alert(
        category.title,
        category.description,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  const filteredFAQs = FAQ_CATEGORIES.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FF6B35" />
      
      {/* Background with decorative elements */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity onPress={handleTicket} style={styles.ticketButton}>
          <Headphones size={20} color="#000" />
          <Text style={styles.ticketText}>Ticket</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Captain Info Card */}
      {captainProfile && (
        <Animated.View 
          style={[
            styles.captainInfoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.captainInfoContent}>
            <View style={styles.captainAvatar}>
              <Text style={styles.captainInitial}>
                {captainProfile.fullName?.charAt(0) || 'C'}
              </Text>
            </View>
            <View style={styles.captainDetails}>
              <Text style={styles.captainName}>{captainProfile.fullName || 'Captain'}</Text>
              <Text style={styles.captainInfo}>
                {captainProfile.vehicleType?.toUpperCase()} • {captainProfile.city}
              </Text>
              <Text style={styles.captainPhone}>
                <Phone size={12} color="#6B7280" /> {captainProfile.phone}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Search Bar */}
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your queries"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </Animated.View>

      {/* FAQs Section */}
      <Animated.View 
        style={[
          styles.faqContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqTitle}>FAQs</Text>
          <Text style={styles.faqSubtitle}>Find answers to common questions</Text>
        </View>

        <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
          {filteredFAQs.map((category, index) => (
            <Animated.View
              key={category.id}
              style={[
                styles.faqItem,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 50],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.faqItemContent}
                onPress={() => handleFAQPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.faqIcon, { backgroundColor: category.color }]}>
                  <category.icon size={20} color="#FFF" />
                </View>
                <View style={styles.faqTextContainer}>
                  <Text style={styles.faqItemText}>{category.title}</Text>
                  <Text style={styles.faqItemDescription}>{category.description}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Contact Support */}
          <Animated.View
            style={[
              styles.contactSupportContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity style={styles.contactSupportButton} activeOpacity={0.8}>
              <MessageCircle size={20} color="#FF6B35" />
              <Text style={styles.contactSupportText}>Contact Support Team</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF8C42',
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: 'absolute',
    top: 200,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF8C42',
    opacity: 0.2,
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C42',
    opacity: 0.25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FF6B35',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ticketText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  captainInfoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captainInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captainAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  captainInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  captainDetails: {
    flex: 1,
  },
  captainName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  captainInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  captainPhone: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  faqContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  faqHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  faqSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  faqList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  faqTextContainer: {
    flex: 1,
  },
  faqItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginBottom: 2,
  },
  faqItemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactSupportContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  contactSupportButton: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contactSupportText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 8,
  },
});