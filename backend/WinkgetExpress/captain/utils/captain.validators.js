/**
 * Get valid services for a given vehicle type based on business rules
 */
function getValidServicesForVehicle(vehicleType) {
  switch (vehicleType) {
    case 'bike':
      return ['local_parcel', 'bike_ride'];
    case 'truck':
      return ['intra_truck', 'all_india_parcel', 'packers_movers'];
    case 'cab':
      return ['cab_booking'];
    default:
      return [];
  }
}

/**
 * Validate if a captain can offer specific services based on their vehicle type
 */
function validateServicesForVehicle(vehicleType, servicesOffered) {
  const validServices = getValidServicesForVehicle(vehicleType);
  return servicesOffered.every(service => validServices.includes(service));
}

module.exports = {
  getValidServicesForVehicle,
  validateServicesForVehicle
};

