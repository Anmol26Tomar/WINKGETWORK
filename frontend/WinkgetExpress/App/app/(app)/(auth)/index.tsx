import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

// ✅ Real imports — make sure paths are correct for your project
import { useAuth } from "@/context/AuthContext";
import { captainAuthApi, setCaptainApiToken } from "../lib/api";
import { connectSocket } from "../lib/socket";

// --- Constants for consistent styling ---
const Colors = {
  background: "#F4F7FC",
  card: "#FFFFFF",
  text: "#1A1A1A",
  mutedText: "#6C757D",
  primary: "#007AFF",
  border: "#E0E0E0",
  danger: "#DC3545",
  success: "#28A745",
  textOnPrimary: "#FFFFFF",
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const Radius = {
  sm: 8,
  md: 16,
};

type VehicleType = "bike" | "truck" | "cab";
type ServiceType =
  | "local_parcel"
  | "intra_truck"
  | "all_india_parcel"
  | "cab_booking"
  | "bike_ride"
  | "packers_movers";

const VALID_SERVICES: Record<VehicleType, ServiceType[]> = {
  bike: ["local_parcel", "bike_ride"],
  truck: ["intra_truck", "all_india_parcel", "packers_movers"],
  cab: ["cab_booking"],
};

const getVehicleSubTypes = (vehicleType: VehicleType): string[] => {
  switch (vehicleType) {
    case "bike":
      return ["bike_standard"];
    case "cab":
      return ["cab_sedan", "cab_suv", "cab_hatchback"];
    case "truck":
      return ["truck_3wheeler", "truck_mini_van", "truck_pickup", "truck_full_size"];
    default:
      return [];
  }
};

export default function CaptainAuthScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Common fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  // ADDED: State for license and vehicle number
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("bike");
  const [vehicleSubType, setVehicleSubType] = useState<string>("");
  const [servicesOffered, setServicesOffered] = useState<ServiceType[]>([]);

  const handleServiceToggle = (service: ServiceType) => {
    setServicesOffered((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      setError("Please enter phone and password");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await captainAuthApi.loginPassword({ phone, password });
      const token = response.data.token;
      const captainData = response.data.agent;

      await SecureStore.setItemAsync("captainToken", token);
      setCaptainApiToken(token);

      const captain = {
        id: captainData.id,
        name: captainData.name,
        email: captainData.phone || phone,
        token: token,
      };
      await login(captain);

      await connectSocket(token);

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.replace("/(app)/(tabs)/home"), 1000);
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.response?.data?.message || e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    // MODIFIED: Added validation for new fields
    if (
      !name ||
      !phone ||
      !password ||
      !city ||
      !licenseNumber ||
      !vehicleNumber ||
      !vehicleSubType ||
      !servicesOffered.length
    ) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // MODIFIED: Added new fields to the signup payload
      const response = await captainAuthApi.signup({
        fullName: name,
        phone,
        password,
        city,
        licenseNumber,
        vehicleNumber,
        vehicleType,
        vehicleSubType,
        servicesOffered,
      });

      const token = response.data.token;
      const captainData = response.data.agent; // Backend returns 'agent', not 'captain'

      await SecureStore.setItemAsync("captainToken", token);
      setCaptainApiToken(token);

      const captain = {
        id: captainData.id,
        name: captainData.name,
        email: captainData.phone || phone,
        token: token,
      };
      await login(captain);

      await connectSocket(token);

      setSuccess("Signup successful! Redirecting...");
      setTimeout(() => router.replace("/(app)/(tabs)/home"), 1000);
    } catch (e: any) {
      console.error("Signup error:", e);
      setError(e.response?.data?.message || e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }

    setLoading(true);
    try {
      await captainAuthApi.requestOtp({ phone });
      Alert.alert("Success", "OTP sent to your phone", [
        { text: "OK", onPress: () => router.push("/(app)/(auth)/verify-otp") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = (login: boolean) => {
    setIsLogin(login);
    setError("");
    setSuccess("");
    setPhone("");
    setPassword("");
    setName("");
    setCity("");
    // ADDED: Reset new fields on form toggle
    setLicenseNumber("");
    setVehicleNumber("");
    setVehicleType("bike");
    setVehicleSubType("");
    setServicesOffered([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome, Captain 👋</Text>
            <Text style={styles.subtitle}>
              {isLogin ? "Sign in to your account" : "Create your captain account"}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.activeBtn]}
                onPress={() => toggleForm(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.activeText]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.activeBtn]}
                onPress={() => toggleForm(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.activeText]}>Signup</Text>
              </TouchableOpacity>
            </View>

            {isLogin ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={Colors.mutedText}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor={Colors.mutedText}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  disabled={loading}
                  onPress={handleRequestOtp}
                >
                  <Text style={styles.btnSecondaryText}>Login with OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.btnText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={Colors.mutedText}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.mutedText}
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={Colors.mutedText}
                  value={city}
                  onChangeText={setCity}
                />

                {/* ADDED: New input fields for license and vehicle number */}
                <TextInput
                  style={styles.input}
                  placeholder="License Number"
                  placeholderTextColor={Colors.mutedText}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle Number"
                  placeholderTextColor={Colors.mutedText}
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>Vehicle Type</Text>
                <View style={styles.optionRow}>
                  {(["bike", "truck", "cab"] as VehicleType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.option, vehicleType === type && styles.optionActive]}
                      onPress={() => {
                        setVehicleType(type);
                        setServicesOffered([]);
                        setVehicleSubType("");
                      }}
                    >
                      <Text
                        style={vehicleType === type ? styles.optionTextActive : styles.optionText}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Vehicle Sub Type</Text>
                <View style={styles.optionRow}>
                  {getVehicleSubTypes(vehicleType).map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.option, vehicleSubType === sub && styles.optionActive]}
                      onPress={() => setVehicleSubType(sub)}
                    >
                      <Text
                        style={
                          vehicleSubType === sub ? styles.optionTextActive : styles.optionText
                        }
                      >
                        {sub.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Services Offered</Text>
                <View style={styles.optionRow}>
                  {VALID_SERVICES[vehicleType].map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.option,
                        servicesOffered.includes(service) && styles.optionActive,
                      ]}
                      onPress={() => handleServiceToggle(service)}
                    >
                      <Text
                        style={
                          servicesOffered.includes(service)
                            ? styles.optionTextActive
                            : styles.optionText
                        }
                      >
                        {service
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor={Colors.mutedText}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.btnText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles (no changes) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: Spacing.md },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    marginVertical: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.text, textAlign: "center", marginBottom: Spacing.sm },
  subtitle: { fontSize: 16, color: Colors.mutedText, textAlign: "center", marginBottom: Spacing.xl },
  error: { color: Colors.danger, textAlign: "center", marginBottom: Spacing.md, fontSize: 14, fontWeight: "500" },
  success: { color: Colors.success, textAlign: "center", marginBottom: Spacing.md, fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
    backgroundColor: "#FFF",
    color: Colors.text,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: "#FFF",
    marginBottom: Spacing.md,
  },
  passwordInput: { flex: 1, padding: Spacing.md, fontSize: 16, color: Colors.text },
  eyeButton: { padding: Spacing.md, justifyContent: "center", alignItems: "center" },
  eyeIcon: { fontSize: 22, color: Colors.mutedText },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    padding: Spacing.xs,
  },
  toggleBtn: { flex: 1, padding: Spacing.sm, alignItems: "center", borderRadius: Radius.sm },
  toggleText: { color: Colors.mutedText, fontWeight: "600", fontSize: 14 },
  activeBtn: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  activeText: { color: Colors.textOnPrimary, fontWeight: "700", fontSize: 14 },
  label: { marginTop: Spacing.sm, marginBottom: Spacing.sm, fontWeight: "600", color: Colors.mutedText, fontSize: 14 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.md },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.mutedText, fontSize: 14, fontWeight: "500" },
  optionTextActive: { color: Colors.textOnPrimary, fontSize: 14, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  btnText: { color: Colors.textOnPrimary, fontWeight: "600", fontSize: 16 },
  btnSecondary: {
    backgroundColor: "transparent",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: "center",
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: { color: Colors.primary, fontWeight: "600", fontSize: 16 },
});