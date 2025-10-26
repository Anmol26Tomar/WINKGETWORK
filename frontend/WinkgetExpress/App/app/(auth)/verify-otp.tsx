import { useState, useEffect, useRef } from "react";
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

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { setToken } = useAuth();
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setResendTimer(30);
    setCanResend(false);
    
    try {
      // Simulate API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert("Success", "OTP sent successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  const onSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      return Alert.alert("Invalid OTP", "Please enter the complete 6-digit code");
    }

    setLoading(true);
    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate checking if user is new or existing
      const isNewUser = Math.random() > 0.5; // Random for demo
      
      if (isNewUser) {
        router.replace({ 
          pathname: '/(auth)/signup', 
          params: { phone: phone } 
        });
      } else {
        // Set authentication token and redirect to app
        await setToken('demo-auth-token');
        router.replace('/(app)');
      }
    } catch (error) {
      Alert.alert("Error", "OTP verification failed. Please try again.");
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

          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to +91 {phone}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
            disabled={!canResend}
            onPress={handleResend}
          >
            <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
              {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={onSubmit}
          >
            <Text style={styles.btnText}>
              {loading ? "Verifying..." : "Verify"}
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
    marginBottom: 48,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "#333333",
    borderColor: "#555555",
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  resendButton: {
    alignSelf: "center",
    marginBottom: 32,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: "#86CB92",
    fontSize: 16,
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: "#666666",
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
