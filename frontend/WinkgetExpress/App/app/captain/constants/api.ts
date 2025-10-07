export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:5000/api';
// Toggle this to true to use built-in dummy data without a backend
export const USE_MOCK_API = true;
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  LOGOUT: '/auth/logout',
  GET_CAPTAIN_PROFILE: '/captain/profile',
  UPDATE_CAPTAIN_PROFILE: '/captain/profile',
  UPDATE_AVAILABILITY: '/captain/availability',
  GET_PENDING_REQUESTS: '/trips/pending',
  GET_ACTIVE_TRIP: '/trips/active',
  ACCEPT_TRIP: '/trips/accept',
  REJECT_TRIP: '/trips/reject',
  START_TRIP: '/trips/start',
  END_TRIP: '/trips/end',
  CANCEL_TRIP: '/trips/cancel',
  GET_EARNINGS: '/earnings',
  GET_EARNINGS_SUMMARY: '/earnings/summary',
};
