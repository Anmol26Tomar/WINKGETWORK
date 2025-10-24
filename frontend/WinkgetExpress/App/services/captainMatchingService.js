import { getSocket } from './socket';
import { getAuthToken } from './authService';

/**
 * Captain Matching Service
 * Handles real-time captain matching for instant assignment like Rapido
 */

class CaptainMatchingService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.currentRequest = null;
  }

  /**
   * Initialize socket connection for captain matching
   */
  async initialize() {
    try {
      this.socket = getSocket();
      if (!this.socket) {
        throw new Error('Socket not available');
      }

      // Set up connection handlers
      this.socket.on('connect', () => {
        console.log('[CaptainMatching] Connected to server');
        this.isConnected = true;
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        console.log('[CaptainMatching] Disconnected from server');
        this.isConnected = false;
        this.emit('disconnected');
      });

      // Set up captain matching event handlers
      this.setupEventHandlers();

      return true;
    } catch (error) {
      console.error('[CaptainMatching] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Set up socket event handlers for captain matching
   */
  setupEventHandlers() {
    // Captain found and assigned
    this.socket.on('captain:assigned', (data) => {
      console.log('[CaptainMatching] Captain assigned:', data);
      this.emit('captainAssigned', data);
    });

    // Captain accepted the request
    this.socket.on('captain:accepted', (data) => {
      console.log('[CaptainMatching] Captain accepted:', data);
      this.emit('captainAccepted', data);
    });

    // Captain started the trip
    this.socket.on('captain:started', (data) => {
      console.log('[CaptainMatching] Captain started trip:', data);
      this.emit('captainStarted', data);
    });

    // Captain reached pickup
    this.socket.on('captain:reached-pickup', (data) => {
      console.log('[CaptainMatching] Captain reached pickup:', data);
      this.emit('captainReachedPickup', data);
    });

    // Captain reached destination
    this.socket.on('captain:reached-destination', (data) => {
      console.log('[CaptainMatching] Captain reached destination:', data);
      this.emit('captainReachedDestination', data);
    });

    // Trip completed
    this.socket.on('trip:completed', (data) => {
      console.log('[CaptainMatching] Trip completed:', data);
      this.emit('tripCompleted', data);
    });

    // Captain cancelled
    this.socket.on('captain:cancelled', (data) => {
      console.log('[CaptainMatching] Captain cancelled:', data);
      this.emit('captainCancelled', data);
    });

    // No captains available
    this.socket.on('captain:not-found', (data) => {
      console.log('[CaptainMatching] No captains available:', data);
      this.emit('noCaptainsAvailable', data);
    });
  }

  /**
   * Request captain for a specific service
   * @param {Object} requestData - Request details
   * @param {string} requestData.serviceType - Type of service (local_parcel, bike_ride, etc.)
   * @param {Object} requestData.pickup - Pickup location
   * @param {Object} requestData.delivery - Delivery location
   * @param {string} requestData.vehicleType - Vehicle type (bike, cab, truck)
   * @param {string} requestData.vehicleSubType - Vehicle sub-type
   * @param {number} requestData.fareEstimate - Estimated fare
   * @param {Object} requestData.package - Package details (for parcels)
   * @param {Object} requestData.receiver - Receiver details (for parcels)
   */
  async requestCaptain(requestData) {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Store current request
      this.currentRequest = {
        ...requestData,
        timestamp: Date.now(),
        status: 'searching'
      };

      // Make API request to captain matching endpoint
      const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.1.15:5000';
      const response = await fetch(`${API_BASE}/api/captain-matching/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        this.currentRequest.status = 'assigned';
        this.currentRequest.captain = result.captain;
        this.emit('captainAssigned', result);
        console.log('[CaptainMatching] Captain assigned:', result.captain);
      } else {
        this.currentRequest.status = 'no_captains';
        this.emit('noCaptainsAvailable', result);
        console.log('[CaptainMatching] No captains available:', result.message);
      }

      console.log('[CaptainMatching] Captain request processed:', requestData);
      this.emit('requestSent', this.currentRequest);

      return this.currentRequest;
    } catch (error) {
      console.error('[CaptainMatching] Request failed:', error);
      this.emit('requestFailed', error);
      throw error;
    }
  }

  /**
   * Cancel current captain request
   */
  async cancelRequest() {
    try {
      if (this.currentRequest) {
        this.socket.emit('request:cancel', {
          requestId: this.currentRequest.id,
          timestamp: Date.now()
        });

        this.currentRequest.status = 'cancelled';
        this.emit('requestCancelled', this.currentRequest);
        this.currentRequest = null;
      }
    } catch (error) {
      console.error('[CaptainMatching] Cancel failed:', error);
      throw error;
    }
  }

  /**
   * Get current request status
   */
  getCurrentRequest() {
    return this.currentRequest;
  }

  /**
   * Check if currently searching for captain
   */
  isSearching() {
    return this.currentRequest && this.currentRequest.status === 'searching';
  }

  /**
   * Subscribe to captain matching events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from captain matching events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[CaptainMatching] Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.socket) {
      this.socket.off('captain:assigned');
      this.socket.off('captain:accepted');
      this.socket.off('captain:started');
      this.socket.off('captain:reached-pickup');
      this.socket.off('captain:reached-destination');
      this.socket.off('trip:completed');
      this.socket.off('captain:cancelled');
      this.socket.off('captain:not-found');
    }
    
    this.listeners.clear();
    this.currentRequest = null;
    this.isConnected = false;
  }
}

// Create singleton instance
const captainMatchingService = new CaptainMatchingService();

export default captainMatchingService;
