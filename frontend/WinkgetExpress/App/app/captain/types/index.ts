export type VehicleType = 'bike' | 'cab' | 'truck';
export type VehicleSubtype =
  | 'bike_standard'
  | 'cab_sedan'
  | 'cab_suv'
  | 'cab_hatchback'
  | 'truck_3wheeler'
  | 'truck_mini_van'
  | 'truck_pickup'
  | 'truck_full_size';
export type ServiceScope = 'intra_city' | 'inter_city' | 'both';
export type ServiceType =
  | 'local_parcel'
  | 'intra_city_truck'
  | 'all_india_parcel'
  | 'cab_booking'
  | 'bike_ride'
  | 'packers_movers';
export type TripStatus = 'pending' | 'accepted' | 'reached_pickup' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderDetails {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  packageType?: string;
  fragile?: boolean;
  specialInstructions?: string;
  passengers?: number;
}

export interface Captain {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleSubType?: VehicleSubtype;
  serviceType: ServiceScope;
  serviceTypes?: ServiceType[];
  isAvailable: boolean;
  rating: number;
  totalTrips: number;
  city?: string;
  isApproved?: boolean;
  licenseVerified?: boolean;
  vehicleVerified?: boolean;
  panVerified?: boolean;
  aadharVerified?: boolean;
}

export interface Parcel {
  id: string;
  _id?: string;
  userRef: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  delivery: {
    lat: number;
    lng: number;
    address: string;
  };
  package: {
    name: string;
    size: string;
    weight: number;
    description?: string;
    value?: number;
  };
  receiverName: string;
  receiverContact: string;
  vehicleType: string;
  fareEstimate: number;
  accepted: boolean;
  captainRef?: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  otp?: {
    code?: string;
    expiresAt?: string;
    verified?: boolean;
    attempts?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  _id?: string;
  captainRef?: string;
  serviceType?: string;
  vehicleType?: string;
  type?: 'transport' | 'parcel';
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  destination?: {
    lat: number;
    lng: number;
    address: string;
  };
  delivery?: {
    lat: number;
    lng: number;
    address: string;
  };
  distanceKm?: number;
  distance?: number;
  fareEstimate?: number;
  fare?: number;
  estimatedFare?: number;
  actualFare?: number;
  status: TripStatus;
  otp?: {
    code?: string;
    expiresAt?: string;
    verified?: boolean;
  };
  completionOtp?: string;
  pickupOtp?: string;
  pickupOtpVerified?: boolean;
  orderDetails?: OrderDetails;
  package?: {
    name: string;
    size: string;
    weight: number;
    description?: string;
    value?: number;
  };
  receiverName?: string;
  receiverContact?: string;
  cancelReason?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  userRef?: {
    name: string;
    phone: string;
  };
}

export interface Earning {
  id: string;
  captain_id: string;
  trip_id: string;
  amount: number;
  date: string;
  created_at: string;
  type?: 'transport' | 'parcel';
}

export interface EarningSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface SignupData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type: VehicleType;
  vehicle_subtype?: VehicleSubtype;
  service_scope: ServiceScope;
  service_types?: ServiceType[];
  confirm_Password: string;
  city: string;
}

export interface OTPVerification {
  phone: string;
  otp: string;
}

// Default export to appease Expo Router route resolution
export default function CaptainTypesRoute() { return null as any; }
