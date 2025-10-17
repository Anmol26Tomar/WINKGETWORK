import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
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
  const navigation = useNavigation();
  const route = useRoute();
  const { businessId, businessName } = route.params || {};
  
  // Use the businessId from navigation params, fallback to default
  const currentBusinessId = businessId || DEFAULT_BUSINESS_ID;
  
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleSocialLink = (url) => {
    if (url) {
      Linking.openURL(url);
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
            fetch(`${API_BASE_URL}/${BUSINESS_ID}`)
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

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#8B5CF6", "#7C3AED"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="business" size={48} color="white" />
            <Title style={styles.title}>
              {businessName || 
               businessData?.shopName ||
               businessData?.storeName ||
               businessData?.name ||
               "My Business"}
            </Title>
            <Text style={styles.subtitle}>Manage your business operations</Text>
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

      <View style={styles.content}>
        {/* Business Information Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>🏢 Business Information</Title>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Owner:</Text>
              <Text style={styles.infoValue}>{businessData.ownerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {businessData.ownerEmail || businessData.email}
              </Text>
            </View>
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
            <Button mode="contained" style={styles.button}>
              Edit Business Info
            </Button>
          </Card.Content>
        </Card>

        {/* My Store Button */}
        {(businessData.websiteLink || businessData.websiteUrl) && (
          <Card style={styles.myStoreCard}>
            <Card.Content>
              <Button
                mode="contained"
                icon="store"
                onPress={openMystoreScreen}
                style={styles.myStoreButton}
                labelStyle={styles.myStoreButtonLabel}
              >
                My Store
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Business Posts Card */}
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

        {/* Analytics Card */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Title style={styles.analyticsTitle}>Business Analytics</Title>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsNumber}>
                  {businessData.totalReviews || 0}
                </Text>
                <Text style={styles.analyticsLabel}>Reviews</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsNumber}>
                  {businessData.averageRating
                    ? businessData.averageRating.toFixed(1)
                    : "0.0"}
                </Text>
                <Text style={styles.analyticsLabel}>Rating</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsNumber}>
                  {businessData.isApproved || businessData.approved
                    ? "✅"
                    : "⏳"}
                </Text>
                <Text style={styles.analyticsLabel}>Status</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Social Links Card */}
        {(businessData.socialLinks ||
          businessData.websiteLink ||
          businessData.websiteUrl) && (
          <Card style={styles.socialCard}>
            <Card.Content>
              <Title style={styles.socialTitle}>🔗 Social Links</Title>
              <View style={styles.socialLinks}>
                {(businessData.websiteLink || businessData.websiteUrl) && (
                  <Button
                    mode="outlined"
                    icon="web"
                    onPress={() =>
                      handleSocialLink(
                        businessData.websiteLink || businessData.websiteUrl
                      )
                    }
                    style={styles.socialButton}
                  >
                    Website
                  </Button>
                )}
                {businessData.socialLinks?.whatsapp && (
                  <Button
                    mode="outlined"
                    icon="logo-whatsapp"
                    onPress={() =>
                      handleSocialLink(businessData.socialLinks.whatsapp)
                    }
                    style={styles.socialButton}
                  >
                    WhatsApp
                  </Button>
                )}
                {businessData.socialLinks?.instagram && (
                  <Button
                    mode="outlined"
                    icon="logo-instagram"
                    onPress={() =>
                      handleSocialLink(businessData.socialLinks.instagram)
                    }
                    style={styles.socialButton}
                  >
                    Instagram
                  </Button>
                )}
                {businessData.socialLinks?.facebook && (
                  <Button
                    mode="outlined"
                    icon="logo-facebook"
                    onPress={() =>
                      handleSocialLink(businessData.socialLinks.facebook)
                    }
                    style={styles.socialButton}
                  >
                    Facebook
                  </Button>
                )}
                {businessData.socialLinks?.telegram && (
                  <Button
                    mode="outlined"
                    icon="paper-plane"
                    onPress={() =>
                      handleSocialLink(businessData.socialLinks.telegram)
                    }
                    style={styles.socialButton}
                  >
                    Telegram
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions Card */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Title style={styles.quickActionsTitle}>Quick Actions</Title>
            <View style={styles.actionsGrid}>
              <Button mode="outlined" style={styles.actionButton}>
                View Reports
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                Manage Posts
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                Edit Profile
              </Button>
              <Button mode="outlined" style={styles.actionButton}>
                Settings
              </Button>
            </View>
          </Card.Content>
        </Card>
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
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
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
  content: {
    padding: 20,
  },
  infoCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
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
  },
  analyticsCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  analyticsItem: {
    alignItems: "center",
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  analyticsLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  quickActionsCard: {
    elevation: 2,
    borderRadius: 12,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    marginBottom: 8,
  },
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
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
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
  socialLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  socialButton: {
    width: "48%",
    marginBottom: 8,
  },
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
});

export default MyBusinessScreen;
