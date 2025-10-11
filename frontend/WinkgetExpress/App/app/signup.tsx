'use client'

import { useMemo, useState } from "react"
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
  ActivityIndicator,
} from "react-native"
import { useRouter, Link } from "expo-router"
import { useAuth } from "../context/AuthContext" // adjust path if needed

type Role = "User" | "Captain"
type VehicleType = "bike" | "cab" | "truck"
type VehicleSubtype =
  | "bike_standard"
  | "cab_sedan"
  | "cab_suv"
  | "cab_hatchback"
  | "truck_3wheeler"
  | "truck_mini_van"
  | "truck_pickup"
  | "truck_full_size"
type ServiceScope = "intra-city" | "inter-city"

export default function SignupScreen(): JSX.Element {
  const router = useRouter()
  const { register, signupCaptain } = useAuth()

  const [role, setRole] = useState<Role>("User")

  // User fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Captain fields
  const [city, setCity] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType>("bike")
  const [vehicleSubtype, setVehicleSubtype] = useState<VehicleSubtype>("bike_standard")
  const [serviceScope, setServiceScope] = useState<ServiceScope>("intra-city")

  const [loading, setLoading] = useState(false)

  // Dynamic vehicle subtype options
  const subtypeOptions = useMemo(() => {
    if (vehicleType === "truck") {
      return [
        { value: "truck_3wheeler" as VehicleSubtype, label: "3 Wheeler" },
        { value: "truck_mini_van" as VehicleSubtype, label: "Mini Van" },
        { value: "truck_pickup" as VehicleSubtype, label: "Pickup Truck" },
        { value: "truck_full_size" as VehicleSubtype, label: "Full Size" },
      ]
    }
    if (vehicleType === "cab") {
      return [
        { value: "cab_sedan" as VehicleSubtype, label: "Sedan" },
        { value: "cab_suv" as VehicleSubtype, label: "SUV" },
        { value: "cab_hatchback" as VehicleSubtype, label: "Hatchback" },
      ]
    }
    return [{ value: "bike_standard" as VehicleSubtype, label: "Standard" }]
  }, [vehicleType])

  // Validation
  const validate = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all required fields")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email")
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match")
      return false
    }
    if (!/^\d{10,15}$/.test(phone)) {
      Alert.alert("Invalid phone", "Please enter a valid phone number")
      return false
    }
    if (role === "Captain") {
      if (!city) {
        Alert.alert("Missing fields", "Please enter your city")
        return false
      }
      if (!vehicleSubtype) {
        Alert.alert("Missing fields", "Please choose a vehicle subtype")
        return false
      }
    }
    return true
  }

  // Submit handler
  const onSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (role === "User") {
        await register(name, email.trim(), password)
        router.replace("/(tabs)")
      } else {
        await signupCaptain({
          fullName: name,
          email,
          phone,
          password,
          vehicleType,
          vehicleSubType: vehicleSubtype,
          serviceType: serviceScope,
          city,
          confirmPassword,
        })
        router.push({ pathname: "/captain/app/verify-otp", params: { phone } })
      }
    } catch (e: any) {
      Alert.alert("Signup failed", e?.response?.data?.message || e?.message || "Please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formWrapper}>
          <Text style={styles.title}>Create account</Text>

          {/* Role toggle */}
          <View style={styles.toggleRow}>
            <RoleTag label="User" active={role === "User"} onPress={() => setRole("User")} />
            <RoleTag label="Captain" active={role === "Captain"} onPress={() => setRole("Captain")} />
          </View>

          {/* Common fields */}
          <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Captain-specific fields */}
          {role === "Captain" && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.sectionLabel}>Vehicle Type</Text>
              <View style={styles.row}>
                {(["bike", "cab", "truck"] as VehicleType[]).map((type) => (
                  <OptionButton
                    key={type}
                    label={type}
                    active={vehicleType === type}
                    onPress={() => setVehicleType(type)}
                  />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Vehicle Subtype</Text>
              <View style={styles.wrapRow}>
                {subtypeOptions.map((opt) => (
                  <OptionButton
                    key={opt.value}
                    label={opt.label}
                    active={vehicleSubtype === opt.value}
                    onPress={() => setVehicleSubtype(opt.value)}
                  />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Service Scope</Text>
              <View style={styles.row}>
                {(["intra-city", "inter-city"] as ServiceScope[]).map((scope) => (
                  <OptionButton
                    key={scope}
                    label={scope}
                    active={serviceScope === scope}
                    onPress={() => setServiceScope(scope)}
                  />
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={onSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTxt}>Sign up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.switchTxt}>
            Already have an account?{" "}
            <Link href="/login" style={styles.link}>
              Login
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function RoleTag({
  label,
  active,
  onPress,
}: {
  label: Role
  active: boolean
  onPress: () => void
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
  )
}

function OptionButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.optionBtn, active ? styles.optionBtnActive : null]}
    >
      <Text style={[styles.optionTxt, active ? styles.optionTxtActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 48 },
  formWrapper: { flex: 1 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 20 },
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

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 10,
    marginBottom: 6,
  },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  optionBtnActive: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  optionTxt: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  optionTxtActive: { color: "#2563EB" },

  btn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.7 },
  btnTxt: { color: "#fff", fontWeight: "700" },

  switchTxt: { marginTop: 16, color: "#6B7280" },
  link: { color: "#2563EB", fontWeight: "700" },
})
