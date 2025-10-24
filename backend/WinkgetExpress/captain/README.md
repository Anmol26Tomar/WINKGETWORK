# Captain Module API Documentation

## Overview
This module implements a complete Rapido-Captain-inspired captain system with real-time trip management, OTP verification, and socket-based communication.

## Environment Variables Required
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `OTP_EXPIRY_SEC`: OTP expiry time in seconds (default: 300)

## API Endpoints

### Authentication Endpoints

#### POST `/api/v1/captain/auth/signup`
Register a new captain.

**Request Body:**
```json
{
  "name": "Captain Name",
  "phone": "9876543210",
  "password": "password123",
  "vehicleType": "bike",
  "vehicleSubType": "bike_standard",
  "servicesOffered": ["local_parcel", "bike_ride"],
  "city": "Mumbai"
}
```

**Response:**
```json
{
  "message": "Captain registered successfully",
  "token": "jwt_token_here",
  "captain": {
    "id": "captain_id",
    "name": "Captain Name",
    "phone": "9876543210",
    "vehicleType": "bike",
    "vehicleSubType": "bike_standard",
    "servicesOffered": ["local_parcel", "bike_ride"],
    "isApproved": false
  }
}
```

#### POST `/api/v1/captain/auth/login-password`
Login with phone and password.

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "password123"
}
```

#### POST `/api/v1/captain/auth/login-otp-request`
Request OTP for phone-based login.

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

#### POST `/api/v1/captain/auth/login-otp-verify`
Verify OTP and complete login.

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### Trip Management Endpoints

All trip endpoints require authentication via `Authorization: Bearer <token>` header.

#### GET `/api/v1/captain/trips/nearby-trips`
Get nearby available trips.

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Search radius in km (optional, default: 10)

#### POST `/api/v1/captain/trips/:id/accept`
Accept a trip (first-accept-wins).

#### POST `/api/v1/captain/trips/:id/reached-pickup`
Mark that captain has reached pickup location.

#### POST `/api/v1/captain/trips/:id/verify-otp`
Verify pickup or drop OTP.

**Request Body:**
```json
{
  "otp": "123456",
  "phase": "pickup" // or "drop"
}
```

#### POST `/api/v1/captain/trips/:id/reached-destination`
Mark that captain has reached destination.

#### POST `/api/v1/captain/trips/:id/resend-otp`
Resend OTP for pickup or drop.

**Request Body:**
```json
{
  "phase": "pickup" // or "drop"
}
```

## Socket Events

### Captain Namespace (`/captain`)

#### Connection
Captains connect to `/captain` namespace with JWT token in `auth.token`.

#### Events Emitted to Captain:
- `trip:assigned`: New trip assigned to captain
- `trip:cancelled`: Trip cancelled or taken by another captain
- `locationUpdated`: Confirmation of location update

#### Events Captain Can Emit:
- `updateLocation`: Update captain's current location
- `tripAccepted`: Confirm trip acceptance
- `tripCompleted`: Mark trip as completed

## Business Rules

### Vehicle Type Constraints:
- **Bike**: Can only offer `local_parcel`, `bike_ride`
- **Truck**: Can offer `intra_truck`, `all_india_parcel`, `packers_movers`
- **Cab**: Can only offer `cab_booking`

### Trip Lifecycle:
1. `pending_assignment` → `assigned` (admin assigns)
2. `assigned` → `accepted` (captain accepts)
3. `accepted` → `payment_confirmed` (user pays)
4. `payment_confirmed` → `enroute_pickup` (captain starts)
5. `enroute_pickup` → `at_pickup` (captain reaches pickup)
6. `at_pickup` → `enroute_drop` (OTP verified)
7. `enroute_drop` → `at_destination` (captain reaches destination)
8. `at_destination` → `completed` (OTP verified or payment confirmed)

## Error Codes
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid token)
- `404`: Not Found (captain/trip not found)
- `500`: Internal Server Error

