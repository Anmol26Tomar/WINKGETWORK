import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const CategoryGrid = ({ categories, onPressCategory }) => {
  const [showAll, setShowAll] = useState(false);
  const displayCategories = showAll ? categories : categories.slice(0, 6);

  const toggleView = () => {
    setShowAll(!showAll);
  };

  const getCategoryColor = (categoryName) => {
    const colorMap = {
      'Electronics': '#007BFF',
      'Fashion': '#E91E63',
      'Home & Furniture': '#4CAF50',
      'Beauty & Personal Care': '#FF9800',
      'Grocery & Essentials': '#9C27B0',
      'Automobile': '#FF5722',
      'Real Estate': '#795548',
      'Education': '#3F51B5',
      'Healthcare': '#E91E63',
      'Restaurants': '#FF9800',
    };
    return colorMap[categoryName] || '#007BFF';
  };

  const getCategoryGradient = (categoryName) => {
    const color = getCategoryColor(categoryName);
    return [`${color}20`, '#FFFFFF'];
  };

  const renderCategoryCard = (category, index) => (
    <TouchableOpacity
      key={`${category.name}-${index}`}
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => onPressCategory(category)}
    >
      <LinearGradient 
        colors={getCategoryGradient(category.name)} 
        style={styles.cardInner}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconPill, { backgroundColor: `${getCategoryColor(category.name)}15` }]}>
            <Ionicons 
              name={category.icon} 
              size={28} 
              color={getCategoryColor(category.name)} 
            />
          </View>
          <Text style={[styles.categoryName, { color: getCategoryColor(category.name) }]} numberOfLines={2}>
            {category.name}
          </Text>
          <Text style={styles.categoryCount}>
            {Math.floor(Math.random() * 50) + 10} businesses
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {displayCategories.map((category, index) => renderCategoryCard(category, index))}
        
        {/* View More/Less Button */}
        {categories.length > 6 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={toggleView}
          >
            <LinearGradient colors={["#F8FAFC", "#FFFFFF"]} style={styles.cardInner}>
              <View style={styles.cardContent}>
                <View style={[styles.iconPill, { backgroundColor: '#E5E7EB' }]}>
                  <Ionicons 
                    name={showAll ? "chevron-up" : "grid"} 
                    size={28} 
                    color="#6B7280" 
                  />
                </View>
                <Text style={[styles.categoryName, { color: '#6B7280' }]} numberOfLines={2}>
                  {showAll ? "View Less" : "View All"}
                </Text>
                <Text style={styles.categoryCount}>
                  {showAll ? "Show fewer" : "See all categories"}
                </Text>
              </View>
            </LinearGradient>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    width: '48%',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardInner: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 140,
    position: 'relative',
  },
  iconPill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardText: {
    textAlign: 'center',
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  // Enhanced styles for better visual appeal
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  cardContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  categoryIcon: {
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  categoryCount: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default CategoryGrid;


