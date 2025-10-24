const jwt = require('jsonwebtoken');
const { Captain } = require('../models/Captain.model');

const protectCaptain = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    if (decoded.role !== 'captain') {
      return res.status(401).json({ message: 'Invalid token role' });
    }

    const captain = await Captain.findById(decoded.captainId);
    
    if (!captain) {
      return res.status(401).json({ message: 'Captain not found' });
    }

    req.captain = captain;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { protectCaptain };

