import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { API_ENDPOINTS } from '../../config/api';

const CategoryBusinessListScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, [category]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      // Debug: Log the API endpoint being called
      const endpoint = `${API_ENDPOINTS.VENDORS.BY_CATEGORY}/${encodeURIComponent(category)}`;
      console.log('🔍 API Endpoint:', endpoint);
      console.log('📡 Base URL:', api.defaults.baseURL);
      console.log('🎯 Full URL:', `${api.defaults.baseURL}${endpoint}`);
      
      // Send request to backend with category parameter
      const response = await api.get(endpoint);
      
      console.log('✅ Response received:', response.data);
      
      // Handle the enhanced backend response
      if (response.data && response.data.success) {
        const { vendors, totalFound, message } = response.data;
        
        // Display vendor details dynamically
        setBusinesses(vendors || []);
        
        // Show success message if no vendors found (empty results)
        if (totalFound === 0) {
          Alert.alert(
            'No Results',
            message || `No businesses found in the ${category} category.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // Handle backend error response
        const errorMessage = response.data?.message || 'Failed to load businesses';
        setBusinesses([]);
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      
      // Proper error handling for different error types
      let errorMessage = 'Failed to load businesses. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        if (status === 400) {
          errorMessage = data?.message || 'Invalid category parameter';
        } else if (status === 404) {
          errorMessage = `Category "${category}" not found or API endpoint not available`;
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data?.message || `Server error (${status})`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = `Network error. Please check if the server is running at ${api.defaults.baseURL}`;
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setBusinesses([]);
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses();
    setRefreshing(false);
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Electronics': 'phone-portrait',
      'Fashion': 'shirt',
      'Home & Furniture': 'home',
      'Beauty & Personal Care': 'sparkles',
      'Grocery & Essentials': 'basket',
    };
    return iconMap[categoryName] || 'business';
  };

  const renderBusinessCard = (business) => (
    <Card key={business._id} style={styles.businessCard}>
      <Card.Content>
        <View style={styles.businessHeader}>
          <View style={styles.businessInfo}>
            <Title style={styles.businessName}>
              {business.shopName || business.storeName || business.name || 'Business Name'}
            </Title>
            <Paragraph style={styles.businessDescription}>
              {business.aboutBusiness || business.briefInfo || 'No description available'}
            </Paragraph>
          </View>
          {business.businessProfilePic && (
            <Image 
              source={{ uri: business.businessProfilePic }} 
              style={styles.businessImage}
            />
          )}
        </View>
        
        <View style={styles.businessDetails}>
          {/* Owner Name */}
          {business.ownerName && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Owner: {business.ownerName}</Text>
            </View>
          )}
          
          {/* Address */}
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {business.businessAddress?.street && `${business.businessAddress.street}, `}
              {business.businessAddress?.city || 'City not specified'}
              {business.businessAddress?.state && `, ${business.businessAddress.state}`}
              {business.businessAddress?.pincode && ` - ${business.businessAddress.pincode}`}
            </Text>
          </View>
          
          {/* Contact Information */}
          {business.businessContact && (
            <View style={styles.detailRow}>
              <Ionicons name="call" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{business.businessContact}</Text>
            </View>
          )}
          
          {business.businessEmail && (
            <View style={styles.detailRow}>
              <Ionicons name="mail" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{business.businessEmail}</Text>
            </View>
          )}
          
          {/* Rating */}
          {business.averageRating > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.detailText}>
                {business.averageRating.toFixed(1)} ({business.totalReviews} reviews)
              </Text>
            </View>
          )}
          
          {/* Website */}
          {business.websiteLink && (
            <View style={styles.detailRow}>
              <Ionicons name="globe" size={16} color="#6B7280" />
              <Text style={[styles.detailText, styles.linkText]}>Visit Website</Text>
            </View>
          )}
        </View>

        <View style={styles.businessActions}>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to MyBusinessScreen with business ID
              navigation.navigate('MyBusiness', { 
                businessId: business._id,
                businessName: business.shopName || business.storeName || business.name
              });
            }}
          >
            View Details
          </Button>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            onPress={() => {
              // Contact functionality
              if (business.businessContact) {
                Alert.alert(
                  'Contact Business',
                  `Call ${business.shopName} at ${business.businessContact}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call', onPress: () => {
                      // In a real app, you would use Linking to make a phone call
                      Alert.alert('Call', `Would call ${business.businessContact}`);
                    }}
                  ]
                );
              } else {
                Alert.alert('No Contact', 'Contact information not available for this business.');
              }
            }}
          >
            Contact
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading businesses...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons 
              name={getCategoryIcon(category)} 
              size={48} 
              color="white" 
            />
            <Title style={styles.headerTitle}>{category}</Title>
            <Text style={styles.headerSubtitle}>
              {businesses.length} businesses found
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {businesses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyContent}>
                <Ionicons name="business" size={64} color="#9CA3AF" />
                <Title style={styles.emptyTitle}>No Businesses Found</Title>
                <Paragraph style={styles.emptyText}>
                  There are no businesses in the {category} category yet.
                </Paragraph>
                <Button 
                  mode="contained" 
                  onPress={onRefresh}
                  style={styles.refreshButton}
                >
                  Refresh
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Title style={styles.summaryTitle}>📊 Category Summary</Title>
                <Paragraph style={styles.summaryText}>
                  Found {businesses.length} businesses in the {category} category.
                  {businesses.length > 0 && (
                    <Text> Average rating: {
                      (businesses.reduce((sum, b) => sum + (b.averageRating || 0), 0) / businesses.length).toFixed(1)
                    }</Text>
                  )}
                </Paragraph>
              </Card.Content>
            </Card>

            {businesses.map(renderBusinessCard)}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  businessCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  businessDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  linkText: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  businessActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyCard: {
    elevation: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    marginTop: 8,
  },
});

export default CategoryBusinessListScreen;
