# Environment Configuration for WinkgetExpress

This document explains how to configure the environment variables for the WinkgetExpress application.

## Backend Configuration

### Location
- .env file: ackend/.env
- Example file: ackend/.env.example

### Required Variables
1. **PORT**: Server port (default: 5000)
2. **SERVER_IP**: Server IP address (default: localhost)
3. **MONGO_URI**: MongoDB connection string
4. **JWT_SECRET**: Secret key for JWT tokens
5. **CORS_ORIGIN**: Allowed origins for CORS (comma-separated)

### Setup Instructions
1. Copy ackend/.env.example to ackend/.env
2. Update the values in ackend/.env with your actual configuration
3. Replace localhost with your actual IP address in SERVER_IP

## Frontend Configuration

### Location
- .env file: rontend/WinkgetExpress/App/.env
- Example file: rontend/WinkgetExpress/App/.env.example

### Required Variables
1. **EXPO_PUBLIC_API_BASE**: Backend API URL (e.g., http://YOUR_IP:5000)
2. **EXPO_PUBLIC_SOCKET_URL**: Socket.IO server URL (e.g., http://YOUR_IP:5000)

### Setup Instructions
1. Copy rontend/WinkgetExpress/App/.env.example to rontend/WinkgetExpress/App/.env
2. Update EXPO_PUBLIC_API_BASE with your backend IP and port
3. Update EXPO_PUBLIC_SOCKET_URL with your backend IP and port

## Example Configuration

### For Local Development
`ash
# Backend .env
SERVER_IP=localhost
PORT=5000
EXPO_PUBLIC_API_BASE=http://localhost:5000
`

### For Network Access
`ash
# Backend .env
SERVER_IP=192.168.1.100
PORT=5000

# Frontend .env
EXPO_PUBLIC_API_BASE=http://192.168.1.100:5000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:5000
`

## Starting the Application

1. **Backend**: 
   `ash
   cd backend
   npm install
   npm start
   `

2. **Frontend**:
   `ash
   cd frontend/WinkgetExpress/App
   npm install
   npm start
   `

## Important Notes

- Make sure your IP address is accessible from the devices you want to test on
- Update firewall settings if necessary
- For mobile testing, ensure the IP is accessible from your mobile device's network
- The frontend uses Expo, so make sure Expo CLI is installed globally
