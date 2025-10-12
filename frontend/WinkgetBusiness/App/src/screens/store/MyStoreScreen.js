import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Badge,
  Surface,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
// Use the vendor-specific endpoint so we fetch all products for a vendorRef
const API_BASE_URL = "http://192.168.1.4:5000/api/business/products/vendor";
// This should be the vendorRef id (not a product id)
const VENDOR_ID = "68e7999efd643432376e3214";

// Responsive breakpoints
const isTablet = width >= 768;
const isSmallScreen = width < 375;
const cardWidth = isTablet ? (width - 80) / 3 : (width - 60) / 2;

const MyStoreScreen = () => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching products from:", `${API_BASE_URL}/${VENDOR_ID}`);

      const response = await fetch(`${API_BASE_URL}/${VENDOR_ID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `HTTP ${response.status}: ${
            errorData.message || "Failed to fetch products"
          }`
        );
      }

      const data = await response.json();
      console.log("Fetched products (raw):", data);

      if (!data) {
        throw new Error("No data received from server");
      }

      // Support multiple response shapes:
      // - { products: [...], pagination: {...} }
      // - [...] (array of products)
      // - single product object
      let productsArray = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (Array.isArray(data.result)) {
        productsArray = data.result;
      } else if (data.data && Array.isArray(data.data.products)) {
        productsArray = data.data.products;
      } else {
        // fallback: wrap single product object
        productsArray = [data];
      }

      console.log("Parsed products array:", productsArray.length);
      setProducts(productsArray);

      // Extract featured products from relatedProducts if available
      const featured = productsArray.find(
        (product) =>
          product.relatedProducts && product.relatedProducts.length > 0
      );
      if (featured && featured.relatedProducts) {
        setFeaturedProducts(featured.relatedProducts);
      } else {
        // Fallback to first 3 products if no relatedProducts found
        setFeaturedProducts(productsArray.slice(0, 3));
      }

      // Calculate stats
      const totalProducts = productsArray.length;
      const totalOrders = productsArray.reduce(
        (sum, product) => sum + (product.sold || 0),
        0
      );
      const totalRevenue = productsArray.reduce(
        (sum, product) => sum + (product.sold || 0) * (product.price || 0),
        0
      );

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
      });
    } catch (err) {
      console.error("Error fetching products:", err);

      let errorMessage = "Network error. Please check your connection.";

      if (err.message.includes("Network request failed")) {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running on port 5000.";
      } else if (err.message.includes("404")) {
        errorMessage = "Products not found. Please check the vendor ID.";
      } else if (err.message.includes("500")) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString() || "0"}`;
  };

  const renderImageCarousel = (product) => {
    const images = product.images || [product.image].filter(Boolean);

    if (images.length === 0) {
      return (
        <View style={styles.productImageContainer}>
          <View style={styles.noImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        </View>
      );
    }

    if (images.length === 1) {
      return (
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    return (
      <View style={styles.productImageContainer}>
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / cardWidth
            );
            setCurrentImageIndex(index);
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
        <View style={styles.imageIndicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    currentImageIndex === index
                      ? "#10B981"
                      : "rgba(255, 255, 255, 0.5)",
                },
              ]}
            />
          ))}
        </View>

        {/* Image Counter */}
        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>
            {currentImageIndex + 1}/{images.length}
          </Text>
        </View>
      </View>
    );
  };

  const getRelatedProducts = (currentProduct) => {
    return products
      .filter(
        (product) =>
          product._id !== currentProduct._id &&
          product.category === currentProduct.category
      )
      .slice(0, 4);
  };

  const renderProductCard = ({ item: product, index }) => {
    const relatedProducts = getRelatedProducts(product);

    return (
      <View key={product._id} style={styles.productCardWrapper}>
        <Surface
          style={[
            styles.productCard,
            { width: cardWidth },
            {
              marginRight:
                index % (isTablet ? 3 : 2) === (isTablet ? 2 : 1) ? 0 : 12,
            },
          ]}
          elevation={3}
        >
          <TouchableOpacity
            style={styles.productTouchable}
            activeOpacity={0.8}
            onPress={() => {
              console.log("Product pressed:", product.title);
            }}
          >
            {renderImageCarousel(product)}

            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title || product.name}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {product.averageRating?.toFixed(1) || "0.0"}
                  </Text>
                </View>
              </View>

              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description}
              </Text>

              <View style={styles.priceContainer}>
                <Text style={styles.currentPrice}>
                  {formatPrice(product.price)}
                </Text>
                {product.maxSellingPrice &&
                  product.maxSellingPrice > product.price && (
                    <Text style={styles.originalPrice}>
                      {formatPrice(product.maxSellingPrice)}
                    </Text>
                  )}
              </View>

              <View style={styles.stockContainer}>
                <View style={styles.stockItem}>
                  <Ionicons name="cube-outline" size={12} color="#10B981" />
                  <Text style={styles.stockText}>
                    {product.stock || product.units || 0} in stock
                  </Text>
                </View>
                <View style={styles.stockItem}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
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
              </View>
            </View>
          </TouchableOpacity>
        </Surface>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedProductsSection}>
            <Text style={styles.relatedProductsTitle}>Related Products</Text>
            <FlatList
              data={relatedProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: relatedProduct }) => (
                <TouchableOpacity
                  style={styles.relatedProductCard}
                  onPress={() =>
                    console.log(
                      "Related product pressed:",
                      relatedProduct.title
                    )
                  }
                >
                  <Image
                    source={{
                      uri: relatedProduct.image || relatedProduct.images?.[0],
                    }}
                    style={styles.relatedProductImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.relatedProductTitle} numberOfLines={1}>
                    {relatedProduct.title || relatedProduct.name}
                  </Text>
                  <Text style={styles.relatedProductPrice}>
                    {formatPrice(relatedProduct.price)}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={fetchProducts}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#10B981", "#059669"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.storeIconContainer}>
              <Ionicons
                name="storefront"
                size={isTablet ? 56 : 48}
                color="white"
              />
            </View>
            <Title style={styles.title}>
              {products.length > 0
                ? products[0]?.vendorRef?.shopName
                : "My Store"}
            </Title>
            <Text style={styles.subtitle}>See latest products</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.length > 0 ? (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Products</Text>
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="filter" size={16} color="#10B981" />
                <Text style={styles.filterText}>Filter</Text>
              </TouchableOpacity>
            </View>

            {/* All Products Grid */}
            <View style={styles.allProductsSection}>
              <View style={styles.productsGrid}>
                {products.map((product, index) => (
                  <View
                    key={product._id}
                    style={[
                      styles.productCard,
                      { width: cardWidth },
                      {
                        marginRight:
                          index % (isTablet ? 3 : 2) === (isTablet ? 2 : 1)
                            ? 0
                            : 12,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.productTouchable}
                      activeOpacity={0.8}
                      onPress={() =>
                        console.log("Product pressed:", product.title)
                      }
                    >
                      {renderImageCarousel(product)}

                      <View style={styles.productContent}>
                        <View style={styles.productHeader}>
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {product.title || product.name}
                          </Text>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.ratingText}>
                              {product.averageRating?.toFixed(1) || "0.0"}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={styles.productDescription}
                          numberOfLines={2}
                        >
                          {product.description}
                        </Text>

                        <View style={styles.priceContainer}>
                          <Text style={styles.currentPrice}>
                            {formatPrice(product.price)}
                          </Text>
                          {product.maxSellingPrice &&
                            product.maxSellingPrice > product.price && (
                              <Text style={styles.originalPrice}>
                                {formatPrice(product.maxSellingPrice)}
                              </Text>
                            )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            {/* Featured Products Carousel */}
            {featuredProducts.length > 0 && (
              <View style={styles.featuredSection}>
                <Text style={styles.featuredTitle}>Featured Products</Text>
                <FlatList
                  data={featuredProducts}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item: product, index }) => (
                    <TouchableOpacity
                      style={[styles.featuredCard, { width: width * 0.8 }]}
                      onPress={() =>
                        console.log("Featured product pressed:", product.title)
                      }
                    >
                      <View style={styles.featuredImageContainer}>
                        <Image
                          source={{ uri: product.images?.[0] || product.image }}
                          style={styles.featuredImage}
                          resizeMode="cover"
                        />
                        {product.averageRating > 0 && (
                          <View style={styles.featuredRating}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.featuredRatingText}>
                              {product.averageRating?.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.featuredContent}>
                        <Text
                          style={styles.featuredProductTitle}
                          numberOfLines={2}
                        >
                          {product.title || product.name}
                        </Text>
                        <Text style={styles.featuredProductPrice}>
                          {formatPrice(product.price)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => `featured-${item._id}`}
                  contentContainerStyle={styles.featuredList}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyStateTitle}>No Products Yet</Text>
              <Text style={styles.emptyStateDescription}>
                Start building your store by adding your first product
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: "center",
  },
  storeIconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: isTablet ? 16 : 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  productsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  productsGrid: {
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  row: {
    justifyContent: "space-between",
  },
  // Featured Products Section
  featuredSection: {
    marginBottom: 24,
  },
  featuredTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  featuredList: {
    paddingRight: 20,
  },
  featuredCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  featuredImageContainer: {
    position: "relative",
    height: 200,
    backgroundColor: "#F3F4F6",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredRating: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredRatingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  featuredContent: {
    padding: 16,
  },
  featuredProductTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    lineHeight: isTablet ? 24 : 20,
  },
  featuredProductPrice: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
    color: "#10B981",
  },
  allProductsSection: {
    marginBottom: 24,
  },
  allProductsTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  // Product Card Styles
  productCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // ensure consistent width via inline style using cardWidth
  },
  productCardWrapper: {
    marginBottom: 24,
  },
  productTouchable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  productImageContainer: {
    position: "relative",
    height: isTablet ? 160 : 140,
    backgroundColor: "#F3F4F6",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  noImageText: {
    marginTop: 8,
    fontSize: 12,
    color: "#9CA3AF",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  imageCounter: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  outOfStockText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  recommendedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  quickViewButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  productContent: {
    padding: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
    lineHeight: isTablet ? 22 : 18,
  },
  productDescription: {
    fontSize: isTablet ? 14 : 12,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: isTablet ? 20 : 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#10B981",
  },
  originalPrice: {
    fontSize: isTablet ? 14 : 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  stockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockText: {
    fontSize: isTablet ? 13 : 11,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  soldText: {
    fontSize: isTablet ? 13 : 11,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryChip: {
    height: isTablet ? 28 : 24,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#F3F4F6",
  },
  categoryChipText: {
    fontSize: isTablet ? 12 : 10,
    color: "#6B7280",
  },
  subcategoryChip: {
    height: isTablet ? 28 : 24,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#E5E7EB",
  },
  subcategoryChipText: {
    fontSize: isTablet ? 12 : 10,
    color: "#374151",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: isTablet ? 13 : 11,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: isTablet ? 18 : 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: isTablet ? 26 : 24,
  },
  // Related Products Styles
  relatedProductsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  relatedProductsTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  relatedProductCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relatedProductImage: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  relatedProductTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 6,
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10B981",
  },
});

export default MyStoreScreen;
