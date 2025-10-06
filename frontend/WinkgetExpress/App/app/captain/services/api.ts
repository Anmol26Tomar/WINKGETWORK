import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import type {
  LoginCredentials,
  SignupData,
  OTPVerification,
  Captain,
  Trip,
  Earning,
  EarningSummary,
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach auth token if present
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========================
// AUTH SERVICE
// ========================
export const authService = {
  login: async (credentials: LoginCredentials) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    if (response.data.token) await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, message: error.response?.data?.message || error.message };
  }
},

  signup: async (data: SignupData) => {
    const response = await api.post(API_ENDPOINTS.SIGNUP, data);
    return response.data;
  },

  verifyOTP: async (data: OTPVerification) => {
    const response = await api.post(API_ENDPOINTS.VERIFY_OTP, data);
    if (response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  resendOTP: async (phone: string) => {
    const response = await api.post(API_ENDPOINTS.RESEND_OTP, { phone });
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('captain_data');
  },
};

// ========================
// CAPTAIN SERVICE
// ========================
export const captainService = {
  getProfile: async (): Promise<Captain> => {
    const response = await api.get(API_ENDPOINTS.GET_CAPTAIN_PROFILE);
    return response.data;
  },

  updateProfile: async (data: Partial<Captain>): Promise<Captain> => {
    const response = await api.put(API_ENDPOINTS.UPDATE_CAPTAIN_PROFILE, data);
    return response.data;
  },

  updateAvailability: async (isAvailable: boolean): Promise<void> => {
    await api.put(API_ENDPOINTS.UPDATE_AVAILABILITY, { is_available: isAvailable });
  },
};

// ========================
// TRIP SERVICE
// ========================
export const tripService = {
  getPendingRequests: async (): Promise<Trip[]> => {
    const response = await api.get(API_ENDPOINTS.GET_PENDING_REQUESTS);
    return response.data;
  },

  getActiveTrip: async (): Promise<Trip | null> => {
    const response = await api.get(API_ENDPOINTS.GET_ACTIVE_TRIP);
    return response.data;
  },

  acceptTrip: async (tripId: string): Promise<Trip> => {
    const response = await api.post(API_ENDPOINTS.ACCEPT_TRIP, { trip_id: tripId });
    return response.data;
  },

  rejectTrip: async (tripId: string, reason: string): Promise<void> => {
    await api.post(API_ENDPOINTS.REJECT_TRIP, { trip_id: tripId, reason });
  },

  startTrip: async (tripId: string): Promise<Trip> => {
    const response = await api.post(API_ENDPOINTS.START_TRIP, { trip_id: tripId });
    return response.data;
  },

  endTrip: async (tripId: string, otp: string): Promise<Trip> => {
    const response = await api.post(API_ENDPOINTS.END_TRIP, { trip_id: tripId, otp });
    return response.data;
  },

  cancelTrip: async (tripId: string, reason: string): Promise<void> => {
    await api.post(API_ENDPOINTS.CANCEL_TRIP, { trip_id: tripId, reason });
  },
};

// ========================
// EARNINGS SERVICE
// ========================
export const earningsService = {
  getEarnings: async (startDate?: string, endDate?: string): Promise<Earning[]> => {
    const response = await api.get(API_ENDPOINTS.GET_EARNINGS, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getSummary: async (): Promise<EarningSummary> => {
    const response = await api.get(API_ENDPOINTS.GET_EARNINGS_SUMMARY);
    return response.data;
  },
};

export default api;
