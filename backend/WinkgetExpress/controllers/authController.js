const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function register(req, res) {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ message: 'Email already registered' });
		const hashed = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, password: hashed, role: 'user' });
		return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.password);
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

async function profile(req, res) {
	try {
		const user = await User.findById(req.user.id).select('-password');
		if (!user) return res.status(404).json({ message: 'User not found' });
		return res.json(user);
	} catch (err) {
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = { register, login, profile };


