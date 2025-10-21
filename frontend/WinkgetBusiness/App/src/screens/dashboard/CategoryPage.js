import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FadeInView, FadeInUpView } from './components/animations';

const CategoryPage = ({ navigation }) => {
  // Previous categories first, then additional categories (same as CategoryGrid)
  const previousCategories = [
    {
      name: 'Electronics',
      icon: 'mobile-alt',
      color: '#06B6D4',
      description: 'Smartphones, laptops, gadgets and more',
      count: 36,
    },
    {
      name: 'Fashion',
      icon: 'tshirt',
      color: '#EC4899',
      description: 'Clothing, accessories, and style items',
      count: 28,
    },
    {
      name: 'Home & Furniture',
      icon: 'home',
      color: '#10B981',
      description: 'Furniture, decor, and home essentials',
      count: 31,
    },
    {
      name: 'Beauty & Personal Care',
      icon: 'spa',
      color: '#F59E0B',
      description: 'Skincare, makeup, and personal care',
      count: 25,
    },
    {
      name: 'Grocery & Essentials',
      icon: 'shopping-basket',
      color: '#10B981',
      description: 'Food, groceries, and daily essentials',
      count: 42,
    },
  ];

  const additionalCategories = [
    {
      name: 'Contractor',
      icon: 'tools',
      color: '#3B82F6',
      description: 'Construction, renovation, and repair services',
      count: 24,
    },
    {
      name: 'Placement Service',
      icon: 'user-tie',
      color: '#8B5CF6',
      description: 'Job placement and recruitment services',
      count: 18,
    },
    {
      name: 'Event Organisers',
      icon: 'calendar-alt',
      color: '#F59E0B',
      description: 'Wedding, party, and event planning services',
      count: 32,
    },
    {
      name: 'Restaurants',
      icon: 'utensils',
      color: '#EF4444',
      description: 'Food delivery, dining, and catering services',
      count: 45,
    },
    {
      name: 'Real Estate',
      icon: 'home',
      color: '#10B981',
      description: 'Property buying, selling, and rental services',
      count: 28,
    },
    {
      name: 'Home Decor',
      icon: 'couch',
      color: '#F97316',
      description: 'Interior design and home decoration services',
      count: 21,
    },
    {
      name: 'Automobile',
      icon: 'car',
      color: '#6366F1',
      description: 'Car sales, service, and maintenance',
      count: 35,
    },
    {
      name: 'Software & Website',
      icon: 'laptop-code',
      color: '#06B6D4',
      description: 'Web development and software solutions',
      count: 29,
    },
    {
      name: 'Tour & Travels',
      icon: 'suitcase-rolling',
      color: '#84CC16',
      description: 'Travel planning and tour services',
      count: 16,
    },
    {
      name: 'Hotel',
      icon: 'hotel',
      color: '#EC4899',
      description: 'Accommodation and hospitality services',
      count: 22,
    },
    {
      name: 'Packers & Movers',
      icon: 'truck-moving',
      color: '#6B7280',
      description: 'Moving and relocation services',
      count: 19,
    },
    {
      name: 'Electricians',
      icon: 'bolt',
      color: '#F59E0B',
      description: 'Electrical installation and repair services',
      count: 31,
    },
    {
      name: 'Plumbers',
      icon: 'water',
      color: '#3B82F6',
      description: 'Plumbing installation and repair services',
      count: 26,
    },
    {
      name: 'Education & Training',
      icon: 'chalkboard-teacher',
      color: '#8B5CF6',
      description: 'Educational courses and training programs',
      count: 33,
    },
    {
      name: 'Beauty & Wellness',
      icon: 'spa',
      color: '#EC4899',
      description: 'Spa, salon, and wellness services',
      count: 27,
    },
    {
      name: 'Medical & Healthcare',
      icon: 'stethoscope',
      color: '#EF4444',
      description: 'Healthcare and medical services',
      count: 38,
    },
    {
      name: 'Pet Services',
      icon: 'paw',
      color: '#F59E0B',
      description: 'Pet care, grooming, and veterinary services',
      count: 14,
    },
    {
      name: 'Photography',
      icon: 'camera-retro',
      color: '#6366F1',
      description: 'Photography and videography services',
      count: 20,
    },
  ];

  const categories = [...previousCategories, ...additionalCategories];

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryBusinessList', { category: category.name });
  };

  const renderCategoryCard = (category, index) => (
    <FadeInUpView delay={index * 100} key={category.name}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFF']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              <Icon name={category.icon} size={24} color={category.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              <Text style={styles.businessCount}>{category.count} businesses</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#6B7280" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </FadeInUpView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#007BFF', '#EAF3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSubtitle}>Explore all {categories.length} business categories</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <FadeInView>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
        </FadeInView>
        
        <View style={styles.categoriesList}>
          {categories.map((category, index) => renderCategoryCard(category, index))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  categoriesList: {
    gap: 16,
  },
  categoryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  businessCount: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

export default CategoryPage;
