const jwt = require('jsonwebtoken');
const { Agent } = require('../models/Agent');

const protectCaptain = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Accept both 'agent' and 'captain' roles for backward compatibility during migration
    if (decoded.role !== 'agent' && decoded.role !== 'captain') {
      return res.status(401).json({ message: 'Invalid token role' });
    }

    // Support both agentId and captainId in token for backward compatibility
    const agentId = decoded.agentId || decoded.captainId;
    if (!agentId) {
      return res.status(401).json({ message: 'Invalid token: missing agent ID' });
    }

    const agent = await Agent.findById(agentId);
    
    if (!agent) {
      return res.status(401).json({ message: 'Agent not found' });
    }

    req.agent = agent;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { protectCaptain };

