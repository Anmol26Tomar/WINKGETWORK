import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed secureStore import - using AsyncStorage instead
import { 
  API_BASE_URL, 
  API_ENDPOINTS, 
  MAPTILER_BASE_URL, 
  MAPTILER_PROFILE, 
  MAPTILER_KEY 
} from '../constants/api';
import type {
  LoginCredentials,
  SignupData,
  OTPVerification,
  Captain,
  Trip,
  Earning,
  EarningSummary,
} from '../types';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
      const { data } = await api.post(API_ENDPOINTS.LOGIN, credentials);
      if (data.token) await AsyncStorage.setItem('token', data.token);
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  signup: async (data: SignupData) => {
    try {
      const { data: res } = await api.post(API_ENDPOINTS.SIGNUP, data);
      if (res.token) await AsyncStorage.setItem('token', res.token);
      return res;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  verifyOTP: async (data: OTPVerification) => {
    try {
      const { data: res } = await api.post(API_ENDPOINTS.VERIFY_OTP, data);
      if (!res.success) throw new Error(res.message || 'OTP verification failed');
      if (res.token) await AsyncStorage.setItem('token', res.token);
      return res;
    } catch (error: any) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  resendOTP: async (phone: string) => {
    const { data } = await api.post(API_ENDPOINTS.RESEND_OTP, { phone });
    return data;
  },

  getProfile: async (): Promise<Captain> => {
    const { data } = await api.get(API_ENDPOINTS.GET_CAPTAIN_PROFILE);
    return data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['captain_data', 'pending_captain_phone']);
  },
};

// ========================
// CAPTAIN SERVICE
// ========================
export const captainService = {
  getProfile: async (): Promise<Captain> => {
    const { data } = await api.get(API_ENDPOINTS.GET_CAPTAIN_PROFILE);
    return data;
  },

  updateProfile: async (data: Partial<Captain>): Promise<Captain> => {
    const { data: res } = await api.put(API_ENDPOINTS.UPDATE_CAPTAIN_PROFILE, data);
    return res;
  },

  updateAvailability: async (isAvailable: boolean): Promise<void> => {
    await api.put(API_ENDPOINTS.UPDATE_AVAILABILITY, { is_available: isAvailable });
  },
};

// ========================
// TRIP SERVICE
// ========================
export const tripService = {
  getPendingRequests: async (
    lat?: number,
    lng?: number,
    opts?: { vehicleType?: string; serviceType?: string; vehicleSubType?: string }
  ): Promise<Trip[]> => {
    const { data } = await api.get(API_ENDPOINTS.GET_PENDING_REQUESTS, {
      params: { lat, lng, rangeKm: 10, vehicleType: opts?.vehicleType, serviceType: opts?.serviceType, vehicleSubType: opts?.vehicleSubType },
    });
    console.log("pending requests",data);
    return data.orders as Trip[];
  },

  getActiveTrip: async (): Promise<Trip | null> => {
    const { data } = await api.get(API_ENDPOINTS.GET_ACTIVE_TRIP);
    return data;
  },

  acceptTrip: async (tripId: string): Promise<Trip> => {
    const url = API_ENDPOINTS.ACCEPT_TRIP.replace(':id', tripId);
    const { data } = await api.post(url);
    return data.parcel as Trip;
  },

  reachTrip: async (tripId: string): Promise<void> => {
    const url = API_ENDPOINTS.REACH_TRIP.replace(':id', tripId);
    await api.post(url);
  },

  reachDestination: async (tripId: string): Promise<void> => {
    const url = API_ENDPOINTS.REACH_DEST.replace(':id', tripId);
    await api.post(url);
  },

  verifyPickupOtp: async (tripId: string, code: string): Promise<void> => {
    const url = API_ENDPOINTS.VERIFY_PICKUP_OTP.replace(':id', tripId);
    await api.post(url, { code });
  },

  rejectTrip: async (tripId: string, reason: string): Promise<void> => {
    const url = API_ENDPOINTS.REJECT_TRIP.replace(':id', tripId);
    await api.post(url, { reason });
  },

  startTrip: async (tripId: string): Promise<Trip> => {
    const url = API_ENDPOINTS.START_TRIP.replace(':id', tripId);
    const { data } = await api.post(url);
    return data;
  },

  endTrip: async (tripId: string, otp: string): Promise<Trip> => {
    const url = API_ENDPOINTS.END_TRIP.replace(':id', tripId);
    const { data } = await api.post(url, { code: otp });
    return data;
  },

  cancelTrip: async (tripId: string, reason: string): Promise<void> => {
    const url = API_ENDPOINTS.CANCEL_TRIP.replace(':id', tripId);
    await api.post(url, { reason });
  },
};

// ========================
// EARNINGS SERVICE
// ========================
export const earningsService = {
  getEarnings: async (startDate?: string, endDate?: string): Promise<Earning[]> => {
    const { data } = await api.get(API_ENDPOINTS.GET_EARNINGS, { params: { start_date: startDate, end_date: endDate } });
    return data;
  },

  getSummary: async (): Promise<EarningSummary> => {
    const { data } = await api.get(API_ENDPOINTS.GET_EARNINGS_SUMMARY);
    return data;
  },
};

export default api;

// ========================
// MAP/DIRECTIONS SERVICE
// ========================
export async function getRoutePolyline(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${MAPTILER_BASE_URL}/${MAPTILER_PROFILE}/${coords}?key=${MAPTILER_KEY}&geometries=geojson&overview=full`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch directions');
  const data = await res.json();
  const route = data?.routes?.[0];
  return {
    coordinates: route?.geometry?.coordinates || [],
    distance: route?.distance || 0,
    duration: route?.duration || 0,
  };
}
