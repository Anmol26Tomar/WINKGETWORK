'use client'
import React, { JSX } from "react";

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
        const result = await signupCaptain({
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
        
        // Show success message for captain signup
        Alert.alert(
          "Registration Successful! 🎉",
          "Your account has been created and is pending admin approval. You will be notified once approved.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/login")
            }
          ]
        )
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
          <Text style={styles.subtitle}>Join Winkget and start your journey</Text>

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
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 24, 
    paddingTop: 20,
    paddingBottom: 50,
  },
  formWrapper: { flex: 1 },
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

  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 12,
  },
  row: { 
    flexDirection: "row", 
    gap: 12, 
    flexWrap: "wrap",
    marginBottom: 16,
  },
  wrapRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12,
    marginBottom: 16,
  },

  optionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionBtnActive: { 
    borderColor: "#FB923C", 
    backgroundColor: "#FEF3E7",
    shadowColor: "#FB923C",
    shadowOpacity: 0.2,
  },
  optionTxt: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#6B7280",
  },
  optionTxtActive: { 
    color: "#FB923C",
    fontWeight: "700",
  },

  btn: { 
    backgroundColor: "#FB923C",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#FB923C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.7 },
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
});

