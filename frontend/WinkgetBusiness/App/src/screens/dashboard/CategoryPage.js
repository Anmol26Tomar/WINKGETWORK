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
import { FadeInView, FadeInUpView } from './components/animations';

const CategoryPage = ({ navigation }) => {
  const categories = [
    {
      name: 'Electronics',
      icon: 'phone-portrait',
      color: '#007BFF',
      description: 'Smartphones, laptops, gadgets and more',
    },
    {
      name: 'Fashion',
      icon: 'shirt',
      color: '#E91E63',
      description: 'Clothing, accessories, and style items',
    },
    {
      name: 'Home & Furniture',
      icon: 'home',
      color: '#4CAF50',
      description: 'Furniture, decor, and home essentials',
    },
    {
      name: 'Beauty & Personal Care',
      icon: 'sparkles',
      color: '#FF9800',
      description: 'Skincare, makeup, and personal care',
    },
    {
      name: 'Grocery & Essentials',
      icon: 'basket',
      color: '#9C27B0',
      description: 'Food, groceries, and daily essentials',
    },
  ];

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
              <Ionicons name={category.icon} size={28} color={category.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
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
          <Text style={styles.headerSubtitle}>Explore all business categories</Text>
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
  },
});

export default CategoryPage;
