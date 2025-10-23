import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import {
  Card,
  Chip,
  Surface,
  Button,
  Divider,
  Badge,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";

const { width, height } = Dimensions.get("window");

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
      "Added to Cart",
      `${product.title || product.name} has been added to your cart`,
      [{ text: "OK" }]
    );
  };

  const handleBuyNow = () => {
    navigation.navigate("Address", {
      product,
      quantity,
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing product: ${
          product.title || product.name
        } - ${formatPrice(product.price)}`,
        url: product.images?.[0] || product.image,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const renderImageGallery = () => {
    if (images.length === 0) {
      return (
        <View style={styles.modernImageContainer}>
          <View style={styles.noImagePlaceholder}>
            <View style={styles.noImageIconContainer}>
              <Ionicons name="image-outline" size={60} color="#007BFF" />
            </View>
            <Text style={styles.noImageText}>No Image Available</Text>
            <Text style={styles.noImageSubtext}>Images will appear here</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.modernImageGalleryContainer}>
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
              style={styles.modernProductImage}
              resizeMode="cover"
            />
          )}
          keyExtractor={(item, index) => `${product._id}-${index}`}
        />

        {/* Modern Image Indicators */}
        {images.length > 1 && (
          <View style={styles.modernImageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.modernIndicator,
                  {
                    backgroundColor:
                      selectedImageIndex === index
                        ? "#007BFF"
                        : "rgba(255, 255, 255, 0.6)",
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Modern Image Counter */}
        {images.length > 1 && (
          <View style={styles.modernImageCounter}>
            <Text style={styles.modernImageCounterText}>
              {selectedImageIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {/* Modern Action Buttons */}
        <View style={styles.modernImageActions}>
          <TouchableOpacity
            style={styles.modernActionButton}
            onPress={() => setIsFavorited(!isFavorited)}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={22}
              color={isFavorited ? "#EF4444" : "white"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modernActionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProductInfo = () => (
    <Animated.View
      style={[
        styles.modernProductInfo,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.modernProductHeader}>
        <View style={styles.modernTitleContainer}>
          <Text style={styles.modernProductTitle}>
            {product.title || product.name}
          </Text>
          <View style={styles.modernRatingContainer}>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.modernRatingText}>
                {product.averageRating?.toFixed(1) || "0.0"}
              </Text>
            </View>
            <Text style={styles.modernRatingCount}>
              ({product.totalRatings || 0} reviews)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.modernPriceContainer}>
        <Text style={styles.modernCurrentPrice}>
          {formatPrice(product.price)}
        </Text>
        {product.maxSellingPrice && product.maxSellingPrice > product.price && (
          <View style={styles.modernPriceDetails}>
            <Text style={styles.modernOriginalPrice}>
              {formatPrice(product.maxSellingPrice)}
            </Text>
            <View style={styles.modernDiscountBadge}>
              <Text style={styles.modernDiscountText}>
                {Math.round(
                  ((product.maxSellingPrice - product.price) /
                    product.maxSellingPrice) *
                    100
                )}
                % OFF
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.modernStockContainer}>
        <View style={styles.modernStockItem}>
          <View style={styles.stockIconContainer}>
            <Ionicons name="cube-outline" size={18} color="#007BFF" />
          </View>
          <Text style={styles.modernStockText}>
            {product.stock || product.units || 0} in stock
          </Text>
        </View>
        <View style={styles.modernStockItem}>
          <View style={styles.soldIconContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          </View>
          <Text style={styles.modernSoldText}>{product.sold || 0} sold</Text>
        </View>
      </View>

      <View style={styles.modernCategoryContainer}>
        <Chip
          mode="outlined"
          style={styles.modernCategoryChip}
          textStyle={styles.modernCategoryChipText}
        >
          {product.category}
        </Chip>
        {product.subcategory && (
          <Chip
            mode="outlined"
            style={styles.modernSubcategoryChip}
            textStyle={styles.modernSubcategoryChipText}
          >
            {product.subcategory}
          </Chip>
        )}
        {product.brand && (
          <Chip
            mode="outlined"
            style={styles.modernBrandChip}
            textStyle={styles.modernBrandChipText}
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
            : product.description?.substring(0, 150) + "..."}
        </Text>
        {product.description && product.description.length > 150 && (
          <TouchableOpacity
            onPress={() => setShowFullDescription(!showFullDescription)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {showFullDescription ? "Read Less" : "Read More"}
            </Text>
            <Ionicons
              name={showFullDescription ? "chevron-up" : "chevron-down"}
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

    const specs =
      typeof product.specifications === "object"
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
            <Ionicons
              name="remove"
              size={20}
              color={quantity <= 1 ? "#9CA3AF" : "#10B981"}
            />
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
    <View style={styles.modernActionButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.modernAddToCartButton,
          isInCartItem && styles.modernAddToCartButtonActive,
        ]}
        onPress={handleAddToCart}
      >
        <Ionicons
          name={isInCartItem ? "checkmark" : "cart-outline"}
          size={22}
          color="white"
        />
        <Text style={styles.modernAddToCartText}>
          {isInCartItem ? "Added to Cart" : "Add to Cart"}
        </Text>
        {isInCartItem && cartItem && (
          <View style={styles.modernCartBadge}>
            <Text style={styles.modernCartBadgeText}>{cartItem.quantity}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modernBuyNowButton}
        onPress={handleBuyNow}
      >
        <Ionicons name="flash" size={22} color="white" />
        <Text style={styles.modernBuyNowText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007BFF" />

      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <LinearGradient
          colors={["#007BFF", "#4FC3F7", "#EAF3FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Product Details</Text>
              <Text style={styles.headerSubtitle}>
                Explore this amazing product
              </Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
        <View style={styles.actionContainer}>{renderActionButtons()}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Modern Header
  modernHeader: {
    position: "relative",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Inter",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#F0F9FF",
    opacity: 0.9,
    textAlign: "center",
    fontFamily: "Inter",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // Modern Image Gallery
  modernImageGalleryContainer: {
    position: "relative",
    height: height * 0.45,
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernImageContainer: {
    height: height * 0.45,
    backgroundColor: "#F8FAFC",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernProductImage: {
    width: width - 40,
    height: height * 0.45,
  },
  noImagePlaceholder: {
    alignItems: "center",
  },
  noImageIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noImageText: {
    fontSize: 18,
    color: "#1F2937",
    fontWeight: "600",
    marginBottom: 4,
  },
  noImageSubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  modernImageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  modernIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  modernImageCounter: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modernImageCounterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  modernImageActions: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
  },
  modernActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Modern Product Info
  modernProductInfo: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernProductHeader: {
    marginBottom: 20,
  },
  modernTitleContainer: {
    flex: 1,
  },
  modernProductTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 34,
    marginBottom: 12,
    fontFamily: "Inter",
  },
  modernRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernRatingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 6,
  },
  modernRatingCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  modernPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modernCurrentPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: "#007BFF",
    fontFamily: "Inter",
  },
  modernPriceDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
  },
  modernOriginalPrice: {
    fontSize: 20,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginRight: 12,
    fontWeight: "500",
  },
  modernDiscountBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modernDiscountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  modernStockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 4,
  },
  modernStockItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  modernStockText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  soldIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  modernSoldText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  modernCategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modernCategoryChip: {
    backgroundColor: "#EAF3FF",
    borderColor: "#007BFF",
    borderWidth: 1,
  },
  modernCategoryChipText: {
    fontSize: 13,
    color: "#007BFF",
    fontWeight: "600",
  },
  modernSubcategoryChip: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  modernSubcategoryChipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  modernBrandChip: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 1,
  },
  modernBrandChipText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
  },
  imageGalleryContainer: {
    position: "relative",
    height: height * 0.4,
    backgroundColor: "white",
  },
  imageContainer: {
    height: height * 0.4,
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    width: width,
    height: height * 0.4,
  },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  imageCounter: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  imageActions: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productInfo: {
    backgroundColor: "white",
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
    fontWeight: "bold",
    color: "#1F2937",
    lineHeight: 32,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981",
  },
  priceDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  originalPrice: {
    fontSize: 18,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  soldText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 6,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  categoryChipText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  subcategoryChip: {
    backgroundColor: "#E5E7EB",
    borderColor: "#D1D5DB",
  },
  subcategoryChipText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  brandChip: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
  },
  brandChipText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  descriptionCard: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  specificationsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quantityCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
    marginRight: 4,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  specKey: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
  },
  fixedActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    position: "relative",
  },
  addToCartButtonActive: {
    backgroundColor: "#059669",
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
  },
  buyNowButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  // Modern Action Buttons
  modernActionButtonsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  modernAddToCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    position: "relative",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernAddToCartButtonActive: {
    backgroundColor: "#1D4ED8",
  },
  modernAddToCartText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    marginLeft: 8,
  },
  modernCartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  modernCartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  modernBuyNowButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernBuyNowText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginLeft: 8,
  },
});

export default ProductDetailScreen;
