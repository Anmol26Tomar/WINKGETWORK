import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - adjusted for emulator/device with env override for real devices
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  // Android emulator uses 10.0.2.2 to reach host machine
  if (Platform.OS === 'android') return 'http://10.146.76.162:5000/api';
  // iOS simulator / web can use localhost; for real devices, set EXPO_PUBLIC_API_BASE_URL to LAN IP
  return 'http://localhost:5000/api';
};
const BASE_URL = getBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You can dispatch a logout action here if using Redux
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    // WinkgetBusiness auth routes are mounted under /api/business/auth
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    BUSINESS_ACCESS: '/auth/business-access',
  },
  
  // Business endpoints
  BUSINESS: {
    LIST: '/business',
    DETAIL: (slug) => `/business/${slug}`,
    VENDORS: (slug) => `/business/${slug}/vendors`,
    PRODUCTS: (slug) => `/business/${slug}/products`,
    CATEGORIES: (slug) => `/business/${slug}/categories`,
    STATS: (slug) => `/business/${slug}/stats`,
  },
  
  // Vendor endpoints
  VENDOR: {
    DETAIL: (id) => `/vendors/${id}`,
    PRODUCTS: (id) => `/vendors/${id}/products`,
    REVIEWS: (id) => `/vendors/${id}/reviews`,
  },
  
  // Product endpoints
  PRODUCT: {
    LIST: '/products',
    DETAIL: (id) => `/products/${id}`,
    REVIEWS: (id) => `/products/${id}/reviews`,
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
  },
};

export default api;
