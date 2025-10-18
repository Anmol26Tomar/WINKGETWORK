"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToken, getToken, deleteToken } from "../utils/secureStore";
import {
  getProfile,
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
} from "../services/authService";

const DEFAULT_BASE = 'http://10.233.13.139:3001';
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE;

type Role = "user" | "captain" | null;

type CaptainLoginPayload = { email: string; password: string };
type VehicleType = "bike" | "cab" | "truck";
type VehicleSubtype =
  | "bike_standard"
  | "cab_sedan"
  | "cab_suv"
  | "cab_hatchback"
  | "truck_3wheeler"
  | "truck_mini_van"
  | "truck_pickup"
  | "truck_full_size";
type ServiceScope = "intra-city" | "inter-city";

type CaptainSignupPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  vehicleType: VehicleType;
  vehicleSubType?: VehicleSubtype;
  serviceType: ServiceScope;
  city: string;
  confirmPassword: string;
};

interface AuthContextType {
  user: any;
  captain: any;
  role: Role;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  approved: boolean | null;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  loginCaptain: (payload: CaptainLoginPayload) => Promise<any>;
  signupCaptain: (payload: CaptainSignupPayload) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [captain, setCaptain] = useState<any>(null);
  const [role, setRole] = useState<Role>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [approved, setApproved] = useState<boolean | null>(null);

  const isAuthenticated = !!token && (user || captain);

  // Restore session
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedRole = await AsyncStorage.getItem("role");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedRole && storedUser) {
          setToken(storedToken);
          setRole(storedRole as Role);
          const parsed = JSON.parse(storedUser);
          if (storedRole === "captain") setCaptain(parsed);
          else setUser(parsed);
        } else {
          // Try to get profile if token exists but no stored data
          if (storedToken) {
            try {
              const me = await getProfile();
              if (me) {
                setUser(me);
                setRole("user");
              }
            } catch (err) {
              console.warn("Profile fetch failed, clearing token", err);
              await deleteToken();
            }
          }
        }
      } catch (err) {
        console.warn("Auth restore failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshProfile = async () => {
    if (role === "captain" && token) {
      setIsLoading(true);

      try {
        const res = await fetch(`${BASE_URL}/api/auth/agent/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCaptain(data);
          await AsyncStorage.setItem("user", JSON.stringify(data));
        }
      } catch (err) {
        console.warn("Error refreshing profile", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const value = useMemo(() => ({
    user,
    captain,
    role,
    token,
    loading,
    isAuthenticated,
    isLoading,
    approved,

      login: async (email: string, password: string) => {
        setIsLoading(true);
        try {
          const u = await apiLogin(email, password); // <-- returns only user
          setUser(u);
          setRole("user");
          // Token is saved inside loginUser already
          const t = await AsyncStorage.getItem("token");
          setToken(t || null);
          await AsyncStorage.setItem("role", "user");
          await AsyncStorage.setItem("user", JSON.stringify(u));
          return u;
        } finally {
          setIsLoading(false);
        }
      },

      register: async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
          await apiRegister(name, email, password); // <-- registers user
          const u = await apiLogin(email, password); // <-- returns user
          setUser(u);
          setRole("user");
          const t = await AsyncStorage.getItem("token");
          setToken(t || null);
          await AsyncStorage.setItem("role", "user");
          await AsyncStorage.setItem("user", JSON.stringify(u));
          return u;
        } finally {
          setIsLoading(false);
        }
      },

    loginCaptain: async (payload: CaptainLoginPayload) => {
      setIsLoading(true);
      try {
        console.log(BASE_URL);
        const res = await fetch(`${BASE_URL}/api/auth/agent/captainlogin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          // Handle approval pending case
          if (res.status === 403 && data.approved === false) {
            setCaptain(data.agent);
            setApproved(false);
            setRole('captain');
            return { ...data.agent, approved: false, requiresApproval: true };
          }
          throw new Error(data.message || 'Captain login failed');
        }
        
        setCaptain(data.agent);
        setToken(data.token);
        setApproved(data.approved);
        console.log(data);
        setRole('captain');
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('role', 'captain');
        await AsyncStorage.setItem('user', JSON.stringify(data.agent));
        return data.agent;
      } finally {
        setIsLoading(false);
      }
    },

    signupCaptain: async (payload: CaptainSignupPayload) => {
      setIsLoading(true);
      console.log(payload);
      try {
        const res = await fetch(`${BASE_URL}/api/auth/agent/captainsignup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Captain signup failed');
        }
        const data = await res.json();
        console.log(data);
        setCaptain(data.agent);
        setApproved(data.approved);
        // Don't set token or role for unapproved signups
        if (data.approved) {
          setToken(data.token);
          setRole('captain');
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('role', 'captain');
        }
        await AsyncStorage.setItem('user', JSON.stringify(data.agent));
        return data.agent;
      } finally {
        setIsLoading(false);
      }
    },

      verifyOTP: async (email: string, otp: string) => {
        setIsLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
          });
          if (!res.ok) throw new Error("OTP verification failed");
          const data = await res.json();
          if (data.user) setUser(data.user);
          if (data.token) setToken(data.token);
          return data;
        } finally {
          setIsLoading(false);
        }
      },

      refreshProfile,

      logout: async () => {
        try {
          await apiLogout();
        } catch {}
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("role");
        await AsyncStorage.removeItem("user");
        setUser(null);
        setCaptain(null);
        setRole(null);
        setToken(null);
      },
    }),
    [user, captain, role, token, loading, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
