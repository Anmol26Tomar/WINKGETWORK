import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

import { EXPO_PUBLIC_API_BASE } from '@env';


const API_BASE = (EXPO_PUBLIC_API_BASE && EXPO_PUBLIC_API_BASE.trim()) || process.env.EXPO_PUBLIC_API_BASE || API_CONFIG.BASE_URL;

console.log('XXXX---API_BASE---XXXX', API_BASE);

// Create ONE main axios instance for the captain API
export const captainApi = axios.create({
  baseURL: `${API_BASE}/api/v1/captain`,
  timeout: 10000,
});

/* * REMOVED captainApi1
 * Using two instances was causing 401 (Unauthorized) errors
 * because setCaptainApiToken only applied to captainApi.
 * All API calls must use the single 'captainApi' instance.
 */

// Function to set auth token (called on login/app load)
export const setCaptainApiToken = (token: string) => {
  captainApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Function to clear auth token (called on logout)
export const clearCaptainApiToken = () => {
  delete captainApi.defaults.headers.common['Authorization'];
};

// Add request interceptor to include auth token
captainApi.interceptors.request.use(
  async (config) => {
    try {
      // First check if Authorization is already set (by setCaptainApiToken)
      if (config.headers.Authorization) {
        return config;
      }
      
      // If not, try to get token from SecureStore (as a fallback)
      const token = await SecureStore.getItemAsync('captainToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
captainApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await SecureStore.deleteItemAsync('captainToken');
      await SecureStore.deleteItemAsync('captainProfile');
      // Also clear the default header in the running app instance
      clearCaptainApiToken(); 
      // You might want to emit an event here to trigger navigation
      console.error('Auth Error (401): Token is invalid or expired. User logged out.');
    }
    return Promise.reject(error);
  }
);

// API methods
export const captainAuthApi = {
  signup: (data: any) => captainApi.post('/auth/signup', data),
  loginPassword: (data: any) => captainApi.post('/auth/login-password', data),
  requestOtp: (data: any) => captainApi.post('/auth/login-otp-request', data),
  verifyOtp: (data: any) => captainApi.post('/auth/login-otp-verify', data),
};

export const captainTripApi = {
  getNearbyTrips: (params: any) => captainApi.get('/trips/nearby-trips', { params }),
  acceptTrip: (tripId: string, tripType: string = 'transport') => captainApi.post(`/trips/${tripType}/${tripId}/accept`),
  reachedPickup: (tripId: string, tripType: string = 'transport') => captainApi.post(`/trips/${tripType}/${tripId}/reached-pickup`),
  
  // --- RENAMED ---
  // Renamed from 'verifyOtp' to 'startTrip' to match the call in home.tsx
  verifyOtp: (tripId: string, tripType: string, data: any) => captainApi.post(`/trips/${tripType}/${tripId}/verify-otp`, data),
  
  reachedDestination: (tripId: string, tripType: string = 'transport') => captainApi.post(`/trips/${tripType}/${tripId}/reached-destination`),
  resendOtp: (tripId: string, tripType: string, data: any) => captainApi.post(`/trips/${tripType}/${tripId}/resend-otp`, data),
  getEarnings: () => captainApi.get('/earnings'),
  getTransactions: () => captainApi.get('/transactions'),
  getProfile: () => captainApi.get('/profile'),
  updateProfile: (data: any) => captainApi.put('/profile', data),
  getWalletBalance: () => captainApi.get('/wallet/balance'),
  getWalletTransactions: () => captainApi.get('/wallet/transactions'),
  getCaptainStats: () => captainApi.get('/stats'),

  // --- FIXED ---
  // Changed from 'captainApi1' to 'captainApi'
  getAllTrips: () => captainApi.get('/trips/all-trips')
};

// Helper to upload a document
export const captainTripApiUploadDocument = (type: string, fileDataUri: string) =>
  captainApi.post(`/documents/${type}`, { file: fileDataUri });
