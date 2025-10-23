import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const SidebarModal = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const translateX = React.useRef(new Animated.Value(width)).current;
  const dimOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(dimOpacity, {
          toValue: 0.4,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dimOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const navigateAndClose = (screen, params) => {
    onClose?.();
    if (screen) navigation.navigate(screen, params);
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.dim, { opacity: dimOpacity }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        {/* Header with Blue Gradient */}
        <LinearGradient
          colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="person-circle" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>More Options</Text>
            <Text style={styles.headerSubtitle}>Manage your account</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigateAndClose("Profile")}
            >
              <View style={styles.cardIconContainer}>
                <Ionicons name="person-circle" size={24} color="#3B82F6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardSubtitle}>
                  View and edit your profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigateAndClose("MyOrders")}
            >
              <View style={styles.cardIconContainer}>
                <Ionicons name="receipt" size={24} color="#3B82F6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>My Orders</Text>
                <Text style={styles.cardSubtitle}>
                  Track your order history
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigateAndClose("Wishlist")}
            >
              <View style={styles.cardIconContainer}>
                <Ionicons name="heart" size={24} color="#3B82F6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>My Wishlist</Text>
                <Text style={styles.cardSubtitle}>Your saved items</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigateAndClose("MyAccount")}
            >
              <View style={styles.cardIconContainer}>
                <Ionicons name="settings" size={24} color="#3B82F6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>My Account</Text>
                <Text style={styles.cardSubtitle}>
                  Account settings and preferences
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.menuCard, styles.logoutCard]}
              onPress={handleLogout}
            >
              <View
                style={[styles.cardIconContainer, styles.logoutIconContainer]}
              >
                <Ionicons name="log-out" size={24} color="#EF4444" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, styles.logoutText]}>
                  Logout
                </Text>
                <Text style={styles.cardSubtitle}>
                  Sign out of your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.85,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    alignItems: "center",
    position: "relative",
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  logoutCard: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEFEFE",
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoutIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  logoutText: {
    color: "#EF4444",
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
});

export default SidebarModal;
