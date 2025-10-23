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
  Linking,
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
  const [activeTab, setActiveTab] = useState('Info');

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
        console.log('✅ Vendor data:', response.data.vendor);
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
            Linking.openURL(`tel:${vendor.businessContact}`);
          }}
        ]
      );
    } else {
      Alert.alert('No Contact', 'Contact information not available for this vendor.');
    }
  };

  const handleEmailVendor = () => {
    if (vendor?.businessEmail) {
      Linking.openURL(`mailto:${vendor.businessEmail}`);
    } else {
      Alert.alert('No Email', 'Email information not available for this vendor.');
    }
  };

  const handleOpenLocation = () => {
    if (vendor?.businessAddress) {
      const address = vendor.businessAddress.street && vendor.businessAddress.city 
        ? `${vendor.businessAddress.street}, ${vendor.businessAddress.city}`
        : vendor.businessAddress.city || 'Deoria';
      
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
      Linking.openURL(mapsUrl).catch(() => {
        Alert.alert('Error', 'Could not open maps application');
      });
    } else {
      Alert.alert('No Address', 'Address information not available for this vendor.');
    }
  };

  const handleOpenWebsite = () => {
    if (vendor?.website) {
      Linking.openURL(vendor.website);
    } else {
      Alert.alert('No Website', 'Website not available for this vendor.');
    }
  };

  const handleViewReviews = () => {
    Alert.alert('Reviews', 'Reviews feature will be implemented here');
  };

  const handleOpenQueries = () => {
    Alert.alert('Queries', 'Queries feature will be implemented here');
  };

  const handleShareVendor = () => {
    Alert.alert('Share', 'Share feature will be implemented here');
  };

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'Posts') {
      // Posts tab content will be rendered by renderVendorPosts()
    } else if (tabName === 'Marketplace') {
      // Navigate to MyStore screen for this vendor
      navigation.navigate('MyStore', {
        vendorId: vendorId,
        vendorName: getVendorDisplayName(),
        vendor: vendor
      });
    } else if (tabName === 'Reviews') {
      // This will be handled by the reviews component
    }
  };

  const handleSocialMedia = (platform) => {
    const socialUrls = {
      whatsapp: `https://wa.me/${vendor?.businessContact || '1234567890'}`,
      facebook: `https://facebook.com/${vendor?.socialMedia?.facebook || ''}`,
      instagram: `https://instagram.com/${vendor?.socialMedia?.instagram || ''}`,
      linkedin: `https://linkedin.com/in/${vendor?.socialMedia?.linkedin || ''}`,
    };
    
    if (socialUrls[platform]) {
      Linking.openURL(socialUrls[platform]).catch(() => {
        Alert.alert('Error', `Could not open ${platform}`);
      });
    } else {
      Alert.alert('Not Available', `${platform} link not available for this vendor`);
    }
  };

  const getVendorDisplayName = () => {
    const name = vendor?.shopName || vendor?.storeName || vendor?.name || vendorName || 'Vendor Store';
    return name;
  };

  const getVendorDisplayNameShort = () => {
    const name = vendor?.shopName || vendor?.storeName || vendor?.name || vendorName || 'Vendor Store';
    // Truncate very long names for header display
    return name.length > 20 ? name.substring(0, 20) + '...' : name;
  };

  const getVendorCategory = () => {
    return vendor?.businessCategory || 'Business';
  };

  const getVendorRating = () => {
    // Return actual rating or generate a random one for demo
    if (vendor?.averageRating) {
      return vendor.averageRating.toFixed(1);
    }
    // Generate random rating between 3.5 and 5.0 for demo
    return (Math.random() * 1.5 + 3.5).toFixed(1);
  };

  const getVendorBannerImage = () => {
    // Different banner images based on business category
    const bannerImages = {
      'Electronics': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Beauty & Personal Care': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Home & Furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Grocery & Essentials': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Automobile': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Medical & Healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Education & Training': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'Real Estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    };
    return bannerImages[getVendorCategory()] || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  };

  const getVendorProfileImage = () => {
    // Different profile images based on business category
    const profileImages = {
      'Electronics': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Fashion': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Restaurants': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Beauty & Personal Care': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Home & Furniture': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Grocery & Essentials': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Automobile': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Medical & Healthcare': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Education & Training': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      'Real Estate': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    };
    return profileImages[getVendorCategory()] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
  };

  const formatAddress = () => {
    if (!vendor?.businessAddress) {
      return 'No address provided';
    }

    const { street, city, state, pincode } = vendor.businessAddress;
    const addressParts = [];
    
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (pincode) addressParts.push(pincode);

    return addressParts.join(', ') || 'No address provided';
  };

  const renderVendorPosts = () => {
    const businessPosts = vendor?.businessPosts || [];
    
    if (businessPosts.length === 0) {
      return (
        <View style={styles.postsContainer}>
          <View style={styles.emptyStateContainer}>
            <Ionicons name="images-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
            <Text style={styles.emptyStateText}>
              This vendor hasn't shared any posts yet. Check back later for updates!
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.postsContainer}>
        <View style={styles.postsHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="images" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.postsTitle}>Business Posts</Text>
          <Text style={styles.postsCount}>({businessPosts.length})</Text>
        </View>
        
        <View style={styles.postsGrid}>
          {businessPosts.map((postUrl, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.postItem}
              activeOpacity={0.8}
              onPress={() => {
                // You can add image preview functionality here
                Alert.alert('Post', `Viewing post ${index + 1}`);
              }}
            >
              <Image 
                source={{ uri: postUrl }} 
                style={styles.postImage}
                resizeMode="cover"
                onError={() => {
                  console.log('Error loading post image:', postUrl);
                }}
              />
              <View style={styles.postOverlay}>
                <Ionicons name="eye" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDemoReviews = () => {
    const demoReviews = [
      {
        id: 1,
        customerName: 'John Doe',
        rating: 5,
        date: '2024-01-15',
        comment: 'Excellent service! Very professional and delivered on time. Highly recommended.',
        avatar: 'JD'
      },
      {
        id: 2,
        customerName: 'Sarah Wilson',
        rating: 4,
        date: '2024-01-10',
        comment: 'Good quality products and fast delivery. Will definitely order again.',
        avatar: 'SW'
      },
      {
        id: 3,
        customerName: 'Mike Johnson',
        rating: 5,
        date: '2024-01-08',
        comment: 'Outstanding customer service and great products. Very satisfied!',
        avatar: 'MJ'
      },
      {
        id: 4,
        customerName: 'Emily Brown',
        rating: 4,
        date: '2024-01-05',
        comment: 'Good experience overall. Products were as described.',
        avatar: 'EB'
      }
    ];

    return (
      <View style={styles.reviewsContainer}>
        <View style={styles.reviewsHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="star" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.reviewsTitle}>Customer Reviews</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {demoReviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{review.avatar}</Text>
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewCustomerName}>{review.customerName}</Text>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, index) => (
                      <Ionicons
                        key={index}
                        name={index < review.rating ? "star" : "star-outline"}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
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

  console.log('🎯 VendorStoreScreen rendering with vendor:', vendor);
  
  return (
    <View style={styles.container}>
      {/* Premium Header Design */}
      <View style={styles.headerContainer}>
        {/* Status Bar Spacer */}
        <View style={styles.statusBarSpacer} />
        
        {/* Top Navigation Bar */}
        <View style={styles.topNavigationBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleShareVendor}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => Alert.alert('More', 'More options coming soon')}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main Header Content */}
        <View style={styles.mainHeaderContent}>
          <View style={styles.vendorProfileSection}>
            <View style={styles.vendorLogoContainer}>
              {vendor?.businessProfilePic ? (
                <Image 
                  source={{ uri: vendor.businessProfilePic }} 
                  style={styles.vendorLogo}
                />
              ) : (
                // Demo profile image per vendor (varies by category for now)
                <Image 
                  source={{ uri: getVendorProfileImage() }} 
                  style={styles.vendorLogo}
                />
              )}
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.vendorDetails}>
              <Text style={styles.vendorTitle} numberOfLines={2}>
                {getVendorDisplayName()}
              </Text>
              
              <View style={styles.ratingAndStatusContainer}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>Rating : {getVendorRating()}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.contactNowButton}
            activeOpacity={0.8}
            onPress={handleCallVendor}
          >
            <Ionicons name="call" size={16} color="#FFFFFF" style={styles.contactButtonIcon} />
            <Text style={styles.contactNowText}>Contact Now</Text>
          </TouchableOpacity>
        </View>
        
        {/* Location and Quick Info */}
        <View style={styles.locationAndInfoContainer}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={2}>
              {formatAddress()}
            </Text>
          </View>
          
          <View style={styles.quickInfoContainer}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.quickInfoText}>24/7</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.quickInfoText}>Verified</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Contact Action Bar */}
      <View style={styles.contactActionsContainer}>
        <TouchableOpacity 
          style={styles.contactActionButton} 
          onPress={handleCallVendor}
          activeOpacity={0.7}
        >
          <View style={styles.contactActionIconContainer}>
            <Ionicons name="call" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.contactActionLabel}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactActionButton} 
          onPress={() => handleSocialMedia('whatsapp')}
          activeOpacity={0.7}
        >
          <View style={styles.contactActionIconContainer}>
            <Ionicons name="logo-whatsapp" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.contactActionLabel}>Whatsapp</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactActionButton} 
          onPress={handleOpenLocation}
          activeOpacity={0.7}
        >
          <View style={styles.contactActionIconContainer}>
            <Ionicons name="location" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.contactActionLabel}>Location</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactActionButton} 
          onPress={handleShareVendor}
          activeOpacity={0.7}
        >
          <View style={styles.contactActionIconContainer}>
            <Ionicons name="share" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.contactActionLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Navigation Tabs */}
      <View style={styles.navigationTabs}>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'Info' && styles.activeNavTab]}
          activeOpacity={0.7}
          onPress={() => handleTabPress('Info')}
        >
          <Text style={[styles.navTabText, activeTab === 'Info' && styles.activeNavTabText]}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'Posts' && styles.activeNavTab]}
          activeOpacity={0.7}
          onPress={() => handleTabPress('Posts')}
        >
          <Text style={[styles.navTabText, activeTab === 'Posts' && styles.activeNavTabText]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'Marketplace' && styles.activeNavTab]}
          activeOpacity={0.7}
          onPress={() => handleTabPress('Marketplace')}
        >
          <Text style={[styles.navTabText, activeTab === 'Marketplace' && styles.activeNavTabText]}>Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'Reviews' && styles.activeNavTab]}
          activeOpacity={0.7}
          onPress={() => handleTabPress('Reviews')}
        >
          <Text style={[styles.navTabText, activeTab === 'Reviews' && styles.activeNavTabText]}>Reviews</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content Based on Active Tab */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Info' && (
          <>
            {/* Enhanced Business Information */}
            <View style={styles.businessInfoCard}>
              <View style={styles.businessInfoHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="business" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.businessInfoTitle}>Business Information</Text>
              </View>
              <View style={styles.businessInfoContent}>
                <TouchableOpacity style={styles.businessInfoRow} activeOpacity={0.7}>
                  <View style={styles.businessInfoIconContainer}>
                    <Ionicons name="mail" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.businessInfoValue}>{vendor.businessEmail || 'No email provided'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.businessInfoRow} activeOpacity={0.7}>
                  <View style={styles.businessInfoIconContainer}>
                    <Ionicons name="call" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.businessInfoValue}>{vendor.businessContact || 'No contact provided'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.businessInfoRow} activeOpacity={0.7}>
                  <View style={styles.businessInfoIconContainer}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.businessInfoValue}>{formatAddress()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.businessInfoRow} activeOpacity={0.7}>
                  <View style={styles.businessInfoIconContainer}>
                    <Ionicons name="document-text" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.businessInfoValue}>{vendor.aboutBusiness || 'No description provided.'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Enhanced Vendor Products Section */}
            {products.length > 0 && (
              <View style={styles.productsCard}>
                <View style={styles.productsHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="grid" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.productsTitle}>Available Products</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.productsScrollContainer}
                  decelerationRate="fast"
                >
                  {products.map((product) => (
                    <TouchableOpacity key={product.id} style={styles.productItem} activeOpacity={0.8}>
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="image" size={24} color="#6B7280" />
                      </View>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription}>{product.description}</Text>
                      <Text style={styles.productPrice}>₹{product.price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {activeTab === 'Posts' && renderVendorPosts()}

        {activeTab === 'Marketplace' && (
          <View style={styles.marketplaceContainer}>
            <View style={styles.emptyStateContainer}>
              <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>Marketplace Coming Soon</Text>
              <Text style={styles.emptyStateText}>
                The marketplace feature will be available soon. You'll be able to browse and purchase products directly from vendors.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'Reviews' && renderDemoReviews()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
  // Premium Header Styles
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBarSpacer: {
    height: 44, // Status bar height
  },
  topNavigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  vendorProfileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vendorLogoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  vendorLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vendorLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vendorLogoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  vendorDetails: {
    flex: 1,
    paddingTop: 4,
    minHeight: 60,
    justifyContent: 'center',
  },
  vendorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Inter',
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  vendorSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  ratingAndStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  contactNowButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: 12,
  },
  contactButtonIcon: {
    marginRight: 6,
  },
  contactNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationAndInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 16,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  quickInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  quickInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Enhanced Contact Action Bar
  contactActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  contactActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactActionLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Navigation Tabs
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeNavTab: {
    borderBottomColor: '#8B5CF6',
  },
  navTabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeNavTabText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  // Content Styles
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  businessInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  businessInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  businessInfoContent: {
    gap: 16,
  },
  businessInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    fontWeight: '500',
  },
  socialLinksCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  socialLinksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  socialLinksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  socialLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  socialLink: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentPostsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentPostsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recentPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPostsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  productsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  productsScrollContainer: {
    paddingRight: 20,
  },
  productItem: {
    width: 150,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  // Reviews Styles
  reviewsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Marketplace Styles
  marketplaceContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Posts Styles
  postsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  postsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  postItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
});

export default VendorStoreScreen;