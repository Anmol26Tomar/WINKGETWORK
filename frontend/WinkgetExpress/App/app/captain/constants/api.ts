export const DEFAULT_API_BASE = 'http://172.20.49.88:3001/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE
  ? `${process.env.EXPO_PUBLIC_API_BASE.replace(/\/$/, '')}/api`
  : DEFAULT_API_BASE;

// Toggle this to true to use built-in dummy data without a backend
export const USE_MOCK_API = false;

export const MAPTILER_BASE_URL = 'https://api.maptiler.com/directions';
export const MAPTILER_PROFILE = 'driving';
export const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || '<YOUR_MAPTILER_API_KEY>';

export const API_ENDPOINTS = {
  LOGIN: '/auth/agent/captainlogin',
  SIGNUP: '/auth/agent/captainsignup',
  VERIFY_OTP: '/auth/agent/verify-signup-otp',
  RESEND_OTP: '/auth/agent/resend-otp',
  LOGOUT: '/auth/logout',
  GET_CAPTAIN_PROFILE: '/auth/agent/profile',
  UPDATE_CAPTAIN_PROFILE: '/auth/agent/profile',
  UPDATE_AVAILABILITY: '/auth/agent/availability',
  GET_PENDING_REQUESTS: '/auth/agent/orders/nearby',
  GET_ACTIVE_TRIP: '/auth/agent/orders/active',
  ACCEPT_TRIP: '/auth/agent/orders/:id/accept',
  REACH_TRIP: '/auth/agent/orders/:id/reached',
  REACH_DEST: '/auth/agent/orders/:id/reached-destination',
  VERIFY_PICKUP_OTP: '/auth/agent/orders/:id/verify-otp',
  REJECT_TRIP: '/auth/agent/orders/:id/reject',
  START_TRIP: '/auth/agent/orders/:id/start',
  END_TRIP: '/auth/agent/orders/:id/complete',
  CANCEL_TRIP: '/auth/agent/orders/:id/cancel',
  GET_EARNINGS: '/auth/agent/earnings',
  GET_EARNINGS_SUMMARY: '/auth/agent/earnings/summary',
} as const;

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

export function getApiBase(): string {
  return API_BASE_URL;
}

export function resolveEndpoint<K extends ApiEndpointKey>(key: K, params?: Record<string, string | number>): string {
  let path = API_ENDPOINTS[key] as string;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      path = path.replace(`:${k}`, encodeURIComponent(String(v)));
    });
  }
  return `${getApiBase()}${path}`;
}

// Default export to appease Expo Router route resolution
export default function CaptainConstantsRoute() { return null as any; }
