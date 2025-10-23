import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { rawCategories } from '../../utils/categories';
import api from '../../config/api';
import { testAPIConnection, testVendorAPI } from '../../utils/networkTest';
import HeaderSection from './components/HeaderSection';
import PromotionalBanner from './components/PromotionalBanner';
import CategoryGrid from './components/CategoryGrid';
import { FadeInView, FadeInUpView } from './components/animations';
import FeaturedBusinesses from './components/FeaturedBusinesses';
import JustdialBanner from './components/JustdialBanner';
import ServiceIcons from './components/ServiceIcons';
import FestivalBanner from './components/FestivalBanner';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadCategories();
    runAPITests();
  }, []);

  const runAPITests = async () => {
    console.log('🧪 Running API connection tests...');
    
    // Test basic health endpoint
    const healthResult = await testAPIConnection();
    
    // Test vendor API
    const vendorResult = await testVendorAPI('Electronics');
    
    console.log('📊 Test Results:', {
      health: healthResult.success,
      vendor: vendorResult.success
    });
  };



  const loadCategories = () => {
    // Previous categories first, then additional categories
    const previousCategories = [
      { name: 'Electronics', icon: 'mobile-alt' },
      { name: 'Fashion', icon: 'tshirt' },
      { name: 'Home & Furniture', icon: 'home' },
      { name: 'Beauty & Personal Care', icon: 'spa' },
      { name: 'Grocery & Essentials', icon: 'shopping-basket' },
    ];

    const additionalCategories = [
      { name: 'Contractor', icon: 'tools' },
      { name: 'Placement Service', icon: 'user-tie' },
      { name: 'Event Organisers', icon: 'calendar-alt' },
      { name: 'Restaurants', icon: 'utensils' },
      { name: 'Real Estate', icon: 'home' },
      { name: 'Home Decor', icon: 'couch' },
      { name: 'Automobile', icon: 'car' },
      { name: 'Software & Website', icon: 'laptop-code' },
      { name: 'Tour & Travels', icon: 'suitcase-rolling' },
      { name: 'Hotel', icon: 'hotel' },
      { name: 'Packers & Movers', icon: 'truck-moving' },
      { name: 'Electricians', icon: 'bolt' },
      { name: 'Plumbers', icon: 'water' },
      { name: 'Education & Training', icon: 'chalkboard-teacher' },
      { name: 'Beauty & Wellness', icon: 'spa' },
      { name: 'Medical & Healthcare', icon: 'stethoscope' },
      { name: 'Pet Services', icon: 'paw' },
      { name: 'Photography', icon: 'camera-retro' },
    ];

    const enhancedCategories = [...previousCategories, ...additionalCategories];
    setCategories(enhancedCategories);
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      // Previous categories
      'Electronics': 'mobile-alt',
      'Fashion': 'tshirt',
      'Home & Furniture': 'home',
      'Beauty & Personal Care': 'spa',
      'Grocery & Essentials': 'shopping-basket',
      // Additional categories
      'Contractor': 'tools',
      'Placement Service': 'user-tie',
      'Event Organisers': 'calendar-alt',
      'Restaurants': 'utensils',
      'Real Estate': 'home',
      'Home Decor': 'couch',
      'Automobile': 'car',
      'Software & Website': 'laptop-code',
      'Tour & Travels': 'suitcase-rolling',
      'Hotel': 'hotel',
      'Packers & Movers': 'truck-moving',
      'Electricians': 'bolt',
      'Plumbers': 'water',
      'Education & Training': 'chalkboard-teacher',
      'Beauty & Wellness': 'spa',
      'Medical & Healthcare': 'stethoscope',
      'Pet Services': 'paw',
      'Photography': 'camera-retro',
    };
    return iconMap[categoryName] || 'grid';
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryBusinessList', { category: category.name });
  };

  const handleSearchChange = (text) => {
    setSearchValue(text);
  };

  const handleSearchPress = (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      navigation.navigate('CategoryPage');
      return;
    }

    // Prefer exact match first
    const exact = categories.find(c => c.name.toLowerCase() === q);
    if (exact) {
      navigation.navigate('CategoryBusinessList', { category: exact.name });
      return;
    }

    // Fallback to first partial match
    const partial = categories.find(c => c.name.toLowerCase().includes(q));
    if (partial) {
      navigation.navigate('CategoryBusinessList', { category: partial.name });
      return;
    }

    // Nothing matched → go to CategoryPage
    navigation.navigate('CategoryPage');
  };

  const handleFilterPress = () => {
    // Navigate to filter page or show filter modal
    console.log('Filter pressed');
  };

  const handleNotificationPress = () => {
    // Navigate to notifications page
    console.log('Notifications pressed');
  };

  const handleBannerPress = (banner) => {
    // Handle banner press - could navigate to specific category or offer
    console.log('Banner pressed:', banner);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <FadeInView>
        <HeaderSection 
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onSearchPress={handleSearchPress}
          onFilterPress={handleFilterPress}
          onNotificationPress={handleNotificationPress}
        />
      </FadeInView>
      <View style={styles.content}>
        <FadeInUpView delay={80}>
          <PromotionalBanner onBannerPress={handleBannerPress} />
        </FadeInUpView>
        <FadeInUpView delay={140}>
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="grid" size={24} color="#007BFF" />
                <Text style={styles.sectionTitle}>Business Categories</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Discover businesses by category
              </Text>
            </View>
            <CategoryGrid categories={categories} onPressCategory={handleCategoryPress} />
          </View>
        </FadeInUpView>
        <FadeInUpView delay={180}>
          <FeaturedBusinesses
            onPressViewAll={() => {
              // Navigate to categories page to view all vendors by category
              navigation.navigate('CategoryPage');
            }}
            onPressItem={(vendor) => {
              console.log('🌟 Featured vendor pressed:', vendor);
              // Navigate directly to vendor profile/store screen
              navigation.navigate('VendorStore', { 
                vendorId: vendor.id,
                vendorName: vendor.shopName || vendor.storeName || vendor.name,
                vendor: vendor
              });
            }}
          />
        </FadeInUpView>
        
        {/* Justdial-style Banner */}
        <FadeInUpView delay={220}>
          <JustdialBanner 
            onPress={() => {
              console.log('Justdial banner pressed');
              // Navigate to business listing page
            }}
          />
        </FadeInUpView>
        
        {/* Service Icons Section */}
        <FadeInUpView delay={240}>
          <ServiceIcons 
            onServicePress={(service) => {
              console.log('Service pressed:', service);
              // Handle service navigation
            }}
          />
        </FadeInUpView>
        
        {/* Festival Decorators Banner */}
        <FadeInUpView delay={260}>
          <FestivalBanner 
            onPress={() => {
              console.log('Festival banner pressed');
              // Navigate to event organizers or decorators
              navigation.navigate('CategoryBusinessList', { category: 'Event Organisers' });
            }}
          />
        </FadeInUpView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  categoriesSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 12,
    fontFamily: 'Inter',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginLeft: 36,
  },
});

export default DashboardScreen;