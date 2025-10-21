import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const CategoryGrid = ({ categories, onPressCategory }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Previous categories first, then enhanced categories
  const previousCategories = [
    { name: 'Electronics', icon: 'mobile-alt', count: 36 },
    { name: 'Fashion', icon: 'tshirt', count: 28 },
    { name: 'Home & Furniture', icon: 'home', count: 31 },
    { name: 'Beauty & Personal Care', icon: 'spa', count: 25 },
    { name: 'Grocery & Essentials', icon: 'shopping-basket', count: 42 },
  ];

  const additionalCategories = [
    { name: 'Contractor', icon: 'tools', count: 24 },
    { name: 'Placement Service', icon: 'user-tie', count: 18 },
    { name: 'Event Organisers', icon: 'calendar-alt', count: 32 },
    { name: 'Restaurants', icon: 'utensils', count: 45 },
    { name: 'Real Estate', icon: 'home', count: 28 },
    { name: 'Home Decor', icon: 'couch', count: 21 },
    { name: 'Automobile', icon: 'car', count: 35 },
    { name: 'Software & Website', icon: 'laptop-code', count: 29 },
    { name: 'Tour & Travels', icon: 'suitcase-rolling', count: 16 },
    { name: 'Hotel', icon: 'hotel', count: 22 },
    { name: 'Packers & Movers', icon: 'truck-moving', count: 19 },
    { name: 'Electricians', icon: 'bolt', count: 31 },
    { name: 'Plumbers', icon: 'water', count: 26 },
    { name: 'Education & Training', icon: 'chalkboard-teacher', count: 33 },
    { name: 'Beauty & Wellness', icon: 'spa', count: 27 },
    { name: 'Medical & Healthcare', icon: 'stethoscope', count: 38 },
    { name: 'Pet Services', icon: 'paw', count: 14 },
    { name: 'Photography', icon: 'camera-retro', count: 20 },
  ];

  const enhancedCategories = [...previousCategories, ...additionalCategories];
  
  const displayCategories = showAll ? enhancedCategories : enhancedCategories.slice(0, 12);

  const toggleView = () => {
    setShowAll(!showAll);
  };

  const getCategoryColor = (categoryName) => {
    const colorMap = {
      // Previous categories
      'Electronics': '#06B6D4',
      'Fashion': '#EC4899',
      'Home & Furniture': '#10B981',
      'Beauty & Personal Care': '#F59E0B',
      'Grocery & Essentials': '#10B981',
      // Additional categories
      'Contractor': '#3B82F6',
      'Placement Service': '#8B5CF6',
      'Event Organisers': '#F59E0B',
      'Restaurants': '#EF4444',
      'Real Estate': '#10B981',
      'Home Decor': '#F97316',
      'Automobile': '#6366F1',
      'Software & Website': '#06B6D4',
      'Tour & Travels': '#84CC16',
      'Hotel': '#EC4899',
      'Packers & Movers': '#6B7280',
      'Electricians': '#F59E0B',
      'Plumbers': '#3B82F6',
      'Education & Training': '#8B5CF6',
      'Beauty & Wellness': '#EC4899',
      'Medical & Healthcare': '#EF4444',
      'Pet Services': '#F59E0B',
      'Photography': '#6366F1',
    };
    return colorMap[categoryName] || '#3B82F6';
  };

  const renderCategoryCard = (category, index) => (
    <TouchableOpacity
      key={`${category.name}-${index}`}
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => onPressCategory(category)}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${getCategoryColor(category.name)}15` }]}>
            <Icon 
              name={category.icon} 
              size={16} 
              color={getCategoryColor(category.name)} 
            />
          </View>
          <Text style={styles.categoryName} numberOfLines={2}>
            {category.name}
          </Text>
          <Text style={styles.categoryCount}>
            {category.count} businesses
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {displayCategories.map((category, index) => renderCategoryCard(category, index))}
        
        {/* View More/Less Button */}
        {enhancedCategories.length > 12 && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.card}
            onPress={toggleView}
          >
            <View style={[styles.cardInner, styles.viewMoreCard]}>
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Icon 
                    name={showAll ? "chevron-up" : "grid"} 
                    size={16} 
                    color="#6B7280" 
                  />
                </View>
                <Text style={[styles.categoryName, styles.viewMoreText]} numberOfLines={2}>
                  {showAll ? "View Less" : "View All"}
                </Text>
                <Text style={styles.categoryCount}>
                  {showAll ? "Show fewer" : "See all categories"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    width: isTablet ? '23%' : '23%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  cardContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 14,
    marginBottom: 2,
  },
  viewMoreText: {
    color: '#6B7280',
  },
  categoryCount: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CategoryGrid;


