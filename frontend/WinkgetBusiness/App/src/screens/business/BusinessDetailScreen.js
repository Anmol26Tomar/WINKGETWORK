import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBusiness } from '../../context/BusinessContext';
import { businessColors } from '../../theme/theme';
import VendorCard from '../../components/VendorCard';
import ProductCard from '../../components/ProductCard';

const { width } = Dimensions.get('window');

const BusinessDetailScreen = ({ route, navigation }) => {
  const { business } = route.params;
  const { getBusinessBySlug, vendors, products, isLoading } = useBusiness();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    await getBusinessBySlug(business.slug);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinessData();
    setRefreshing(false);
  };

  const getBusinessIcon = (category) => {
    const icons = {
      food_delivery: 'restaurant',
      marketplace: 'storefront',
      finance: 'card',
      express: 'car',
      b2b: 'business',
      b2c: 'people',
      healthcare: 'medical',
      education: 'school',
      entertainment: 'game-controller',
    };
    return icons[category] || 'business';
  };

  const getBusinessColor = (category) => {
    return businessColors[category] || businessColors.food_delivery;
  };

  const renderHeader = () => {
    const colors = getBusinessColor(business.category);
    
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.businessInfo}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getBusinessIcon(business.category)} 
                size={40} 
                color="white" 
              />
            </View>
            <View style={styles.textContainer}>
              <Title style={styles.businessTitle}>{business.name}</Title>
              <Paragraph style={styles.businessDescription}>
                {business.description}
              </Paragraph>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{business.stats?.totalVendors || 0}</Text>
              <Text style={styles.statLabel}>Vendors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{business.stats?.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{business.stats?.averageRating || 0}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'vendors' && styles.activeTab]}
        onPress={() => setActiveTab('vendors')}
      >
        <Text style={[styles.tabText, activeTab === 'vendors' && styles.activeTabText]}>
          Vendors ({vendors.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'products' && styles.activeTab]}
        onPress={() => setActiveTab('products')}
      >
        <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
          Products ({products.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>About {business.name}</Title>
          <Paragraph style={styles.description}>
            {business.description}
          </Paragraph>
          
          {business.features && business.features.length > 0 && (
            <View style={styles.featuresContainer}>
              <Title style={styles.featuresTitle}>Features</Title>
              {business.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureText}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {business.contact && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Contact Information</Title>
            {business.contact.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={20} color="#6B7280" />
                <Text style={styles.contactText}>{business.contact.email}</Text>
              </View>
            )}
            {business.contact.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={20} color="#6B7280" />
                <Text style={styles.contactText}>{business.contact.phone}</Text>
              </View>
            )}
            {business.contact.website && (
              <View style={styles.contactItem}>
                <Ionicons name="globe" size={20} color="#6B7280" />
                <Text style={styles.contactText}>{business.contact.website}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderVendors = () => (
    <View style={styles.contentContainer}>
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor._id}
          vendor={vendor}
          onPress={() => navigation.navigate('VendorDetail', { vendor })}
        />
      ))}
      {vendors.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No vendors available</Text>
        </View>
      )}
    </View>
  );

  const renderProducts = () => (
    <View style={styles.contentContainer}>
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onPress={() => navigation.navigate('ProductDetail', { product })}
        />
      ))}
      {products.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'vendors':
        return renderVendors();
      case 'products':
        return renderProducts();
      default:
        return renderOverview();
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flex: 1,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  businessTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  description: {
    marginTop: 8,
    lineHeight: 22,
  },
  featuresContainer: {
    marginTop: 16,
  },
  featuresTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
});

export default BusinessDetailScreen;
