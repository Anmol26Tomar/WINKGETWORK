import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { businessColors } from '../../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { getBusinesses, businesses, isLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    await getBusinesses();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses();
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

  const renderBusinessCard = ({ item: business }) => {
    const colors = getBusinessColor(business.category);
    
    return (
      <TouchableOpacity
        style={styles.businessCard}
        onPress={() => navigation.navigate('BusinessDetail', { business })}
      >
        <Card style={styles.card}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.businessInfo}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={getBusinessIcon(business.category)} 
                    size={32} 
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
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Winkget Business</Text>
      <Text style={styles.headerSubtitle}>Choose your business</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyText}>No businesses available</Text>
      <Text style={styles.emptySubtext}>Check back later for updates</Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading businesses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={businesses}
        renderItem={renderBusinessCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  businessCard: {
    marginBottom: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flex: 1,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 20,
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
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});

export default HomeScreen;
