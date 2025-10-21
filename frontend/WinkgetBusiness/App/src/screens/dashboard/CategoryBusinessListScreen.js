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
  TextInput,
} from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { API_ENDPOINTS } from '../../config/api';

const CategoryBusinessListScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, [category]);

  useEffect(() => {
    // Filter businesses based on search query
    if (searchQuery.trim() === '') {
      setFilteredBusinesses(businesses);
    } else {
      const filtered = businesses.filter(business => {
        const businessName = (business.shopName || business.storeName || business.name || '').toLowerCase();
        const ownerName = (business.ownerName || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return businessName.includes(query) || ownerName.includes(query);
      });
      setFilteredBusinesses(filtered);
    }
  }, [searchQuery, businesses]);

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
        setFilteredBusinesses(vendors || []);
        
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
      <Card.Content style={styles.cardContent}>
        {/* Business Header with Image */}
        <View style={styles.businessHeader}>
          <View style={styles.businessInfo}>
            <View style={styles.businessTitleRow}>
              <Title style={styles.businessName}>
                {business.shopName || business.storeName || business.name || 'Business Name'}
              </Title>
              {business.averageRating > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>{business.averageRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <Paragraph style={styles.businessDescription} numberOfLines={2}>
              {business.aboutBusiness || business.briefInfo || 'No description available'}
            </Paragraph>
          </View>
          <View style={styles.imageContainer}>
            {business.businessProfilePic ? (
              <Image 
                source={{ uri: business.businessProfilePic }} 
                style={styles.businessImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="business" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>
        </View>
        
        {/* Business Details Grid */}
        <View style={styles.businessDetails}>
          {/* Owner and Contact Row */}
          <View style={styles.detailsRow}>
            {business.ownerName && (
              <View style={styles.detailItem}>
                <Ionicons name="person" size={16} color="#007BFF" />
                <Text style={styles.detailLabel}>Owner</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{business.ownerName}</Text>
              </View>
            )}
            {business.businessContact && (
              <View style={styles.detailItem}>
                <Ionicons name="call" size={16} color="#007BFF" />
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{business.businessContact}</Text>
              </View>
            )}
          </View>
          
          {/* Address Row */}
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color="#007BFF" />
            <Text style={styles.addressText} numberOfLines={2}>
              {business.businessAddress?.street && `${business.businessAddress.street}, `}
              {business.businessAddress?.city || 'City not specified'}
              {business.businessAddress?.state && `, ${business.businessAddress.state}`}
              {business.businessAddress?.pincode && ` - ${business.businessAddress.pincode}`}
            </Text>
          </View>
          
          {/* Email and Website Row */}
          <View style={styles.detailsRow}>
            {business.businessEmail && (
              <View style={styles.detailItem}>
                <Ionicons name="mail" size={16} color="#007BFF" />
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{business.businessEmail}</Text>
              </View>
            )}
            {business.websiteLink && (
              <View style={styles.detailItem}>
                <Ionicons name="globe" size={16} color="#007BFF" />
                <Text style={styles.detailLabel}>Website</Text>
                <Text style={[styles.detailValue, styles.linkText]} numberOfLines={1}>Visit Website</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.businessActions}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => {
              navigation.navigate('VendorStore', { 
                vendorId: business._id,
                vendorName: business.shopName || business.storeName || business.name,
                vendor: business
              });
            }}
          >
            <Ionicons name="eye" size={16} color="#3B82F6" />
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              if (business.businessContact) {
                Alert.alert(
                  'Contact Business',
                  `Call ${business.shopName || business.storeName || business.name} at ${business.businessContact}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call', onPress: () => {
                      Alert.alert('Call', `Would call ${business.businessContact}`);
                    }}
                  ]
                );
              } else {
                Alert.alert('No Contact', 'Contact information not available for this business.');
              }
            }}
          >
            <Ionicons name="call" size={16} color="white" />
            <Text style={styles.contactText}>Contact</Text>
          </TouchableOpacity>
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
        colors={["#007BFF", "#4FC3F7", "#EAF3FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007BFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.categoryIconContainer}>
              <Ionicons 
                name={getCategoryIcon(category)} 
                size={32} 
                color="#007BFF" 
              />
            </View>
            <Title style={styles.headerTitle}>{category}</Title>
            <Text style={styles.headerSubtitle}>
              {businesses.length} businesses found
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search Bar */}
        {businesses.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons name="mic-outline" size={18} color="#6B7280" style={styles.searchLeftIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search businesses in ${category}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={18} color="#007BFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

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
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryIconContainer}>
                    <Ionicons name="analytics" size={24} color="#007BFF" />
                  </View>
                  <Title style={styles.summaryTitle}>Category Summary</Title>
                </View>
                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{filteredBusinesses.length}</Text>
                    <Text style={styles.statLabel}>Businesses</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {businesses.length > 0 ? 
                        (businesses.reduce((sum, b) => sum + (b.averageRating || 0), 0) / businesses.length).toFixed(1) 
                        : '0.0'
                      }
                    </Text>
                    <Text style={styles.statLabel}>Avg Rating</Text>
                  </View>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryLabel}>Category</Text>
                </View>
              </Card.Content>
            </Card>

            {filteredBusinesses.map(renderBusinessCard)}
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
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },
  header: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'Inter',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#F0F9FF',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    marginBottom: 20,
    elevation: 3,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    minHeight: 60,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  categoryInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  businessCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardContent: {
    padding: 20,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  businessInfo: {
    flex: 1,
    marginRight: 16,
  },
  businessTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  imageContainer: {
    width: 70,
    height: 70,
  },
  businessImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessDetails: {
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007BFF',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007BFF',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  businessActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  emptyCard: {
    elevation: 3,
    borderRadius: 16,
    backgroundColor: 'white',
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
  searchContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  searchLeftIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EAF3FF',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryBusinessListScreen;
