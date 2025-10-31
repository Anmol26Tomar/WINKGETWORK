import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || API_CONFIG.BASE_URL;

// Get socket URL - preserve user's protocol choice
const getSocketUrl = () => {
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    return API_BASE;
  }
  // Only add protocol if missing (shouldn't happen if env var is set correctly)
  console.warn('⚠️ API_BASE missing protocol, defaulting to https://');
  return `https://${API_BASE}`;
};

let socket: Socket | null = null;

export const connectSocket = async (token?: string): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  try {
    // Get token from parameter or SecureStore
    const authToken = token || await SecureStore.getItemAsync('captainToken');
    if (!authToken) {
      throw new Error('No captain token found');
    }

    // For Vercel/serverless: try websocket first, fallback to polling
    // This ensures compatibility with platforms that don't support WebSockets
    const socketUrl = `${getSocketUrl()}/captain`;
    console.log('🔌 Connecting to socket URL:', socketUrl);
    
    socket = io(socketUrl, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      upgrade: true, // Allow transport upgrades
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Captain socket connected:', socket?.id, 'Transport:', socket?.io?.engine?.transport?.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️ Captain socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Captain socket connection error:', error.message);
      // Don't throw - let Socket.IO handle reconnection
    });

    socket.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect socket...');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after all attempts');
    });

    return socket;
  } catch (error) {
    console.error('Error connecting captain socket:', error);
    throw error;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

// Socket event handlers
export const setupSocketListeners = (socket: Socket, handlers: {
  onTripAssigned?: (trip: any) => void;
  onTripCancelled?: (data: any) => void;
  onLocationUpdated?: (data: any) => void;
}) => {
  socket.on('trip:assigned', (trip) => {
    console.log('Trip assigned:', trip);
    handlers.onTripAssigned?.(trip);
  });

  socket.on('new-trip', (trip) => {
    console.log('New trip (broadcast):', trip);
    handlers.onTripAssigned?.(trip);
  });

  socket.on('trip:cancelled', (data) => {
    console.log('Trip cancelled:', data);
    handlers.onTripCancelled?.(data);
  });

  socket.on('locationUpdated', (data) => {
    console.log('Location updated:', data);
    handlers.onLocationUpdated?.(data);
  });
};

// Socket event emitters
export const emitLocationUpdate = (socket: Socket, coords: { lat: number; lng: number }) => {
  socket.emit('updateLocation', coords);
};

export const emitTripAccepted = (socket: Socket, tripId: string) => {
  socket.emit('tripAccepted', tripId);
};

export const emitTripCompleted = (socket: Socket, tripId: string) => {
  socket.emit('tripCompleted', tripId);
};

