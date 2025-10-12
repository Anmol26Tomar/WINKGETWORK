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
  to: { lat: number; lng: number },
  mode: 'driving' | 'walking' = 'driving'
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  try {
    // Use Google Maps Directions API as primary
    const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleApiKey && googleApiKey !== '<YOUR_GOOGLE_MAPS_API_KEY>') {
      return await getGoogleDirections(from, to, googleApiKey, mode);
    }

    // Fallback to MAPTILER if Google not available
    if (MAPTILER_KEY && MAPTILER_KEY !== '<YOUR_MAPTILER_API_KEY>') {
      return await getMaptilerDirections(from, to);
    }

    // Final fallback to enhanced route calculation
    console.warn('No routing API configured, using enhanced fallback');
    return getEnhancedFallbackRoute(from, to);
  } catch (error) {
    console.warn('Error fetching route:', error);
    return getEnhancedFallbackRoute(from, to);
  }
}

// Get route from captain's current location to pickup
export async function getCaptainToPickupRoute(
  captainLocation: { lat: number; lng: number },
  pickupLocation: { lat: number; lng: number }
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  return getRoutePolyline(captainLocation, pickupLocation, 'driving');
}

// Get route from pickup to destination
export async function getPickupToDestinationRoute(
  pickupLocation: { lat: number; lng: number },
  destinationLocation: { lat: number; lng: number }
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  return getRoutePolyline(pickupLocation, destinationLocation, 'driving');
}

// Google Maps Directions API
async function getGoogleDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  apiKey: string,
  mode: 'driving' | 'walking' = 'driving'
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  const origin = `${from.lat},${from.lng}`;
  const destination = `${to.lat},${to.lng}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&mode=${mode}&traffic_model=best_guess&departure_time=now`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK' || !data.routes?.[0]) {
    throw new Error('Google Directions API failed');
  }
  
  const route = data.routes[0];
  const leg = route.legs[0];
  
  // Decode polyline
  const coordinates = decodePolyline(route.overview_polyline.points);
  
  return {
    coordinates: coordinates.map(coord => [coord.lng, coord.lat]),
    distance: leg.distance.value,
    duration: leg.duration.value,
  };
}

// MAPTILER Directions API
async function getMaptilerDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ coordinates: [number, number][]; distance: number; duration: number }> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${MAPTILER_BASE_URL}/${MAPTILER_PROFILE}/${coords}?key=${MAPTILER_KEY}&geometries=geojson&overview=full`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('MAPTILER API failed');
  }
  
  const data = await response.json();
  const route = data?.routes?.[0];
  
  if (!route) {
    throw new Error('No route found in MAPTILER response');
  }
  
  return {
    coordinates: route?.geometry?.coordinates || [],
    distance: route?.distance || 0,
    duration: route?.duration || 0,
  };
}

// Enhanced fallback route with realistic path simulation
function getEnhancedFallbackRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): { coordinates: [number, number][]; distance: number; duration: number } {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightDistance = R * c * 1000; // Convert to meters

  // Add realistic road factor (roads are typically 1.3-1.5x longer than straight line)
  const roadFactor = 1.4;
  const distance = straightDistance * roadFactor;

  // Create a more realistic curved route with intermediate waypoints
  const coordinates: [number, number][] = [];
  const steps = 20; // More points for smoother curve
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    
    // Add slight curve to simulate road path
    const curveOffset = Math.sin(ratio * Math.PI) * 0.001; // Small curve
    const lat = from.lat + (to.lat - from.lat) * ratio + curveOffset;
    const lng = from.lng + (to.lng - from.lng) * ratio;
    
    coordinates.push([lng, lat]);
  }

  // Estimate duration based on distance and realistic city speeds
  const avgSpeedKmh = 25; // Realistic city speed
  const duration = (distance / 1000) / avgSpeedKmh * 3600; // Convert to seconds

  return {
    coordinates,
    distance,
    duration,
  };
}

// Decode Google Maps polyline
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return poly;
}
