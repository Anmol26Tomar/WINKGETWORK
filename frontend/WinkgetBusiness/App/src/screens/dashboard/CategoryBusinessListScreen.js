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
      const response = await api.get(`${API_ENDPOINTS.VENDORS.BY_CATEGORY}/${category}`);
      
      if (response.data && response.data.vendors) {
        setBusinesses(response.data.vendors);
      } else {
        setBusinesses([]);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      Alert.alert(
        'Error',
        'Failed to load businesses. Please try again.',
        [{ text: 'OK' }]
      );
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
              {business.shopName || business.storeName || 'Business Name'}
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
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {business.businessAddress?.city || 'City not specified'}, {business.businessAddress?.state || 'State not specified'}
            </Text>
          </View>
          
          {business.businessContact && (
            <View style={styles.detailRow}>
              <Ionicons name="call" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{business.businessContact}</Text>
            </View>
          )}
          
          {business.averageRating > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.detailText}>
                {business.averageRating.toFixed(1)} ({business.totalReviews} reviews)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.businessActions}>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to business details
              Alert.alert('Coming Soon', 'Business details will be available soon!');
            }}
          >
            View Details
          </Button>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to contact
              Alert.alert('Coming Soon', 'Contact functionality will be available soon!');
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
