# Captain Trip Controller - Multi-Model Support Update

## Overview
Updated the captain trip controller to search across all models (Transport, Parcel, PackersMove) and filter by service type and vehicle subtype, ensuring proper captain-request matching.

## Key Changes Made

### 1. **Multi-Model Search Implementation**
- **Added imports** for all models: `Transport`, `Parcel`, `PackersMove`
- **Updated `listNearbyTrips`** to search across all three models simultaneously
- **Implemented service type filtering** based on captain's capabilities
- **Added vehicle subtype matching** for precise captain-request pairing

### 2. **Enhanced Trip Filtering Logic**
```javascript
// Service type mapping
- Parcel → 'local_parcel' service
- Packers → 'packers_movers' service  
- Transport → 'bike_ride' or 'cab_booking' service

// Vehicle type matching
- Captain vehicle type must match request vehicle type
- Vehicle subtype must match (if specified)
- Captain must offer the required service
```

### 3. **Updated All Controller Functions**

#### `listNearbyTrips`
- **Searches all models** in parallel using `Promise.all`
- **Filters by distance** using Haversine formula
- **Filters by service compatibility** with captain's capabilities
- **Returns standardized response** with trip type and service-specific data
- **Sorts by distance** and limits to 20 results

#### `acceptTrip`
- **Added trip type parameter** (`:type/:id/accept`)
- **Handles all model types** with switch statement
- **Atomic updates** to prevent race conditions
- **Generates OTPs** for pickup and drop verification
- **Returns standardized response** with trip details

#### `reachedPickup`
- **Updated for all model types** with proper status transitions
- **Validates captain ownership** of the trip
- **Updates status** to 'in_transit'
- **Returns trip details** with standardized format

#### `verifyTripOtp`
- **Handles all model types** for OTP verification
- **Supports pickup and drop phases**
- **Updates trip status** based on verification phase
- **Returns success status** with trip details

#### `reachedDestination`
- **Updated for all model types**
- **Completes trip** with 'delivered' status
- **Returns payment information**
- **Provides trip completion details**

#### `resendOtp`
- **Supports all model types**
- **Generates new OTP** for specified phase
- **Updates appropriate OTP hash** in database
- **Returns new OTP** to captain

### 4. **Updated Route Structure**
```javascript
// New route format with trip type
POST /api/v1/captain/trips/:type/:id/accept
POST /api/v1/captain/trips/:type/:id/reached-pickup
POST /api/v1/captain/trips/:type/:id/verify-otp
POST /api/v1/captain/trips/:type/:id/reached-destination
POST /api/v1/captain/trips/:type/:id/resend-otp

// Trip types: 'transport', 'parcel', 'packers'
```

### 5. **Standardized Response Format**
All responses now include:
```javascript
{
  success: boolean,
  message: string,
  trip: {
    id: string,
    type: 'transport' | 'parcel' | 'packers',
    pickup: { lat, lng, address },
    delivery: { lat, lng, address },
    vehicleType: string,
    vehicleSubType: string,
    fareEstimate: number,
    status: string,
    // Service-specific fields
  },
  // Additional data as needed
}
```

### 6. **Enhanced Logging**
- **Added comprehensive logging** for all operations
- **Tracks captain actions** with trip IDs and types
- **Logs service matching** and filtering decisions
- **Error logging** with context information

## API Usage Examples

### Search for Nearby Trips
```bash
GET /api/v1/captain/trips/nearby-trips?lat=12.9716&lng=77.5946&radius=5
```

### Accept a Trip
```bash
POST /api/v1/captain/trips/transport/64f8a1b2c3d4e5f6a7b8c9d0/accept
POST /api/v1/captain/trips/parcel/64f8a1b2c3d4e5f6a7b8c9d1/accept
POST /api/v1/captain/trips/packers/64f8a1b2c3d4e5f6a7b8c9d2/accept
```

### Update Trip Status
```bash
POST /api/v1/captain/trips/transport/64f8a1b2c3d4e5f6a7b8c9d0/reached-pickup
POST /api/v1/captain/trips/parcel/64f8a1b2c3d4e5f6a7b8c9d1/verify-otp
POST /api/v1/captain/trips/packers/64f8a1b2c3d4e5f6a7b8c9d2/reached-destination
```

## Benefits

1. **Unified Search**: Captains can see all available trips across all services
2. **Precise Matching**: Only shows trips that match captain's vehicle and service capabilities
3. **Consistent API**: All trip types use the same endpoint structure
4. **Better UX**: Captains get relevant trips only, reducing confusion
5. **Scalable**: Easy to add new service types in the future
6. **Maintainable**: Centralized logic for all trip operations

## Frontend Integration

The frontend should now:
1. **Call the updated endpoints** with trip type parameters
2. **Handle the standardized response format** across all trip types
3. **Display service-specific information** based on trip type
4. **Update trip status** using the new route structure

## Testing

To test the implementation:
1. Create trips in each model (Transport, Parcel, PackersMove)
2. Search for nearby trips as a captain
3. Verify only compatible trips are returned
4. Test accepting trips of different types
5. Verify status updates work across all models
6. Test OTP verification for all trip types

This update ensures smooth captain-request matching across all service types while maintaining backward compatibility and providing a consistent API experience.
