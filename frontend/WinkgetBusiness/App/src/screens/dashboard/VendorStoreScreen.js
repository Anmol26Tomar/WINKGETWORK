import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { API_ENDPOINTS } from '../../config/api';

const VendorStoreScreen = ({ route, navigation }) => {
  const { vendorId, vendorName, vendor: initialVendor } = route.params;
  const [vendor, setVendor] = useState(initialVendor);
  const [loading, setLoading] = useState(!initialVendor);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!initialVendor) {
      loadVendorDetails();
    }
    loadVendorProducts();
  }, [vendorId]);

  const loadVendorDetails = async () => {
    try {
      setLoading(true);
      console.log('🏪 Loading vendor details for:', vendorId);
      
      const response = await api.get(`${API_ENDPOINTS.VENDORS.DETAILS}/${vendorId}`);
      if (response.data.success) {
        setVendor(response.data.vendor);
      }
    } catch (error) {
      console.error('❌ Error loading vendor details:', error);
      Alert.alert('Error', 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const loadVendorProducts = async () => {
    try {
      console.log('📦 Loading vendor products...');
      // This would be a separate API endpoint for vendor products
      // For now, we'll use sample data
      const sampleProducts = [
        {
          id: '1',
          name: 'Sample Product 1',
          price: 299,
          image: null,
          description: 'High quality product from this vendor'
        },
        {
          id: '2',
          name: 'Sample Product 2',
          price: 499,
          image: null,
          description: 'Another great product'
        }
      ];
      setProducts(sampleProducts);
    } catch (error) {
      console.error('❌ Error loading products:', error);
    }
  };

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

  const handleCallVendor = () => {
    if (vendor?.businessContact) {
      Alert.alert(
        'Call Vendor',
        `Call ${vendor.shopName || vendorName} at ${vendor.businessContact}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => {
            // In a real app, you would use Linking to make a phone call
            Alert.alert('Call', `Would call ${vendor.businessContact}`);
          }}
        ]
      );
    } else {
      Alert.alert('No Contact', 'Contact information not available for this vendor.');
    }
  };

  const handleMessageVendor = () => {
    Alert.alert('Message', 'Messaging feature would be implemented here');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading vendor store...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Vendor Not Found</Text>
        <Text style={styles.errorText}>The vendor you're looking for doesn't exist.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[getCategoryColor(vendor.category), '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.vendorInfo}>
            <View style={styles.vendorImageContainer}>
              {vendor.businessProfilePic ? (
                <Image 
                  source={{ uri: vendor.businessProfilePic }} 
                  style={styles.vendorImage}
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons 
                    name={getCategoryIcon(vendor.category)} 
                    size={32} 
                    color="#FFFFFF" 
                  />
                </View>
              )}
            </View>
            <Text style={styles.vendorName}>
              {vendor.shopName || vendor.storeName || vendor.name || vendorName}
            </Text>
            <Text style={styles.vendorCategory}>{vendor.category}</Text>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {vendor.averageRating ? vendor.averageRating.toFixed(1) : '4.5'}
              </Text>
              <Text style={styles.reviewCount}>
                ({vendor.totalReviews || 0} reviews)
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCallVendor}>
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleMessageVendor}>
          <Ionicons name="chatbubble" size={20} color="#007BFF" />
          <Text style={styles.secondaryButtonText}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Vendor Details */}
      <View style={styles.content}>
        {vendor.businessAddress && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>📍 Location</Title>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.locationText}>
                  {vendor.businessAddress.street && `${vendor.businessAddress.street}, `}
                  {vendor.businessAddress.city || 'City'}
                  {vendor.businessAddress.state && `, ${vendor.businessAddress.state}`}
                  {vendor.businessAddress.pincode && ` - ${vendor.businessAddress.pincode}`}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {vendor.businessContact && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>📞 Contact</Title>
              <View style={styles.contactContainer}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{vendor.businessContact}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {vendor.aboutBusiness && (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>ℹ️ About</Title>
              <Paragraph style={styles.descriptionText}>{vendor.aboutBusiness}</Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Products Section */}
        <Card style={styles.productsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>🛍️ Products & Services</Title>
            {products.length > 0 ? (
              products.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                  </View>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noProductsText}>No products listed yet.</Text>
            )}
          </Card.Content>
        </Card>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  vendorInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  vendorImageContainer: {
    marginBottom: 16,
  },
  vendorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  vendorCategory: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3FF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007BFF',
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  detailCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  productsCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007BFF',
  },
  noProductsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VendorStoreScreen;
