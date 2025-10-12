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
  Button,
  Modal,
  StatusBar,
  SafeAreaView,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Badge,
  Surface,
  Searchbar,
  FAB,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { rawCategories } from '../../utils/categories';
import { useCart } from '../../context/CartContext';

const { width, height } = Dimensions.get("window");
// Use the vendor-specific endpoint so we fetch all products for a vendorRef
const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/business/products/vendor` || "http://10.170.131.55:5000/api/business/products/vendor";
// Default vendor ID (fallback)
const DEFAULT_VENDOR_ID = "68e7999efd643432376e3214";

// Responsive breakpoints
const isTablet = width >= 768;
const isSmallScreen = width < 375;
const cardWidth = isTablet ? (width - 80) / 3 : (width - 60) / 2;

const MyStoreScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { vendorId, businessName } = route.params || {};
  const { addToCart, isInCart } = useCart();
  
  // Use the vendorId from navigation params, fallback to default
  const currentVendorId = vendorId || DEFAULT_VENDOR_ID;
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [storeCategory, setStoreCategory] = useState(null);
  
  // Advanced filter states
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [availability, setAvailability] = useState('all');
  const [rating, setRating] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const scrollViewRef = useRef(null);
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      
      console.log("Fetching products from:", `${API_BASE_URL}/${currentVendorId}`);

      const headers = {
        "Content-Type": "application/json",
      };

      // Add Authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/${currentVendorId}`, {
        method: "GET",
        headers,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        }
        
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
      setFilteredProducts(productsArray);

      // Determine store category from first product or business data
      if (productsArray.length > 0) {
        const firstProduct = productsArray[0];
        const productCategory = firstProduct.category || firstProduct.vendorRef?.category;
        if (productCategory) {
          const matchingCategory = rawCategories.find(cat => 
            cat.category.toLowerCase() === productCategory.toLowerCase()
          );
          setStoreCategory(matchingCategory);
        }
      }

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
      } else if (err.message.includes("Authentication required")) {
        errorMessage = "Please log in to view your store products.";
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
  }, [currentVendorId]); // Refetch when vendorId changes

  // Entrance animation
  useEffect(() => {
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

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        product.subcategory?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      filtered = filtered.filter(product =>
        product.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.price || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product =>
        selectedBrands.some(brand => 
          product.brand?.toLowerCase().includes(brand.toLowerCase()) ||
          product.manufacturer?.toLowerCase().includes(brand.toLowerCase())
        )
      );
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter(product =>
        selectedColors.some(color => 
          product.color?.toLowerCase().includes(color.toLowerCase()) ||
          product.colors?.some(c => c.toLowerCase().includes(color.toLowerCase()))
        )
      );
    }

    // Filter by availability
    if (availability === 'inStock') {
      filtered = filtered.filter(product => (product.stock || 0) > 0);
    } else if (availability === 'outOfStock') {
      filtered = filtered.filter(product => (product.stock || 0) === 0);
    }

    // Filter by rating
    if (rating > 0) {
      filtered = filtered.filter(product => 
        (product.averageRating || 0) >= rating
      );
    }

    // Sort products
    filtered = sortProducts(filtered, sortBy);

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, selectedSubcategory, priceRange, selectedBrands, selectedColors, sortBy, availability, rating]);

  const sortProducts = (products, sortType) => {
    const sorted = [...products];
    switch (sortType) {
      case 'price_low_high':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_high_low':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'popularity':
        return sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      default:
        return sorted;
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setPriceRange({ min: 0, max: 100000 });
    setSelectedBrands([]);
    setSelectedColors([]);
    setSortBy('relevance');
    setAvailability('all');
    setRating(0);
  };

  const getAvailableBrands = () => {
    const brands = new Set();
    products.forEach(product => {
      if (product.brand) brands.add(product.brand);
      if (product.manufacturer) brands.add(product.manufacturer);
    });
    return Array.from(brands).sort();
  };

  const getAvailableColors = () => {
    const colors = new Set();
    products.forEach(product => {
      if (product.color) colors.add(product.color);
      if (product.colors) {
        product.colors.forEach(color => colors.add(color));
      }
    });
    return Array.from(colors).sort();
  };

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 50);
    setLastScrollY(scrollY);
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Electronics': 'phone-portrait',
      'Fashion': 'shirt',
      'Home & Furniture': 'home',
      'Beauty & Personal Care': 'sparkles',
      'Grocery & Essentials': 'basket',
    };
    return iconMap[categoryName] || 'cube';
  };

  const getSubcategoryIcon = (subcategoryName) => {
    const iconMap = {
      // Electronics subcategories
      'Mobiles & Tablets': 'phone-portrait',
      'Laptops & Computers': 'laptop',
      'Cameras & Accessories': 'camera',
      'Gaming': 'game-controller',
      'TV & Home Entertainment': 'tv',
      
      // Fashion subcategories
      "Men's Clothing": 'man',
      "Women's Clothing": 'woman',
      'Footwear': 'walk',
      'Accessories': 'watch',
      'Kids Fashion': 'happy',
      
      // Home & Furniture subcategories
      'Furniture': 'bed',
      'Home Decor': 'flower',
      'Kitchen & Dining': 'restaurant',
      'Cleaning & Laundry': 'water',
      'Lighting & Electricals': 'bulb',
      
      // Beauty & Personal Care subcategories
      'Skincare': 'sparkles',
      'Makeup': 'color-palette',
      'Haircare': 'cut',
      'Personal Hygiene': 'medical',
      "Men's Grooming": 'man',
      
      // Grocery & Essentials subcategories
      'Fruits & Vegetables': 'leaf',
      'Dairy & Bakery': 'cafe',
      'Staples': 'basket',
      'Snacks & Beverages': 'pizza',
      'Packaged Foods': 'fast-food',
    };
    return iconMap[subcategoryName] || 'cube';
  };

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
              navigation.navigate('ProductDetail', { product });
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

              {/* Quick Add to Cart Button */}
              <TouchableOpacity
                style={[
                  styles.quickAddButton,
                  isInCart(product._id) && styles.quickAddButtonActive
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
              >
                <Ionicons
                  name={isInCart(product._id) ? "checkmark" : "cart-outline"}
                  size={16}
                  color={isInCart(product._id) ? "white" : "#10B981"}
                />
                <Text style={[
                  styles.quickAddText,
                  isInCart(product._id) && styles.quickAddTextActive
                ]}>
                  {isInCart(product._id) ? 'Added' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
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
          title="Retry"
          onPress={fetchProducts}
          color="#10B981"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <LinearGradient
          colors={["#10B981", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.storeInfo}>
              <View style={styles.storeIconWrapper}>
                <Ionicons
                  name="storefront"
                  size={28}
                  color="white"
                />
              </View>
              <View style={styles.storeTextContainer}>
                <Text style={styles.storeName}>
                  {businessName || 
                   (products.length > 0
                    ? products[0]?.vendorRef?.shopName
                    : "My Store")}
                </Text>
                <Text style={styles.storeCategory}>
                  {storeCategory ? `${storeCategory.category} Store` : "Browse Products"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Sticky Search Bar */}
      <View style={styles.stickySearchContainer}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <Searchbar
              placeholder="Search products..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.modernSearchBar}
              inputStyle={styles.modernSearchInput}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Sticky Category Filter */}
      {storeCategory && (
        <View style={styles.stickyCategoryContainer}>
          <Text style={styles.filterSectionLabel}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
              }}
            >
              <Ionicons 
                name="grid" 
                size={16} 
                color={!selectedCategory ? "white" : "#6B7280"} 
                style={styles.categoryChipIcon}
              />
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            {storeCategory.subcategories.map((subcategory, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryChip,
                  selectedCategory === subcategory.name && styles.categoryChipActive
                ]}
                onPress={() => {
                  setSelectedCategory(subcategory.name);
                  setSelectedSubcategory(null);
                }}
              >
                <Ionicons 
                  name={getSubcategoryIcon(subcategory.name)} 
                  size={16} 
                  color={selectedCategory === subcategory.name ? "white" : "#6B7280"} 
                  style={styles.categoryChipIcon}
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === subcategory.name && styles.categoryChipTextActive
                ]}>
                  {subcategory.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sticky Subcategory Filter - Shows when category is selected */}
      {selectedCategory && storeCategory && (
        <View style={styles.stickySubcategoryContainer}>
          <Text style={styles.filterSectionLabel}>{selectedCategory} Subcategories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.subcategoryChip,
                !selectedSubcategory && styles.subcategoryChipActive
              ]}
              onPress={() => setSelectedSubcategory(null)}
            >
              <Ionicons 
                name="list" 
                size={14} 
                color={!selectedSubcategory ? "white" : "#6B7280"} 
                style={styles.subcategoryChipIcon}
              />
              <Text style={[
                styles.subcategoryChipText,
                !selectedSubcategory && styles.subcategoryChipTextActive
              ]}>
                All {selectedCategory}
              </Text>
            </TouchableOpacity>
            
            {storeCategory.subcategories
              .find(sub => sub.name === selectedCategory)
              ?.secondarySubcategories.map((secondary, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.subcategoryChip,
                    selectedSubcategory === secondary && styles.subcategoryChipActive
                  ]}
                  onPress={() => setSelectedSubcategory(secondary)}
                >
                  <Ionicons 
                    name="ellipse" 
                    size={12} 
                    color={selectedSubcategory === secondary ? "white" : "#6B7280"} 
                    style={styles.subcategoryChipIcon}
                  />
                  <Text style={[
                    styles.subcategoryChipText,
                    selectedSubcategory === secondary && styles.subcategoryChipTextActive
                  ]}>
                    {secondary}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Sticky Sort and Filter Bar */}
      <View style={styles.stickySortFilterContainer}>
        <TouchableOpacity 
          style={styles.modernSortButton}
          onPress={() => setShowAdvancedFilters(true)}
        >
          <View style={styles.sortButtonContent}>
            <Ionicons name="options" size={18} color="#10B981" />
            <Text style={styles.modernSortButtonText}>Sort & Filter</Text>
            <Ionicons name="chevron-down" size={16} color="#10B981" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {filteredProducts.length} of {products.length} products
          </Text>
        </View>
      </View>

      {/* Active Filters */}
      {(searchQuery || selectedCategory || selectedSubcategory || selectedBrands.length > 0 || selectedColors.length > 0 || priceRange.min > 0 || priceRange.max < 100000 || rating > 0) && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery && (
              <Chip
                icon="search"
                onClose={() => setSearchQuery('')}
                style={styles.filterChip}
              >
                "{searchQuery}"
              </Chip>
            )}
            {selectedCategory && (
              <Chip
                icon="folder"
                onClose={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
                style={styles.filterChip}
              >
                {selectedCategory}
              </Chip>
            )}
            {selectedSubcategory && (
              <Chip
                icon="list"
                onClose={() => setSelectedSubcategory(null)}
                style={styles.filterChip}
              >
                {selectedSubcategory}
              </Chip>
            )}
            {selectedBrands.map((brand, index) => (
              <Chip
                key={index}
                icon="business"
                onClose={() => setSelectedBrands(prev => prev.filter(b => b !== brand))}
                style={styles.filterChip}
              >
                {brand}
              </Chip>
            ))}
            {selectedColors.map((color, index) => (
              <Chip
                key={index}
                icon="color-palette"
                onClose={() => setSelectedColors(prev => prev.filter(c => c !== color))}
                style={styles.filterChip}
              >
                {color}
              </Chip>
            ))}
            {(priceRange.min > 0 || priceRange.max < 100000) && (
              <Chip
                icon="cash"
                onClose={() => setPriceRange({ min: 0, max: 100000 })}
                style={styles.filterChip}
              >
                ₹{priceRange.min} - ₹{priceRange.max}
              </Chip>
            )}
            {rating > 0 && (
              <Chip
                icon="star"
                onClose={() => setRating(0)}
                style={styles.filterChip}
              >
                {rating}+ Stars
              </Chip>
            )}
            <TouchableOpacity onPress={clearFilters} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filteredProducts.length > 0 ? (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Products Grid */}
            <Animated.View 
              style={[
                styles.productsGrid,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {filteredProducts.map((product, index) => (
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
                    onPress={() => {
                      navigation.navigate('ProductDetail', { product });
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

                      {/* Quick Add to Cart Button */}
                      <TouchableOpacity
                        style={[
                          styles.quickAddButton,
                          isInCart(product._id) && styles.quickAddButtonActive
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          addToCart(product, 1);
                        }}
                      >
                        <Ionicons
                          name={isInCart(product._id) ? "checkmark" : "cart-outline"}
                          size={16}
                          color={isInCart(product._id) ? "white" : "#10B981"}
                        />
                        <Text style={[
                          styles.quickAddText,
                          isInCart(product._id) && styles.quickAddTextActive
                        ]}>
                          {isInCart(product._id) ? 'Added' : 'Add to Cart'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.View>
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
              <Text style={styles.emptyStateTitle}>
                {searchQuery || selectedCategory || selectedSubcategory 
                  ? "No Products Found" 
                  : "No Products Yet"}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {searchQuery || selectedCategory || selectedSubcategory
                  ? "Try adjusting your search or filters"
                  : "Start building your store by adding your first product"}
              </Text>
              {(searchQuery || selectedCategory || selectedSubcategory) && (
                <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                  <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {storeCategory && (
            <ScrollView style={styles.modalContent}>
              {storeCategory.subcategories.map((subcategory, index) => (
                <View key={index} style={styles.subcategorySection}>
                  <TouchableOpacity
                    style={[
                      styles.subcategoryItem,
                      selectedCategory === subcategory.name && styles.subcategoryItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategory(subcategory.name);
                      setSelectedSubcategory(null);
                    }}
                  >
                    <Ionicons 
                      name={getCategoryIcon(subcategory.name)} 
                      size={20} 
                      color={selectedCategory === subcategory.name ? "#10B981" : "#6B7280"} 
                    />
                    <Text style={[
                      styles.subcategoryName,
                      selectedCategory === subcategory.name && styles.subcategoryNameActive
                    ]}>
                      {subcategory.name}
                    </Text>
                  </TouchableOpacity>
                  
                  {selectedCategory === subcategory.name && (
                    <View style={styles.secondarySubcategories}>
                      {subcategory.secondarySubcategories.map((secondary, secIndex) => (
                        <TouchableOpacity
                          key={secIndex}
                          style={[
                            styles.secondarySubcategoryItem,
                            selectedSubcategory === secondary && styles.secondarySubcategoryItemActive
                          ]}
                          onPress={() => setSelectedSubcategory(secondary)}
                        >
                          <Text style={[
                            styles.secondarySubcategoryName,
                            selectedSubcategory === secondary && styles.secondarySubcategoryNameActive
                          ]}>
                            {secondary}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={clearFilters} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowCategoryModal(false)} 
              style={[styles.modalButton, styles.modalButtonPrimary]}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal
        visible={showAdvancedFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.advancedModalContainer}>
          <View style={styles.advancedModalHeader}>
            <Text style={styles.advancedModalTitle}>Sort & Filter</Text>
            <TouchableOpacity onPress={() => setShowAdvancedFilters(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.advancedModalContent}>
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {[
                { key: 'relevance', label: 'Relevance' },
                { key: 'price_low_high', label: 'Price: Low to High' },
                { key: 'price_high_low', label: 'Price: High to Low' },
                { key: 'rating', label: 'Customer Rating' },
                { key: 'newest', label: 'Newest First' },
                { key: 'popularity', label: 'Most Popular' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive
                  ]}
                  onPress={() => setSortBy(option.key)}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === option.key && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {sortBy === option.key && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <Text style={styles.priceInput}>₹{priceRange.min}</Text>
                </View>
                <Text style={styles.priceSeparator}>to</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <Text style={styles.priceInput}>₹{priceRange.max}</Text>
                </View>
              </View>
              <View style={styles.priceSliderContainer}>
                <Text style={styles.priceSliderText}>
                  ₹{priceRange.min} - ₹{priceRange.max}
                </Text>
              </View>
            </View>

            {/* Brands */}
            {getAvailableBrands().length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Brands</Text>
                <View style={styles.brandContainer}>
                  {getAvailableBrands().map((brand, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.brandChip,
                        selectedBrands.includes(brand) && styles.brandChipActive
                      ]}
                      onPress={() => {
                        if (selectedBrands.includes(brand)) {
                          setSelectedBrands(prev => prev.filter(b => b !== brand));
                        } else {
                          setSelectedBrands(prev => [...prev, brand]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.brandChipText,
                        selectedBrands.includes(brand) && styles.brandChipTextActive
                      ]}>
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Colors */}
            {getAvailableColors().length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Colors</Text>
                <View style={styles.colorContainer}>
                  {getAvailableColors().map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorChip,
                        selectedColors.includes(color) && styles.colorChipActive
                      ]}
                      onPress={() => {
                        if (selectedColors.includes(color)) {
                          setSelectedColors(prev => prev.filter(c => c !== color));
                        } else {
                          setSelectedColors(prev => [...prev, color]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.colorChipText,
                        selectedColors.includes(color) && styles.colorChipTextActive
                      ]}>
                        {color}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Availability */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              {[
                { key: 'all', label: 'All Products' },
                { key: 'inStock', label: 'In Stock Only' },
                { key: 'outOfStock', label: 'Out of Stock' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.availabilityOption,
                    availability === option.key && styles.availabilityOptionActive
                  ]}
                  onPress={() => setAvailability(option.key)}
                >
                  <Text style={[
                    styles.availabilityOptionText,
                    availability === option.key && styles.availabilityOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {availability === option.key && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Customer Rating</Text>
              <View style={styles.ratingContainer}>
                {[4, 3, 2, 1].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={[
                      styles.ratingOption,
                      rating === star && styles.ratingOptionActive
                    ]}
                    onPress={() => setRating(rating === star ? 0 : star)}
                  >
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Ionicons
                          key={i}
                          name={i <= star ? "star" : "star-outline"}
                          size={16}
                          color={i <= star ? "#F59E0B" : "#D1D5DB"}
                        />
                      ))}
                    </View>
                    <Text style={[
                      styles.ratingText,
                      rating === star && styles.ratingTextActive
                    ]}>
                      {star}+ Stars
                    </Text>
                    {rating === star && (
                      <Ionicons name="checkmark" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.advancedModalFooter}>
            <TouchableOpacity onPress={clearFilters} style={styles.advancedModalButton}>
              <Text style={styles.advancedModalButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowAdvancedFilters(false)} 
              style={[styles.advancedModalButton, styles.advancedModalButtonPrimary]}
            >
              <Text style={[styles.advancedModalButtonText, styles.advancedModalButtonTextPrimary]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  // Sticky Header
  stickyHeader: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  storeTextContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  storeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  storeCategory: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  // Modern Search Bar
  modernSearchContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 100,
  },
  modernSearchContainerScrolled: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 0,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  modernSearchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  modernSearchInput: {
    fontSize: 16,
    color: "#374151",
    padding: 0,
    margin: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  // Sticky Search Container
  stickySearchContainer: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  // Sticky Category Container
  stickyCategoryContainer: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 998,
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Sticky Subcategory Container
  stickySubcategoryContainer: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 997,
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Sticky Sort Filter Container
  stickySortFilterContainer: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 996,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Modern Sort and Filter
  modernSortFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modernSortButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernSortButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 8,
    marginRight: 6,
  },
  resultsContainer: {
    alignItems: "flex-end",
  },
  resultsCount: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Search and Filter Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  searchBar: {
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  searchInput: {
    fontSize: 16,
  },
  categoryFilterContainer: {
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterSectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  categoryScroll: {
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipIcon: {
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "white",
    fontWeight: "700",
  },
  activeFiltersContainer: {
    backgroundColor: "white",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterChip: {
    marginRight: 8,
    marginLeft: 16,
  },
  clearAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    marginRight: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subcategorySection: {
    marginBottom: 16,
  },
  subcategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  subcategoryItemActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  subcategoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 12,
  },
  subcategoryNameActive: {
    color: "#10B981",
  },
  secondarySubcategories: {
    marginLeft: 32,
    marginTop: 8,
  },
  secondarySubcategoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    marginBottom: 4,
  },
  secondarySubcategoryItemActive: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  secondarySubcategoryName: {
    fontSize: 14,
    color: "#6B7280",
  },
  secondarySubcategoryNameActive: {
    color: "#10B981",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    marginRight: 8,
  },
  modalButtonPrimary: {
    backgroundColor: "#10B981",
    marginRight: 0,
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  modalButtonTextPrimary: {
    color: "white",
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#10B981",
    borderRadius: 8,
    alignSelf: "center",
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
  // Subcategory Filter Styles
  subcategoryFilterContainer: {
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  subcategoryScroll: {
    paddingRight: 20,
  },
  subcategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 36,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  subcategoryChipIcon: {
    marginRight: 4,
  },
  subcategoryChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  subcategoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  subcategoryChipTextActive: {
    color: "white",
    fontWeight: "700",
  },
  // Sort and Filter Bar
  sortFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sortContainer: {
    flex: 1,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10B981",
    marginLeft: 6,
    marginRight: 4,
  },
  resultsInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  resultsText: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Advanced Modal Styles
  advancedModalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  advancedModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  advancedModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  advancedModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  // Sort Options
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  sortOptionTextActive: {
    color: "#10B981",
    fontWeight: "500",
  },
  // Price Range
  priceRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceInputContainer: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  priceInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  priceSeparator: {
    fontSize: 14,
    color: "#6B7280",
    marginHorizontal: 16,
  },
  priceSliderContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  priceSliderText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  // Brands
  brandContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  brandChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  brandChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  brandChipText: {
    fontSize: 14,
    color: "#6B7280",
  },
  brandChipTextActive: {
    color: "white",
    fontWeight: "500",
  },
  // Colors
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  colorChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  colorChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  colorChipText: {
    fontSize: 14,
    color: "#6B7280",
  },
  colorChipTextActive: {
    color: "white",
    fontWeight: "500",
  },
  // Availability
  availabilityOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  availabilityOptionActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  availabilityOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  availabilityOptionTextActive: {
    color: "#10B981",
    fontWeight: "500",
  },
  // Rating
  ratingContainer: {
    gap: 8,
  },
  ratingOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  ratingOptionActive: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ratingStars: {
    flexDirection: "row",
    marginRight: 12,
  },
  ratingText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  ratingTextActive: {
    color: "#10B981",
    fontWeight: "500",
  },
  // Advanced Modal Footer
  advancedModalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  advancedModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    marginRight: 8,
  },
  advancedModalButtonPrimary: {
    backgroundColor: "#10B981",
    marginRight: 0,
    marginLeft: 8,
  },
  advancedModalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  advancedModalButtonTextPrimary: {
    color: "white",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
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
    fontSize: isTablet ? 24 : 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isTablet ? 14 : 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 8,
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
  // Quick Add to Cart Button
  quickAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  quickAddButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 4,
  },
  quickAddTextActive: {
    color: "white",
  },
});

export default MyStoreScreen;
