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
export type ServiceScope = 'intra_city' | 'inter_city';
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
  full_name: string;
  phone: string;
  email: string;
  vehicle_type: VehicleType;
  vehicle_subtype?: VehicleSubtype;
  service_scope: ServiceScope;
  is_available: boolean;
  rating: number;
  total_trips: number;
  city?: string;
}

export interface Trip {
  id: string;
  captain_id?: string;
  service_type: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance: number;
  estimated_fare: number;
  actual_fare?: number;
  status: TripStatus;
  otp?: string;
  pickup_otp?: string;
  pickup_otp_verified?: boolean;
  order_details?: OrderDetails;
  cancel_reason?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Earning {
  id: string;
  captain_id: string;
  trip_id: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface EarningSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface LoginCredentials {
  email: string;
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
  confirm_Password:string;
  city: string;
}

export interface OTPVerification {
  phone: string;
  otp: string;
}
