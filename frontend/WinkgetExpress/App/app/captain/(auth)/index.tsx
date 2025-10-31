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
} from "react-native";
import { useRouter } from "expo-router";
import { captainAuthApi, setCaptainApiToken } from "../lib/api";
import { connectSocket } from "../lib/socket";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, Radius } from "@/constants/colors";

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
  const { loginCaptain, signupCaptain, token } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Common fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
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
    try {
      const captain = await loginCaptain({ email: phone, password });
      if (token) {
        setCaptainApiToken(token);
        await connectSocket(token);
      }
      setSuccess("Login successful!");
      router.replace("/captain/(tabs)/home");
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !phone || !password || !city || !vehicleSubType || !servicesOffered.length) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const captain = await signupCaptain({
        fullName: name,
        phone,
        password,
        vehicleType,
        vehicleSubType,
        servicesOffered,
        city,
      });

      if (token) {
        setCaptainApiToken(token);
        await connectSocket(token);
      }

      setSuccess("Signup successful!");
      router.replace("/captain/(tabs)/home");
    } catch (e: any) {
      console.error("Signup error:", e);
      setError(e.message || "Signup failed");
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
        { text: "OK", onPress: () => router.push("/captain/(auth)/verify-otp") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.activeText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isLogin && styles.activeBtn]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.activeText]}>Signup</Text>
          </TouchableOpacity>
        </View>

        {isLogin ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
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
                <ActivityIndicator color={Colors.text} />
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
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={city}
              onChangeText={setCity}
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
                  <Text style={vehicleType === type ? styles.optionTextActive : styles.optionText}>
                    {type}
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
                    style={vehicleSubType === sub ? styles.optionTextActive : styles.optionText}
                  >
                    {sub.replace(/_/g, " ")}
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
                    {service.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { flexGrow: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.mutedText,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  error: { color: Colors.danger, textAlign: "center", marginBottom: Spacing.sm },
  success: { color: Colors.primary, textAlign: "center", marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    color: Colors.text,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
  },
  toggleBtn: { flex: 1, padding: Spacing.sm, alignItems: "center", borderRadius: Radius.sm },
  toggleText: { color: Colors.mutedText, fontWeight: "600" },
  activeBtn: { backgroundColor: Colors.primary },
  activeText: { color: Colors.text },
  label: { marginTop: Spacing.sm, fontWeight: "600", color: Colors.mutedText },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
  },
  optionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.mutedText, fontSize: 12 },
  optionTextActive: { color: Colors.text, fontSize: 12 },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  btnText: { color: Colors.text, fontWeight: "600" },
  btnSecondary: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: "center",
    marginVertical: Spacing.xs,
  },
  btnSecondaryText: { color: Colors.mutedText, fontWeight: "600" },
});
