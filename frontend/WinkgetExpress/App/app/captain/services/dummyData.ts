import type { Trip, Earning, EarningSummary, Captain } from '../types';

export const dummyCaptain: Captain = {
  id: 'captain-001',
  full_name: 'Rajesh Kumar',
  phone: '+91 98765 43210',
  email: 'rajesh.kumar@example.com',
  vehicle_type: 'cab',
  service_scope: 'intra_city',
  is_available: true,
  rating: 4.8,
  total_trips: 347,
  city: 'Mumbai',
};

export const dummyPendingTrips: Trip[] = [
  {
    id: 'trip-001',
    service_type: 'Cab Booking (Intra City)',
    pickup_location: 'Phoenix Marketcity, Kurla West, Mumbai',
    pickup_lat: 19.0883,
    pickup_lng: 72.8887,
    dropoff_location: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai',
    dropoff_lat: 19.0896,
    dropoff_lng: 72.8656,
    distance: 8.5,
    estimated_fare: 320,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'trip-002',
    service_type: 'Cab Booking (Intra City)',
    pickup_location: 'Gateway of India, Colaba, Mumbai',
    pickup_lat: 18.9220,
    pickup_lng: 72.8347,
    dropoff_location: 'Bandra-Worli Sea Link, Bandra West, Mumbai',
    dropoff_lat: 19.0330,
    dropoff_lng: 72.8197,
    distance: 12.3,
    estimated_fare: 450,
    status: 'pending',
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'trip-003',
    service_type: 'Cab Booking (Intra City)',
    pickup_location: 'Powai Lake, Powai, Mumbai',
    pickup_lat: 19.1197,
    pickup_lng: 72.9059,
    dropoff_location: 'Dadar Railway Station, Dadar East, Mumbai',
    dropoff_lat: 19.0176,
    dropoff_lng: 72.8431,
    distance: 15.7,
    estimated_fare: 580,
    status: 'pending',
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
];

export const dummyActiveTrip: Trip = {
  id: 'trip-active-001',
  captain_id: 'captain-001',
  service_type: 'Cab Booking (Intra City)',
  pickup_location: 'Andheri Railway Station, Andheri West, Mumbai',
  pickup_lat: 19.1197,
  pickup_lng: 72.8464,
  dropoff_location: 'Juhu Beach, Juhu, Mumbai',
  dropoff_lat: 19.0990,
  dropoff_lng: 72.8265,
  distance: 6.2,
  estimated_fare: 240,
  actual_fare: 240,
  status: 'accepted',
  otp: '1234',
  started_at: new Date(Date.now() - 180000).toISOString(),
  created_at: new Date(Date.now() - 300000).toISOString(),
};

export const dummyEarnings: Earning[] = [
  {
    id: 'earning-001',
    captain_id: 'captain-001',
    trip_id: 'trip-101',
    amount: 450,
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'earning-002',
    captain_id: 'captain-001',
    trip_id: 'trip-102',
    amount: 320,
    date: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'earning-003',
    captain_id: 'captain-001',
    trip_id: 'trip-103',
    amount: 580,
    date: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'earning-004',
    captain_id: 'captain-001',
    trip_id: 'trip-104',
    amount: 295,
    date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'earning-005',
    captain_id: 'captain-001',
    trip_id: 'trip-105',
    amount: 410,
    date: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'earning-006',
    captain_id: 'captain-001',
    trip_id: 'trip-106',
    amount: 525,
    date: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'earning-007',
    captain_id: 'captain-001',
    trip_id: 'trip-107',
    amount: 380,
    date: new Date(Date.now() - 345600000).toISOString(),
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: 'earning-008',
    captain_id: 'captain-001',
    trip_id: 'trip-108',
    amount: 440,
    date: new Date(Date.now() - 432000000).toISOString(),
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
];

export const dummyEarningSummary: EarningSummary = {
  today: 1350,
  week: 4250,
  month: 18750,
  total: 87340,
};

export const useDummyData = () => {
  return {
    captain: dummyCaptain,
    pendingTrips: dummyPendingTrips,
    activeTrip: dummyActiveTrip,
    earnings: dummyEarnings,
    earningSummary: dummyEarningSummary,
  };
};
