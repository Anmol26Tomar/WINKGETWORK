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

  // Android emulator: 10.0.2.2 connects to host machine
  if (Platform.OS === 'android') return 'http://172.20.48.110:5000/api';

  // iOS simulator / web: localhost works
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();
console.log('📡 Base API URL:', BASE_URL);
console.log('🌐 Platform:', Platform.OS);
console.log('🔧 Environment URL:', process.env.EXPO_PUBLIC_API_BASE_URL);

// 🚀 Create Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
  },
  VENDORS: {
    LIST: '/business/vendors/public',
    BY_CATEGORY: '/business/vendors/category',
    DETAILS: '/business/vendors/public',
  },
};

export default api;
