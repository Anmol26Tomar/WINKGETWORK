import { ServiceScope, ServiceType, VehicleType } from "../types";

export interface ServiceConfig {
  id: ServiceType;
  name: string;
  description: string;
  allowedVehicles: VehicleType[];
  allowedScopes: ServiceScope[];
  requiresPickupOtp: boolean;
  requiresDropOtp: boolean;
  requiresPaymentBeforeTrip: boolean;
  requiresPaymentAfterPickup: boolean;
  workflow: 'pickup_pay_deliver' | 'accept_pay_pickup_deliver' | 'pickup_deliver_pay';
}

export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  local_parcel: {
    id: 'local_parcel',
    name: 'Local Parcel Delivery',
    description: 'Local parcel delivery service',
    allowedVehicles: ['bike'],
    allowedScopes: ['intra_city'],
    requiresPickupOtp: true,
    requiresDropOtp: true,
    requiresPaymentBeforeTrip: false,
    requiresPaymentAfterPickup: true,
    workflow: 'pickup_pay_deliver',
  },
  bike_ride: {
    id: 'bike_ride',
    name: 'Bike Ride',
    description: 'Bike taxi service',
    allowedVehicles: ['bike'],
    allowedScopes: ['intra_city'],
    requiresPickupOtp: true,
    requiresDropOtp: true,
    requiresPaymentBeforeTrip: false,
    requiresPaymentAfterPickup: false,
    workflow: 'pickup_deliver_pay',
  },
  intra_city_truck: {
    id: 'intra_city_truck',
    name: 'Intra City Truck Booking',
    description: 'Book trucks for local transport',
    allowedVehicles: ['truck'],
    allowedScopes: ['intra_city'],
    requiresPickupOtp: true,
    requiresDropOtp: false,
    requiresPaymentBeforeTrip: true,
    requiresPaymentAfterPickup: false,
    workflow: 'accept_pay_pickup_deliver',
  },
  cab_booking: {
    id: 'cab_booking',
    name: 'Cab Booking',
    description: 'Book cabs for rides',
    allowedVehicles: ['cab'],
    allowedScopes: ['intra_city', 'inter_city', 'both'],
    requiresPickupOtp: true,
    requiresDropOtp: true,
    requiresPaymentBeforeTrip: false,
    requiresPaymentAfterPickup: false,
    workflow: 'pickup_deliver_pay',
  },
  all_india_parcel: {
    id: 'all_india_parcel',
    name: 'All India Parcel',
    description: 'Intercity parcel delivery',
    allowedVehicles: ['truck'],
    allowedScopes: ['inter_city'],
    requiresPickupOtp: true,
    requiresDropOtp: true,
    requiresPaymentBeforeTrip: false,
    requiresPaymentAfterPickup: true,
    workflow: 'pickup_pay_deliver',
  },
  packers_movers: {
    id: 'packers_movers',
    name: 'Packers & Movers',
    description: 'Household and office relocation',
    allowedVehicles: ['truck'],
    allowedScopes: ['inter_city'],
    requiresPickupOtp: true,
    requiresDropOtp: false,
    requiresPaymentBeforeTrip: true,
    requiresPaymentAfterPickup: false,
    workflow: 'accept_pay_pickup_deliver',
  },
};

export function getEligibleServices(
  vehicleType: VehicleType,
  serviceScope: ServiceScope
): ServiceType[] {
  const eligible: ServiceType[] = [];

  Object.values(SERVICE_CONFIGS).forEach((config) => {
    const vehicleMatch = config.allowedVehicles.includes(vehicleType);
    const scopeMatch =
      config.allowedScopes.includes(serviceScope) ||
      config.allowedScopes.includes('both') ||
      serviceScope === 'both';

    if (vehicleMatch && scopeMatch) {
      eligible.push(config.id);
    }
  });

  return eligible;
}

export function getServiceConfig(serviceType: ServiceType): ServiceConfig {
  return SERVICE_CONFIGS[serviceType];
}

export function canProvideService(
  captain: { vehicle_type: VehicleType; service_scope: ServiceScope },
  serviceType: ServiceType
): boolean {
  const config = SERVICE_CONFIGS[serviceType];
  const vehicleMatch = config.allowedVehicles.includes(captain.vehicle_type);
  const scopeMatch =
    config.allowedScopes.includes(captain.service_scope) ||
    config.allowedScopes.includes('both') ||
    captain.service_scope === 'both';

  return vehicleMatch && scopeMatch;
}

// Default export for Expo Router
export default function ServiceConfigRoute() { return null as any; }