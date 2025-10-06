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
        await loginCaptain({ email: email.trim(), password });
        router.replace("/captain/app/(captabs)"); // navigate to captain index screen
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
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 6,
    backgroundColor: "#FFFFFF",
  },
  tagActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  tagTxt: { color: "#111827", fontWeight: "600" },
  tagTxtActive: { color: "#FFFFFF" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnTxt: { color: "#fff", fontWeight: "700" },
  switchTxt: { marginTop: 16, color: "#6B7280" },
  link: { color: "#2563EB", fontWeight: "700" },
});
