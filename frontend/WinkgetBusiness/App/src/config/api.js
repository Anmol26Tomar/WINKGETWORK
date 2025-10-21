import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// netstat -ano | findstr :5000
// 🌐 Get Base API URL depending on environment and device
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (envUrl) {
    // Ensure the URL ends with /api
    return envUrl.endsWith('/api')
      ? envUrl
      : `${envUrl.replace(/\/$/, '')}/api`;
  }

  // Android emulator: Try multiple IP addresses
  if (Platform.OS === 'android') {
    // Try actual machine IP first, then fallback to 10.0.2.2
    return 'http://10.134.88.162:5000/api';
  }

  // iOS simulator / web: localhost works
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();
console.log('📡 Base API URL:', BASE_URL);
console.log('🌐 Platform:', Platform.OS);
console.log('🔧 Environment URL:', process.env.EXPO_PUBLIC_API_BASE_URL);

// Test connectivity with fallback
const testConnectivity = async () => {
  const baseUrl = BASE_URL.replace('/api', '');
  
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    console.log('✅ Backend connectivity test:', data);
  } catch (error) {
    console.error('❌ Backend connectivity test failed:', error.message);
    
    // If Android and first IP failed, try 10.0.2.2
    if (Platform.OS === 'android' && baseUrl.includes('10.134.88.162')) {
      console.log('🔄 Trying fallback IP: 10.0.2.2');
      try {
        const fallbackResponse = await fetch('http://10.0.2.2:5000/health');
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fallback connectivity test successful:', fallbackData);
        console.log('💡 Consider updating API URL to: http://10.0.2.2:5000/api');
      } catch (fallbackError) {
        console.error('❌ Fallback connectivity test also failed:', fallbackError.message);
      }
    }
  }
};

// Run connectivity test
testConnectivity();

// 🚀 Create Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased timeout for network issues
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alternative IP addresses for Android emulator
const ANDROID_IP_ALTERNATIVES = [
  'http://10.134.88.162:5000/api',  // Current machine IP
  'http://10.0.2.2:5000/api',        // Traditional Android emulator IP
  'http://localhost:5000/api',       // Localhost (if using web)
];

// 🔐 Request interceptor to attach auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        if (!config.headers) config.headers = {}; // Ensure headers object exists
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      console.warn('⚠️ Auth token invalid — user logged out.');
      // You can dispatch a logout or navigation action here if needed
    }
    return Promise.reject(error);
  }
);

// 📁 API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/business/auth/signup',
    LOGIN: '/business/auth/login',
    PROFILE: '/business/auth/me',
    UPDATE_PROFILE: '/business/auth/me',
  },
  VENDORS: {
    LIST: '/business/vendors/public',
    BY_CATEGORY: '/business/vendors/category',
    DETAILS: '/business/vendors/public',
  },
};

export default api;
