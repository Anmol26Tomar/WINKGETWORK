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
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
    }

    setLoading(true);
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to verify OTP screen
      router.push({ 
        pathname: '/(auth)/verify-otp', 
        params: { phone: phoneNumber } 
      });
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
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
          <Text style={styles.title}>Welcome, Captain</Text>
          <Text style={styles.subtitle}>Enter your phone number to get started</Text>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={onSubmit}
          >
            <Text style={styles.btnText}>
              {loading ? "Sending..." : "Send OTP"}
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
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 48,
    textAlign: "center",
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 32,
    alignItems: "center",
  },
  countryCode: {
    backgroundColor: "#333333",
    borderColor: "#555555",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginRight: 12,
    minWidth: 60,
    alignItems: "center",
  },
  countryCodeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#333333",
    borderColor: "#555555",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  btn: { 
    backgroundColor: "#86CB92", 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    borderRadius: 12, 
    alignItems: "center",
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