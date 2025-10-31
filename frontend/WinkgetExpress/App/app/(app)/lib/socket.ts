import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || API_CONFIG.BASE_URL;

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

    socket = io(`${API_BASE}/captain`, {
      auth: { token: authToken },
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Captain socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Captain socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Captain socket connection error:', error);
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

