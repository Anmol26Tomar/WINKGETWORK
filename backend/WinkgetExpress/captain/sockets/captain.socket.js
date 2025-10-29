const jwt = require('jsonwebtoken');
const { Captain } = require('../models/Captain.model');

function initCaptainSockets(io) {
  const captainNamespace = io.of('/captain');

  // ✅ JWT authentication middleware
  captainNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      if (decoded.role !== 'captain') return next(new Error('Invalid token role'));

      const captain = await Captain.findById(decoded.captainId);
      if (!captain) return next(new Error('Captain not found'));

      socket.data.captainId = captain._id.toString();
      socket.data.captain = captain;
      next();
    } catch (error) {
      console.error('❌ Captain auth failed:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // ✅ Handle connection
  captainNamespace.on('connection', async (socket) => {
    const captainId = socket.data.captainId;
    const captain = socket.data.captain;
    console.log(`✅ Captain connected: ${captainId}`);

    // Join captain-specific room
    socket.join(`captain_${captainId}`);

    // Update captain’s socket ID & active status
    await Captain.findByIdAndUpdate(captainId, {
      socketId: socket.id,
      isActive: true
    });

    // 📍 Location updates
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

    // 🚘 Trip accepted
    socket.on('tripAccepted', (tripId) => {
      io.of('/user').to(`trip_${tripId}`).emit('trip:accepted', {
        tripId,
        captain: {
          id: captainId,
          name: captain.name,
          phone: captain.phone,
          vehicleType: captain.vehicleType
        }
      });

      // Notify all other captains
      captainNamespace.emit('trip:cancelled', { tripId });
    });

    // ✅ Trip completed
    socket.on('tripCompleted', (tripId) => {
      io.of('/user').to(`trip_${tripId}`).emit('trip:completed', {
        tripId,
        captainId
      });
    });

    // ✅ Handle reconnect
    socket.on('reconnect', () => {
      console.log(`♻️ Captain reconnected: ${captainId}`);
    });

    // ✅ Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ Captain disconnected: ${captainId}`);
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

// ✅ Emit trip to a specific captain
function emitTripToCaptain(io, captainId, trip) {
  io.of('/captain').to(`captain_${captainId}`).emit('trip:assigned', trip);
}

// ✅ Emit trip cancellation to all captains
function emitTripCancellation(io, tripId) {
  io.of('/captain').emit('trip:cancelled', { tripId });
}

module.exports = {
  initCaptainSockets,
  emitTripToCaptain,
  emitTripCancellation
};
