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
import { useRouter, Link } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

type Role = "User" | "Captain";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginCaptain } = useAuth();

  const [role, setRole] = useState<Role>("User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password)
      return Alert.alert("Missing fields", "Please fill all fields");

    setLoading(true);
    try {
      if (role === "User") {
        await login(email.trim(), password);
        router.replace("/(tabs)"); // navigate to a real user tab screen
      } else {
        const result = await loginCaptain({ email: email.trim(), password });
        
        // Check if captain requires approval
        if (result && result.requiresApproval) {
          // Stay on login screen, approval pending will be shown by index.tsx
          router.replace("/captain/app");
        } else {
          router.replace("/captain/app/(captabs)"); // navigate to captain index screen
        }
      }
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Please try again");
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to Winkget</Text>

        <View style={styles.toggleRow}>
          <RoleTag
            label="User"
            active={role === "User"}
            onPress={() => setRole("User")}
          />
          <RoleTag
            label="Captain"
            active={role === "Captain"}
            onPress={() => setRole("Captain")}
          />
        </View>

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
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={onSubmit}
        >
          <Text style={styles.btnTxt}>
            {loading ? "Please wait…" : "Login"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchTxt}>
          {"Don't have an account? "}
          <Link href="/signup" style={styles.link}>
            Sign up
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleTag({
  label,
  active,
  onPress,
}: {
  label: Role;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tag, active ? styles.tagActive : null]}
    >
      <Text style={[styles.tagTxt, active ? styles.tagTxtActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
<<<<<<< Updated upstream
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#0F172A", marginBottom: 20 },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
=======
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 24, 
    justifyContent: "center",
    paddingBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "center",
  },
  toggleRow: { 
    flexDirection: "row", 
    gap: 8, 
    marginBottom: 24,
    justifyContent: "center",
  },
>>>>>>> Stashed changes
  tag: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginRight: 6,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tagActive: { 
    backgroundColor: "#FB923C", 
    borderColor: "#FB923C",
    shadowColor: "#FB923C",
    shadowOpacity: 0.3,
  },
  tagTxt: { 
    color: "#374151", 
    fontWeight: "600",
    fontSize: 16,
  },
  tagTxtActive: { 
    color: "#FFFFFF",
    fontWeight: "700",
  },
<<<<<<< Updated upstream
  tagActive: { backgroundColor: "#FF6B35", borderColor: "#FF6B35" },
  tagTxt: { color: "#111827", fontWeight: "600" },
  tagTxtActive: { color: "#FFFFFF" },
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  btn: {
<<<<<<< Updated upstream
    backgroundColor: "#FF6B35",
    padding: 14,
    borderRadius: 12,
=======
    backgroundColor: "#FB923C",
    padding: 18,
    borderRadius: 16,
>>>>>>> Stashed changes
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#FB923C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
=======
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, marginBottom: 12,
    shadowColor: "rgba(2,6,23,0.04)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 1 },
  btn: { backgroundColor: "#1E40AF", padding: 16, borderRadius: 14, alignItems: "center", marginTop: 12,
    shadowColor: "rgba(2,6,23,0.15)", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
  btnDisabled: { opacity: 0.7 },
<<<<<<< Updated upstream
  btnTxt: { color: "#fff", fontWeight: "700" },
  switchTxt: { marginTop: 16, color: "#6B7280" },
  link: { color: "#FF6B35", fontWeight: "700" },
=======
  btnTxt: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 18,
  },
  switchTxt: { 
    marginTop: 24, 
    color: "#6B7280",
    textAlign: "center",
    fontSize: 16,
  },
  link: { 
    color: "#FB923C", 
    fontWeight: "700",
  },
>>>>>>> Stashed changes
});
