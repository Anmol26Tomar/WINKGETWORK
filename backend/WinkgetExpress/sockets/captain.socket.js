const jwt = require('jsonwebtoken');
const { Agent } = require('../models/Agent');

function initCaptainSockets(io) {
  const captainNamespace = io.of('/captain');

  // ✅ JWT authentication middleware
  captainNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      // Accept both 'agent' and 'captain' roles for backward compatibility
      if (decoded.role !== 'agent' && decoded.role !== 'captain') return next(new Error('Invalid token role'));

      // Support both agentId and captainId in token for backward compatibility
      const agentId = decoded.agentId || decoded.captainId;
      if (!agentId) return next(new Error('Missing agent ID in token'));

      const agent = await Agent.findById(agentId);
      if (!agent) return next(new Error('Agent not found'));

      socket.data.agentId = agent._id.toString();
      socket.data.captainId = agent._id.toString(); // Keep for backward compatibility
      socket.data.agent = agent;
      socket.data.captain = agent; // Keep for backward compatibility
      next();
    } catch (error) {
      console.error('❌ Agent auth failed:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // ✅ Handle connection
  captainNamespace.on('connection', async (socket) => {
    const agentId = socket.data.agentId;
    const agent = socket.data.agent;
    console.log(`✅ Agent connected: ${agentId}`);

    // Join agent-specific room
    socket.join(`agent_${agentId}`);
    socket.join(`captain_${agentId}`); // Keep for backward compatibility

    // Update agent's socket ID & active status
    await Agent.findByIdAndUpdate(agentId, {
      socketId: socket.id,
      isActive: true
    });

    // 📍 Location updates
    socket.on('updateLocation', async (coords) => {
      try {
        await Agent.findByIdAndUpdate(agentId, {
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
        agent: {
          id: agentId,
          name: agent.name,
          phone: agent.phone,
          vehicleType: agent.vehicleType
        },
        captain: { // Keep for backward compatibility
          id: agentId,
          name: agent.name,
          phone: agent.phone,
          vehicleType: agent.vehicleType
        }
      });

      // Notify all other agents
      captainNamespace.emit('trip:cancelled', { tripId });
    });

    // ✅ Trip completed
    socket.on('tripCompleted', (tripId) => {
      io.of('/user').to(`trip_${tripId}`).emit('trip:completed', {
        tripId,
        agentId,
        captainId: agentId // Keep for backward compatibility
      });
    });

    // ✅ Handle reconnect
    socket.on('reconnect', () => {
      console.log(`♻️ Agent reconnected: ${agentId}`);
    });

    // ✅ Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ Agent disconnected: ${agentId}`);
      try {
        await Agent.findByIdAndUpdate(agentId, {
          isActive: false,
          socketId: null
        });
      } catch (error) {
        console.error('Error updating agent status on disconnect:', error);
      }
    });
  });
}

// ✅ Emit trip to a specific agent
function emitTripToCaptain(io, agentId, trip) {
  // Support both agent and captain room names for backward compatibility
  io.of('/captain').to(`agent_${agentId}`).emit('trip:assigned', trip);
  io.of('/captain').to(`captain_${agentId}`).emit('trip:assigned', trip);
}

// ✅ Emit trip cancellation to all agents
function emitTripCancellation(io, tripId) {
  io.of('/captain').emit('trip:cancelled', { tripId });
}

module.exports = {
  initCaptainSockets,
  emitTripToCaptain,
  emitTripCancellation
};
