import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  Alert,
  Share,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  Card,
  Chip,
  Surface,
  Button,
  Divider,
  Badge,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

const { width, height } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { addToCart, isInCart, getCartItem } = useCart();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const images = product.images || [product.image].filter(Boolean);
  const isInCartItem = isInCart(product._id);
  const cartItem = getCartItem(product._id);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString() || "0"}`;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert(
      'Added to Cart',
      `${product.title || product.name} has been added to your cart`,
      [{ text: 'OK' }]
    );
  };

  const handleBuyNow = () => {
    navigation.navigate('Address', { 
      product, 
      quantity 
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing product: ${product.title || product.name} - ${formatPrice(product.price)}`,
        url: product.images?.[0] || product.image,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const renderImageGallery = () => {
    if (images.length === 0) {
      return (
        <View style={styles.imageContainer}>
          <View style={styles.noImagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#9CA3AF" />
            <Text style={styles.noImageText}>No Image Available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.imageGalleryContainer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
          renderItem={({ item, index }) => (
            <Image
              source={{ uri: item }}
              style={styles.productImage}
              resizeMode="cover"
            />
          )}
          keyExtractor={(item, index) => `${product._id}-${index}`}
        />

        {/* Image Indicators */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: selectedImageIndex === index ? '#10B981' : 'rgba(255, 255, 255, 0.5)',
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsFavorited(!isFavorited)}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? "#EF4444" : "white"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProductInfo = () => (
    <Animated.View
      style={[
        styles.productInfo,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.productHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.productTitle}>
            {product.title || product.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {product.averageRating?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.ratingCount}>
              ({product.totalRatings || 0} reviews)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>
          {formatPrice(product.price)}
        </Text>
        {product.maxSellingPrice && product.maxSellingPrice > product.price && (
          <View style={styles.priceDetails}>
            <Text style={styles.originalPrice}>
              {formatPrice(product.maxSellingPrice)}
            </Text>
            <Text style={styles.discountText}>
              {Math.round(((product.maxSellingPrice - product.price) / product.maxSellingPrice) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.stockContainer}>
        <View style={styles.stockItem}>
          <Ionicons name="cube-outline" size={16} color="#10B981" />
          <Text style={styles.stockText}>
            {product.stock || product.units || 0} in stock
          </Text>
        </View>
        <View style={styles.stockItem}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.soldText}>{product.sold || 0} sold</Text>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <Chip
          mode="outlined"
          style={styles.categoryChip}
          textStyle={styles.categoryChipText}
        >
          {product.category}
        </Chip>
        {product.subcategory && (
          <Chip
            mode="outlined"
            style={styles.subcategoryChip}
            textStyle={styles.subcategoryChipText}
          >
            {product.subcategory}
          </Chip>
        )}
        {product.brand && (
          <Chip
            mode="outlined"
            style={styles.brandChip}
            textStyle={styles.brandChipText}
          >
            {product.brand}
          </Chip>
        )}
      </View>
    </Animated.View>
  );

  const renderDescription = () => (
    <Card style={styles.descriptionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>
          {showFullDescription
            ? product.description
            : product.description?.substring(0, 150) + '...'}
        </Text>
        {product.description && product.description.length > 150 && (
          <TouchableOpacity
            onPress={() => setShowFullDescription(!showFullDescription)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {showFullDescription ? 'Read Less' : 'Read More'}
            </Text>
            <Ionicons
              name={showFullDescription ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#10B981"
            />
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );

  const renderSpecifications = () => {
    if (!product.specifications) return null;

    const specs = typeof product.specifications === 'object' 
      ? Object.entries(product.specifications)
      : [];

    if (specs.length === 0) return null;

    return (
      <Card style={styles.specificationsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Specifications</Text>
          {specs.map(([key, value], index) => (
            <View key={index} style={styles.specRow}>
              <Text style={styles.specKey}>{key}:</Text>
              <Text style={styles.specValue}>{String(value)}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderQuantitySelector = () => (
    <Card style={styles.quantityCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? "#9CA3AF" : "#10B981"} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(1)}
          >
            <Ionicons name="add" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.addToCartButton,
          isInCartItem && styles.addToCartButtonActive
        ]}
        onPress={handleAddToCart}
      >
        <Ionicons
          name={isInCartItem ? "checkmark" : "cart-outline"}
          size={20}
          color="white"
        />
        <Text style={styles.addToCartText}>
          {isInCartItem ? 'Added to Cart' : 'Add to Cart'}
        </Text>
        {isInCartItem && cartItem && (
          <Badge style={styles.cartBadge}>{cartItem.quantity}</Badge>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buyNowButton}
        onPress={handleBuyNow}
      >
        <Ionicons name="flash" size={20} color="white" />
        <Text style={styles.buyNowText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderImageGallery()}
        {renderProductInfo()}
        {renderDescription()}
        {renderSpecifications()}
        {renderQuantitySelector()}
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={styles.fixedActions}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 1)']}
          style={styles.actionGradient}
        >
          {renderActionButtons()}
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageGalleryContainer: {
    position: 'relative',
    height: height * 0.4,
    backgroundColor: 'white',
  },
  imageContainer: {
    height: height * 0.4,
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: width,
    height: height * 0.4,
  },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  imageCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  imageActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  productHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 32,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  priceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  soldText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  subcategoryChip: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  subcategoryChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  brandChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  brandChipText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  descriptionCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  specificationsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quantityCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 4,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specKey: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  fixedActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
  actionGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    position: 'relative',
  },
  addToCartButtonActive: {
    backgroundColor: '#059669',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default ProductDetailScreen;