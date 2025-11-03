import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Auth context interface
interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  captain: CaptainData | null;
  token: string | null;
  login: (data: CaptainData) => Promise<void>;
  logout: () => Promise<void>;
}

// Captain user data structure
interface CaptainData {
  id: string;
  name: string;
  email: string;
  token: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [captain, setCaptain] = useState<CaptainData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check persisted login state
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const savedCaptain = await AsyncStorage.getItem('captain');
        if (savedCaptain) {
          setCaptain(JSON.parse(savedCaptain));
        }
      } catch (err) {
        console.error('Auth load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Login
  const login = async (data: CaptainData) => {
    try {
      setCaptain(data);
      await AsyncStorage.setItem('captain', JSON.stringify(data));
      // Also persist token in SecureStore for API fallback/interceptors
      if (data?.token) {
        await SecureStore.setItemAsync('captainToken', data.token);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setCaptain(null);
      await AsyncStorage.removeItem('captain');
      await SecureStore.deleteItemAsync('captainToken');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!captain,
        loading,
        captain,
        token: captain?.token ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easy access
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
