import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FadeInUpView } from './animations';
import api, { API_ENDPOINTS } from '../../../config/api';

const FeaturedBusinesses = ({ onPressItem, onPressViewAll }) => {
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedVendors();
  }, []);

  const loadFeaturedVendors = async () => {
    try {
      setLoading(true);
      console.log('🌟 Loading featured vendors...');
      
      // Get vendors from different categories
      const categories = ['Electronics', 'Fashion', 'Home & Furniture', 'Beauty & Personal Care'];
      const allVendors = [];
      
      for (const category of categories) {
        try {
          const response = await api.get(`${API_ENDPOINTS.VENDORS.BY_CATEGORY}/${encodeURIComponent(category)}`);
          if (response.data.success && response.data.vendors) {
            const categoryVendors = response.data.vendors.slice(0, 2).map(vendor => ({
              ...vendor,
              category: category,
              id: vendor._id
            }));
            allVendors.push(...categoryVendors);
          }
        } catch (error) {
          console.log(`⚠️ Could not load vendors for ${category}:`, error.message);
        }
      }
      
      // Shuffle and take top 8 vendors
      const shuffled = allVendors.sort(() => 0.5 - Math.random());
      setFeaturedVendors(shuffled.slice(0, 8));
      
    } catch (error) {
      console.error('❌ Error loading featured vendors:', error);
      // Fallback to sample data
      setFeaturedVendors(getSampleVendors());
    } finally {
      setLoading(false);
    }
  };

  const getSampleVendors = () => [
    {
      id: '1',
      shopName: 'TechHub Electronics',
      category: 'Electronics',
      businessProfilePic: null,
      averageRating: 4.8,
      totalReviews: 156,
      businessAddress: { city: 'Gorakhpur', state: 'UP' }
    },
    {
      id: '2',
      shopName: 'Fashion Forward',
      category: 'Fashion',
      businessProfilePic: null,
      averageRating: 4.6,
      totalReviews: 89,
      businessAddress: { city: 'Gorakhpur', state: 'UP' }
    },
    {
      id: '3',
      shopName: 'Home Decor Plus',
      category: 'Home & Furniture',
      businessProfilePic: null,
      averageRating: 4.9,
      totalReviews: 203,
      businessAddress: { city: 'Gorakhpur', state: 'UP' }
    },
    {
      id: '4',
      shopName: 'Beauty Bliss',
      category: 'Beauty & Personal Care',
      businessProfilePic: null,
      averageRating: 4.7,
      totalReviews: 124,
      businessAddress: { city: 'Gorakhpur', state: 'UP' }
    }
  ];

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Electronics': 'phone-portrait',
      'Fashion': 'shirt',
      'Home & Furniture': 'home',
      'Beauty & Personal Care': 'sparkles',
      'Grocery & Essentials': 'basket',
    };
    return iconMap[category] || 'business';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'Electronics': '#007BFF',
      'Fashion': '#E91E63',
      'Home & Furniture': '#4CAF50',
      'Beauty & Personal Care': '#FF9800',
      'Grocery & Essentials': '#9C27B0',
    };
    return colorMap[category] || '#007BFF';
  };

  const renderVendorCard = (vendor, index) => (
    <FadeInUpView delay={index * 100} key={vendor.id}>
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8} 
        onPress={() => onPressItem?.(vendor)}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.cardGradient}
        >
          <View style={styles.imageContainer}>
            {vendor.businessProfilePic ? (
              <Image 
                source={{ uri: vendor.businessProfilePic }} 
                style={styles.vendorImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: `${getCategoryColor(vendor.category)}20` }]}>
                <Ionicons 
                  name={getCategoryIcon(vendor.category)} 
                  size={28} 
                  color={getCategoryColor(vendor.category)} 
                />
              </View>
            )}
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(vendor.category) }]}>
              <Text style={styles.categoryText}>{vendor.category}</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.vendorName} numberOfLines={2}>
              {vendor.shopName || vendor.storeName || vendor.name || 'Business Name'}
            </Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {vendor.averageRating ? vendor.averageRating.toFixed(1) : '4.5'}
                </Text>
                <Text style={styles.reviewCount}>
                  ({vendor.totalReviews || 0} reviews)
                </Text>
              </View>
            </View>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {vendor.businessAddress?.city || 'Gorakhpur'}, {vendor.businessAddress?.state || 'UP'}
              </Text>
            </View>
            
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </FadeInUpView>
  );

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Featured Vendors</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007BFF" />
          <Text style={styles.loadingText}>Loading featured vendors...</Text>
        </View>
      </View>
    );
  }

  if (!featuredVendors || featuredVendors.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Featured Vendors</Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={() => onPressViewAll?.()}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#007BFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scroller}
        decelerationRate="fast"
        snapToInterval={200}
        snapToAlignment="start"
      >
        {featuredVendors.map((vendor, index) => renderVendorCard(vendor, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EAF3FF',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007BFF',
    marginRight: 4,
  },
  scroller: {
    paddingRight: 20,
  },
  card: {
    width: 240,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  ratingContainer: {
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default FeaturedBusinesses;


