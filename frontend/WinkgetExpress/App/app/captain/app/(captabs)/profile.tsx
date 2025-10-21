import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  Animated,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  LogOut,
  Truck,
  Settings,
  Shield,
  Award,
  HelpCircle,
  MessageCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../../context/AuthContext";
import { captainService } from "../../services/api";

interface Captain {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  vehicleType?: string;
  serviceType?: string;
  rating?: number;
  totalTrips?: number;
  experienceYears?: number;
  tripsToday?: number;
  is_available?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { captain, logout, refreshProfile } = useAuth();
  const [isAvailable, setIsAvailable] = useState(
    captain?.is_available || false
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [city, setCity] = useState(captain?.city || "");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [captainProfile, setCaptainProfile] = useState<Captain | null>(null);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [bounceAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    fetchCaptainProfile();
  }, []);

  const fetchCaptainProfile = async () => {
    try {
      setLoading(true);
      const profile = await captainService.getProfile();
      setCaptainProfile(profile);
    } catch (error) {
      console.error("Error fetching captain profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (value: boolean) => {
    try {
      setIsAvailable(value);
      await refreshProfile();
    } catch (error) {
      setIsAvailable(!value);
      Alert.alert("Error", "Failed to update availability");
    }
  };

  const handleUpdateCity = async () => {
    if (!city.trim()) {
      Alert.alert("Error", "City cannot be empty");
      return;
    }
    setUpdating(true);
    try {
      await refreshProfile();
      setEditModalVisible(false);
      Alert.alert("Success", "City updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update city");
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    onEdit,
  }: {
    icon: any;
    label: string;
    value: string;
    onEdit?: () => void;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.iconContainer}>
          <Icon size={20} color="#6B7280" />
        </View>
        <View>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Settings size={18} color="#FB923C" />
        </TouchableOpacity>
      )}
    </View>
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: string;
    color: string;
  }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          transform: [
            { scale: scaleAnim },
            {
              translateY: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -2],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.statIconContainer,
          { backgroundColor: `${color}20`, transform: [{ scale: bounceAnim }] },
        ]}
      >
        <Icon size={24} color={color} />
      </Animated.View>
      <Animated.Text
        style={{
          ...styles.statValue,
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        }}
      >
        {value}
      </Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  const displayName = captain?.fullName || captain?.name || "Captain";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FF6B35" />
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => setHelpModalVisible(true)}
      >
        <HelpCircle size={24} color="#FF6B35" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Shield size={16} color="#10B981" />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.vehicleBadge}>
            <Truck size={14} color="#FB923C" />
            <Text style={styles.vehicleText}>
              {captain?.vehicleType?.toUpperCase() || "CAPTAIN"} •{" "}
              {captain?.serviceType?.replace("-", " ").toUpperCase() ||
                "SERVICE"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={Star}
            label="Rating"
            value={captain?.rating ? captain.rating.toFixed(1) : "0.0"}
            color="#F59E0B"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Trips"
            value={captain?.totalTrips ? String(captain.totalTrips) : "0"}
            color="#10B981"
          />
          <StatCard
            icon={Award}
            label="Experience"
            value={`${captain?.experienceYears || 0}Y`}
            color="#8B5CF6"
          />
          <StatCard
            icon={Truck}
            label="Today"
            value={`${captain?.tripsToday || 0}`}
            color="#FB923C"
          />
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <View style={styles.availabilityRow}>
            <View>
              <Text style={styles.availabilityTitle}>Available for Trips</Text>
              <Text style={styles.availabilitySubtext}>
                {isAvailable ? "You are online" : "You are offline"}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: "#D1D5DB", true: "#FED7AA" }}
              thumbColor={isAvailable ? "#FB923C" : "#F3F4F6"}
            />
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow
              icon={Phone}
              label="Phone"
              value={captain?.phone || "Not provided"}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={captain?.email || "Not provided"}
            />
            <InfoRow
              icon={MapPin}
              label="City"
              value={captain?.city || "Not set"}
              onEdit={() => setEditModalVisible(true)}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>Captain App</Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update City</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your city"
              value={city}
              onChangeText={setCity}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdateCity}
                disabled={updating}
              >
                <Text style={styles.updateButtonText}>
                  {updating ? "Updating..." : "Update"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={helpModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            <View>
              <Text
                style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}
              >
                Need help? Contact our support team for assistance with your
                captain account.
              </Text>
              <View
                style={{ flexDirection: "row", justifyContent: "space-around" }}
              >
                <TouchableOpacity style={{ alignItems: "center" }}>
                  <Phone size={20} color="#FF6B35" />
                  <Text style={{ color: "#FF6B35", marginTop: 4 }}>
                    Call Support
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: "center" }}>
                  <Mail size={20} color="#FF6B35" />
                  <Text style={{ color: "#FF6B35", marginTop: 4 }}>
                    Email Support
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: "center" }}>
                  <MessageCircle size={20} color="#FF6B35" />
                  <Text style={{ color: "#FF6B35", marginTop: 4 }}>
                    Live Chat
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  scrollView: { flex: 1 },
  profileCard: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    padding: 32,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: { marginBottom: 20, position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FB923C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#FB923C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 36, fontWeight: "700", color: "#FFFFFF" },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 8 },
  vehicleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FB923C",
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  availabilityRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  availabilitySubtext: { fontSize: 12, color: "#6B7280" },
  infoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
  editButton: { padding: 8 },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#EF4444" },
  footer: { alignItems: "center", paddingVertical: 24, gap: 4 },
  footerText: { fontSize: 12, color: "#9CA3AF" },
  servicesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEF3F2",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceText: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  updateButton: {
    backgroundColor: "#FB923C",
    shadowColor: "#FB923C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  updateButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  helpButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});
