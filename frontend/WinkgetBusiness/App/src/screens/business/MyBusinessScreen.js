import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Card, Title, Paragraph, Button, Chip } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from '@react-navigation/native';
import api, { API_ENDPOINTS } from '../../config/api';

// Use shared Axios base URL and endpoints to avoid mismatches across environments
const DETAILS_ENDPOINT = API_ENDPOINTS.VENDORS.DETAILS; // '/business/vendors/public'
// Default business ID (fallback)
const DEFAULT_BUSINESS_ID = "68ea2cd8f7aa5ea6fe6e4070";

const MyBusinessScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1300);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your business..." />;
  }

  const navigation = useNavigation();
  const route = useRoute();
  const { businessId, businessName } = route.params || {};
  
  // Use the businessId from navigation params, fallback to default
  const currentBusinessId = businessId || DEFAULT_BUSINESS_ID;
  
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("mystore");
  const scrollRef = useRef(null);
  const [reviewsOffsetY, setReviewsOffsetY] = useState(0);
  // Animation values
  const titleOpacity = useState(new Animated.Value(0))[0];
  const titleTranslate = useState(new Animated.Value(12))[0];
  const avatarScale = useState(new Animated.Value(0.9))[0];
  const tabsOpacity = useState(new Animated.Value(0))[0];
  const infoOpacity = useState(new Animated.Value(0))[0];
  const socialOpacity = useState(new Animated.Value(0))[0];
  const postsOpacity = useState(new Animated.Value(0))[0];
  const reviewsOpacity = useState(new Animated.Value(0))[0];

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = `${DETAILS_ENDPOINT}/${currentBusinessId}`;
      console.log("Fetching from:", `${api.defaults.baseURL}${endpoint}`);

      const response = await api.get(endpoint);
      console.log("Response status:", response.status);

      const data = response.data;
      console.log("Fetched data:", data);

      if (!data) {
        throw new Error("No data received from server");
      }

      setBusinessData(data);
    } catch (err) {
      console.error("Error fetching business data:", err);

      // More specific error messages
      let errorMessage = "Network error. Please check your connection.";

      if (err.message.includes("Network request failed") || err.message.includes('Network Error')) {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running on port 5000.";
      } else if (err.response?.status === 404 || err.message.includes("404")) {
        errorMessage = "Business data not found. Please check the business ID.";
      } else if (err.response?.status === 500 || err.message.includes("500")) {
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
    fetchBusinessData();
  }, [currentBusinessId]); // Refetch when businessId changes

  useEffect(() => {
    if (!loading) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(titleTranslate, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.spring(avatarScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(tabsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(infoOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(socialOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(postsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(reviewsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const handleSocialLink = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    const phone = businessData.businessContact || businessData.registeredContact;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("No contact", "Contact number not available.");
    }
  };

  const handleEmail = () => {
    const email = businessData.businessEmail || businessData.ownerEmail || businessData.email;
    if (email) {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert("No email", "Email address not available.");
    }
  };

  const handleLocation = () => {
    const formatted = formatAddress(businessData.businessAddress);
    if (formatted && formatted !== "Not provided") {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatted)}`;
      Linking.openURL(url);
    } else {
      Alert.alert("No location", "Business address not available.");
    }
  };

  const openMystoreScreen = () => {
    if (businessData && businessData._id) {
      // Navigate to MyStore tab with the business ID as parameter
      navigation.navigate('MyStore', { 
        vendorId: businessData._id,
        businessName: businessData.shopName || businessData.storeName || businessData.name
      });
    } else {
      Alert.alert('Error', 'Business data not loaded yet. Please try again.');
    }
  };
  

  const formatAddress = (address) => {
    if (!address) return "Not provided";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading business data...</Text>
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
          onPress={() => {
            setError(null);
            fetchBusinessData();
          }}
          style={styles.retryButton}
        >
          Retry
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            console.log("Testing API endpoint...");
            fetch(`${API_BASE_URL}/${currentBusinessId}`)
              .then((response) => {
                console.log("Test response status:", response.status);
                return response.json();
              })
              .then((data) => console.log("Test response data:", data))
              .catch((err) => console.error("Test error:", err));
          }}
          style={[styles.retryButton, { marginTop: 8 }]}
        >
          Test API
        </Button>
      </View>
    );
  }

  if (!businessData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="business-outline" size={48} color="#6B7280" />
        <Text style={styles.errorTitle}>No Business Data</Text>
        <Text style={styles.errorText}>
          Unable to load business information.
        </Text>
      </View>
    );
  }

  // Build reviews data safely
  const reviews = businessData.reviews || businessData.businessReviews || [];
  const ratingCounts = [5,4,3,2,1].map((star) =>
    reviews.filter((r) => (r.rating || r.stars || 0) === star).length
  );
  const totalRatings = ratingCounts.reduce((a,b)=>a+b,0);
  const averageRating = totalRatings > 0
    ? (reviews.reduce((sum, r)=> sum + (r.rating || r.stars || 0), 0) / totalRatings)
    : (businessData.averageRating || 0);

  return (
    <ScrollView style={styles.container} ref={scrollRef}>
      <View>
        <LinearGradient
          colors={["#6D28D9", "#2563EB"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }]}>
                {businessName || "Electronics"}
              </Animated.Text>
              <Text style={styles.subtitle}>Discover local businesses near you</Text>
              <Chip
                mode="outlined"
                textStyle={{ color: "white" }}
                style={styles.categoryChip}
              >
                {businessData.category || "Business"}
              </Chip>
            </View>
          </View>
        </LinearGradient>

        {/* Overlapping profile avatar */}
        <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
          <Image
            source={{ uri: businessData.logoUrl || businessData.profileImage || businessData.imageUrl || "https://i.pravatar.cc/150?img=12" }}
            style={styles.avatar}
          />
        </Animated.View>
      </View>

      {/* Tabs - horizontally scrollable */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        style={[styles.tabsScroll, { opacity: tabsOpacity }]}
      >
        <TouchableOpacity
          style={[styles.tabPill, selectedTab === "mystore" && styles.tabPillActive]}
          onPress={() => {
            setSelectedTab("mystore");
            openMystoreScreen();
          }}
        >
          <Ionicons name="storefront" size={18} color={selectedTab === "mystore" ? "white" : "#3B82F6"} />
          <Text style={[styles.tabLabel, selectedTab === "mystore" && styles.tabLabelActive]}>My store</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, selectedTab === "website" && styles.tabPillActive]}
          onPress={() => {
            setSelectedTab("website");
            const link = businessData.websiteLink || businessData.websiteUrl;
            if (link) handleSocialLink(link); else Alert.alert("No website", "This business has not added a website yet.");
          }}
        >
          <Ionicons name="globe-outline" size={18} color={selectedTab === "website" ? "white" : "#3B82F6"} />
          <Text style={[styles.tabLabel, selectedTab === "website" && styles.tabLabelActive]}>Website</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, selectedTab === "reviews" && styles.tabPillActive]}
          onPress={() => {
            setSelectedTab("reviews");
            setTimeout(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ y: Math.max(reviewsOffsetY - 80, 0), animated: true });
              }
            }, 0);
          }}
        >
          <Ionicons name="star" size={18} color={selectedTab === "reviews" ? "white" : "#3B82F6"} />
          <Text style={[styles.tabLabel, selectedTab === "reviews" && styles.tabLabelActive]}>Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, selectedTab === "queries" && styles.tabPillActive]}
          onPress={() => {
            setSelectedTab("queries");
            const phone = businessData.businessContact || businessData.registeredContact;
            if (phone) Linking.openURL(`tel:${phone}`); else Alert.alert("No contact", "Contact number not available.");
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={selectedTab === "queries" ? "white" : "#3B82F6"} />
          <Text style={[styles.tabLabel, selectedTab === "queries" && styles.tabLabelActive]}>Queries</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      <View style={styles.content}>
        {/* Quick Actions: Call, Email, Location */}
        <Animated.View style={{ opacity: infoOpacity, transform: [{ translateY: infoOpacity.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.tabPill} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#3B82F6" />
              <Text style={styles.tabLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabPill} onPress={handleEmail}>
              <Ionicons name="mail" size={18} color="#3B82F6" />
              <Text style={styles.tabLabel}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabPill} onPress={handleLocation}>
              <Ionicons name="location" size={18} color="#3B82F6" />
              <Text style={styles.tabLabel}>Location</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {/* Business Information Card */}
        <Animated.View style={{ opacity: infoOpacity, transform: [{ translateY: infoOpacity.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>🏢 Business Information</Title>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business Email:</Text>
              <Text style={styles.infoValue}>
                {businessData.businessEmail || "Not provided"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact:</Text>
              <Text style={styles.infoValue}>
                {businessData.businessContact ||
                  businessData.registeredContact ||
                  "Not provided"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>
                {formatAddress(businessData.businessAddress)}
              </Text>
            </View>
            <Paragraph style={styles.infoText}>
              {businessData.aboutBusiness ||
                businessData.briefInfo ||
                "No description provided."}
            </Paragraph>
          </Card.Content>
        </Card>
        </Animated.View>

        {/* Social Links (Circular Icons) */}
        <Animated.View style={{ opacity: socialOpacity, transform: [{ translateY: socialOpacity.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }}>
          <Card style={styles.socialCard}>
            <Card.Content>
              <Title style={styles.socialTitle}>Social Links</Title>
              <View style={styles.socialIconRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.circleIcon, styles.glowGreen]}
                  onPress={() => {
                    const link = businessData.socialLinks?.whatsapp;
                    link ? handleSocialLink(link) : Alert.alert("No WhatsApp", "WhatsApp link not added.");
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.circleIcon, styles.glowBlue]}
                  onPress={() => {
                    const link = businessData.socialLinks?.facebook;
                    link ? handleSocialLink(link) : Alert.alert("No Facebook", "Facebook link not added.");
                  }}
                >
                  <Ionicons name="logo-facebook" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.circleIcon, styles.glowPink]}
                  onPress={() => {
                    const link = businessData.socialLinks?.instagram;
                    link ? handleSocialLink(link) : Alert.alert("No Instagram", "Instagram link not added.");
                  }}
                >
                  <Ionicons name="logo-instagram" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.circleIcon, styles.glowBlue]}
                  onPress={() => {
                    const link = businessData.socialLinks?.linkedin;
                    link ? handleSocialLink(link) : Alert.alert("No LinkedIn", "LinkedIn link not added.");
                  }}
                >
                  <Ionicons name="logo-linkedin" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
        {/* Business Posts Card */}
        <Animated.View style={{ opacity: postsOpacity, transform: [{ translateY: postsOpacity.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }}>
          <Card style={styles.postsCard}>
            <Card.Content>
            <Title style={styles.postsTitle}>📱 Recent Posts</Title>
            {businessData.businessPosts &&
            businessData.businessPosts.length > 0 ? (
              businessData.businessPosts.slice(0, 3).map((post, index) => (
                <View key={index} style={styles.postItem}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postDescription} numberOfLines={2}>
                    {post.description}
                  </Text>
                  <View style={styles.postStats}>
                    <Text style={styles.postLikes}>
                      ❤️ {post.likes || 0} likes
                    </Text>
                    <Text style={styles.postComments}>
                      💬 {post.comments?.length || 0} comments
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noPostsContainer}>
                <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noPostsText}>No posts available</Text>
                <Text style={styles.noPostsSubtext}>
                  Create your first business post to engage with customers
                </Text>
              </View>
            )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Reviews Section */}
        <Animated.View style={{ opacity: reviewsOpacity, transform: [{ translateY: reviewsOpacity.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }} onLayout={(e)=> setReviewsOffsetY(e.nativeEvent.layout.y)}>
          <Card style={styles.reviewsCard}>
            <Card.Content>
            <Title style={styles.reviewsTitle}>Customer Reviews</Title>
            {!!totalRatings && (
              <View style={styles.avgRatingRow}>
                <Ionicons name="star" size={18} color="#F59E0B" />
                <Text style={styles.avgRatingText}>{averageRating.toFixed(1)} out of 5</Text>
              </View>
            )}
            <View style={styles.ratingBars}>
              {[5,4,3,2,1].map((star, idx) => {
                const count = ratingCounts[idx];
                const percent = totalRatings ? (count / totalRatings) : 0;
                return (
                  <View key={star} style={styles.ratingRow}>
                    <Text style={styles.ratingStar}>{star}⭐</Text>
                    <View style={styles.barBackground}>
                      <View style={[styles.barFill, { width: `${percent * 100}%`, backgroundColor: star >= 4 ? '#10B981' : star === 3 ? '#F59E0B' : '#EF4444' }]} />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.reviewList}>
              {reviews.length > 0 ? (
                reviews.slice(0, 5).map((rv, i) => (
                  <View key={i} style={styles.reviewItem}>
                    <Text style={styles.reviewerName}>{rv.reviewerName || rv.name || 'Anonymous'}</Text>
                    <View style={styles.starsRow}>
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Ionicons
                          key={s}
                          name={s < (rv.rating || rv.stars || 0) ? 'star' : 'star-outline'}
                          size={14}
                          color="#F59E0B"
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>
                    {!!rv.comment && <Text style={styles.reviewComment}>{rv.comment}</Text>}
                    {!!rv.createdAt && <Text style={styles.reviewTime}>{new Date(rv.createdAt).toLocaleDateString()}</Text>}
                  </View>
                ))
              ) : (
                <View style={styles.noPostsContainer}>
                  <Ionicons name="chatbubble-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.noPostsText}>No reviews yet</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
        </Animated.View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 56,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  avatarWrapper: {
    position: "absolute",
    left: 20,
    bottom: -28,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#F8FAFC",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  tabsContainer: {
    marginTop: 48,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabsScroll: {
    marginTop: 48,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  tabLabel: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 13,
  },
  tabLabelActive: {
    color: "white",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  cardContent: {
    padding: 20,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 10, // small vertical gap before Business Information
  },
  infoCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    borderRadius: 12,
  },
  analyticsCard: {
    marginBottom: 24,
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
    alignItems: "center",
  },
  analyticsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    color: "#6B7280",
    marginTop: 4,
  },
  quickActionsCard: {
    elevation: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  // quick actions removed
  // New styles for business data display
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
  retryButton: {
    marginTop: 8,
  },
  categoryChip: {
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  postsCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  postItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  postStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postLikes: {
    fontSize: 12,
    color: "#EF4444",
  },
  postComments: {
    fontSize: 12,
    color: "#3B82F6",
  },
  socialCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  socialIconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  glowBlue: { backgroundColor: "#2563EB", shadowColor: "#60A5FA" },
  glowGreen: { backgroundColor: "#25D366", shadowColor: "#86EFAC" },
  glowPink: { backgroundColor: "#E1306C", shadowColor: "#F9A8D4" },
  noPostsContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noPostsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 4,
  },
  noPostsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  myStoreCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  myStoreButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
  },
  myStoreButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewsCard: {
    marginBottom: 24,
    elevation: 2,
    borderRadius: 12,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  avgRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  avgRatingText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 6,
  },
  ratingBars: {
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingStar: {
    width: 42,
    color: "#374151",
    fontSize: 12,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 8,
  },
  ratingCount: {
    width: 28,
    textAlign: "right",
    color: "#6B7280",
    fontSize: 12,
  },
  reviewList: {
    marginTop: 8,
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  reviewerName: {
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  reviewComment: {
    color: "#374151",
    fontSize: 13,
  },
  reviewTime: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#8B5CF6",
  },
});

export default MyBusinessScreen;
