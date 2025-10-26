import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";

type VehicleType = "Bike" | "Auto";

export default function SignupScreen() {
  const router = useRouter();
  const { setToken } = useAuth();
  const { phone } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("Bike");
  const [vehicleRegistration, setVehicleRegistration] = useState("");

  const onSubmit = async () => {
    if (!fullName || !email || !city || !vehicleRegistration) {
      return Alert.alert("Missing Fields", "Please fill all required fields");
    }

    if (!email.includes("@")) {
      return Alert.alert("Invalid Email", "Please enter a valid email address");
    }

    setLoading(true);
    try {
      // Simulate API call to register user
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set authentication token and navigate to main app
      await setToken('demo-auth-token');
      router.replace('/(app)');
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Complete your captain profile
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />

          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <View style={styles.vehicleTypeContainer}>
            <TouchableOpacity
              style={[
                styles.vehicleTypeButton,
                vehicleType === "Bike" && styles.vehicleTypeButtonActive
              ]}
              onPress={() => setVehicleType("Bike")}
            >
              <Text style={[
                styles.vehicleTypeText,
                vehicleType === "Bike" && styles.vehicleTypeTextActive
              ]}>
                Bike
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.vehicleTypeButton,
                vehicleType === "Auto" && styles.vehicleTypeButtonActive
              ]}
              onPress={() => setVehicleType("Auto")}
            >
              <Text style={[
                styles.vehicleTypeText,
                vehicleType === "Auto" && styles.vehicleTypeTextActive
              ]}>
                Auto
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Vehicle Registration Number"
            value={vehicleRegistration}
            onChangeText={setVehicleRegistration}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={onSubmit}
          >
            <Text style={styles.btnText}>
              {loading ? "Creating Account..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#1a1a1a",
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  content: {
    flex: 1,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 32,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#333333",
    borderColor: "#555555",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
    marginTop: 8,
  },
  vehicleTypeContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  vehicleTypeButton: {
    flex: 1,
    backgroundColor: "#333333",
    borderColor: "#555555",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  vehicleTypeButtonActive: {
    backgroundColor: "#86CB92",
    borderColor: "#86CB92",
  },
  vehicleTypeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  vehicleTypeTextActive: {
    color: "#000000",
  },
  btn: { 
    backgroundColor: "#86CB92", 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    borderRadius: 12, 
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#86CB92",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  btnDisabled: { 
    opacity: 0.7 
  },
  btnText: { 
    color: "#000000", 
    fontWeight: "700",
    fontSize: 18,
  },
});