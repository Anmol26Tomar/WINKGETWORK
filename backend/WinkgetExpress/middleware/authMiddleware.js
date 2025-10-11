const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
	try {
		const authHeader = req.headers['authorization'] || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		
		if (!token) return res.status(401).json({ message: 'No token provided' });
		
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
		req.user = { id: decoded.id, role: decoded.role };
		next();
	} catch (err) {
		console.error('Auth middleware error:', err.message);
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

module.exports = authMiddleware;


