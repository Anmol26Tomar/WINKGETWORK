import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ProductCard = ({ product, onPress }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color="#F59E0B" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color="#F59E0B" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#D1D5DB" />
      );
    }

    return stars;
  };

  const formatPrice = (price) => {
    return `₹${price.toLocaleString()}`;
  };

  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const discount = calculateDiscount(product.originalPrice, product.price);

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/200x200/CCCCCC/666666?text=No+Image' }}
            style={styles.image}
            resizeMode="cover"
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="white" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        
        <Card.Content style={styles.content}>
          <Title style={styles.productName} numberOfLines={2}>
            {product.name}
          </Title>
          
          {product.vendorId && (
            <Text style={styles.vendorName}>
              by {product.vendorId.storeName || product.vendorId.name}
            </Text>
          )}

          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              {formatPrice(product.price)}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(product.rating?.average || 0)}
            </View>
            <Text style={styles.ratingText}>
              {product.rating?.average?.toFixed(1) || '0.0'} ({product.rating?.count || 0})
            </Text>
          </View>

          {product.category && (
            <Chip style={styles.categoryChip} textStyle={styles.chipText}>
              {product.category}
            </Chip>
          )}

          {product.stock !== undefined && (
            <View style={styles.stockContainer}>
              <Ionicons 
                name={product.stock > 0 ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={product.stock > 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[
                styles.stockText,
                { color: product.stock > 0 ? "#10B981" : "#EF4444" }
              ]}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  vendorName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default ProductCard;
