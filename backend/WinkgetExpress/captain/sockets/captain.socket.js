const jwt = require('jsonwebtoken');
const { Captain } = require('../models/Captain.model');

function initCaptainSockets(io) {
  const captainNamespace = io.of('/captain');

  // JWT authentication middleware for captain namespace
  captainNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      if (decoded.role !== 'captain') {
        return next(new Error('Invalid token role'));
      }

      const captain = await Captain.findById(decoded.captainId);
      if (!captain) {
        return next(new Error('Captain not found'));
      }

      socket.data.captainId = captain._id.toString();
      socket.data.captain = captain;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  captainNamespace.on('connection', async (socket) => {
    console.log(`Captain connected: ${socket.data.captainId}`);
    
    const captainId = socket.data.captainId;
    const captain = socket.data.captain;

    // Join captain-specific room
    socket.join(`captain_${captainId}`);

    // Update captain's socket ID and active status
    await Captain.findByIdAndUpdate(captainId, {
      socketId: socket.id,
      isActive: true
    });

    // Handle location updates
    socket.on('updateLocation', async (coords) => {
      try {
        await Captain.findByIdAndUpdate(captainId, {
          location: {
            type: 'Point',
            coordinates: [coords.lng, coords.lat]
          }
        });
        
        socket.emit('locationUpdated', { success: true });
      } catch (error) {
        socket.emit('locationUpdated', { success: false, error: 'Failed to update location' });
      }
    });

    // Handle trip acceptance confirmation
    socket.on('tripAccepted', (tripId) => {
      // Notify user that trip was accepted
      io.of('/user').to(`trip_${tripId}`).emit('trip:accepted', {
        tripId,
        captain: {
          id: captainId,
          name: captain.name,
          phone: captain.phone,
          vehicleType: captain.vehicleType
        }
      });

      // Notify other captains that trip is no longer available
      captainNamespace.emit('trip:cancelled', { tripId });
    });

    // Handle trip completion
    socket.on('tripCompleted', (tripId) => {
      // Notify user that trip is completed
      io.of('/user').to(`trip_${tripId}`).emit('trip:completed', {
        tripId,
        captainId
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Captain disconnected: ${captainId}`);
      
      try {
        await Captain.findByIdAndUpdate(captainId, {
          isActive: false,
          socketId: null
        });
      } catch (error) {
        console.error('Error updating captain status on disconnect:', error);
      }
    });
  });
}

/**
 * Emit trip assignment to a specific captain
 */
function emitTripToCaptain(io, captainId, trip) {
  const captainNamespace = io.of('/captain');
  captainNamespace.to(`captain_${captainId}`).emit('trip:assigned', trip);
}

/**
 * Emit trip cancellation to all captains
 */
function emitTripCancellation(io, tripId) {
  const captainNamespace = io.of('/captain');
  captainNamespace.emit('trip:cancelled', { tripId });
}

module.exports = {
  initCaptainSockets,
  emitTripToCaptain,
  emitTripCancellation
};

