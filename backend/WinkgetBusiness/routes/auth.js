const express = require('express');
<<<<<<< HEAD
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  return jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name, email: user.email },
    secret,
    { expiresIn: '7d' }
  );
}

// Unified registration route with one-admin rule
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'name, email and password are required' });
    }

    const existsAdmin = await Admin.findOne({ email });
    const existsUser = await User.findOne({ email });
    if (existsAdmin || existsUser) {
      return res.status(409).json({ code: 'EMAIL_IN_USE', message: 'Email already in use' });
    }

    const adminCount = await Admin.countDocuments();
    const passwordHash = await bcrypt.hash(password, 10);

    if (adminCount === 0) {
      const admin = await Admin.create({ name, email, passwordHash, role: 'admin' });
      const token = signToken(admin);
      return res.status(201).json({ token, user: { id: admin._id, role: 'admin', name: admin.name, email: admin.email } });
    }

    const user = await User.create({ name, email, passwordHash, role: 'user' });
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user._id, role: 'user', name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Registration failed', details: err?.message });
  }
});

// Admin-only list of users
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Failed to fetch users', details: err?.message });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { role, name, email, password, storeName, websiteUrl } = req.body;
    if (!role || !name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const passwordHash = await bcrypt.hash(password, 10);
    if (role === 'admin') {
      // Allow creating first admin only
      const adminCount = await Admin.countDocuments();
      if (adminCount > 0) return res.status(409).json({ message: 'Admin account already exists. Please log in instead.' });
      const exists = await Admin.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      const admin = await Admin.create({ name, email, passwordHash, role: 'admin' });
      const token = signToken(admin);
      return res.json({ token, user: { id: admin._id, role: 'admin', name: admin.name, email: admin.email } });
    }
    if (role === 'vendor') {
      if (!storeName) return res.status(400).json({ message: 'storeName required' });
      const exists = await Vendor.findOne({ $or: [{ email }, { storeName }] });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      const vendor = await Vendor.create({ name, email, passwordHash, role: 'vendor', storeName, websiteUrl });
      const token = signToken(vendor);
      return res.json({ token, user: { id: vendor._id, role: 'vendor', name: vendor.name, email: vendor.email, approved: vendor.approved } });
    }
    return res.status(400).json({ message: 'Invalid role' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
=======
const {
  signup,
  signupAdmin,
  signupVendor,
  login,
  logout,
  getCurrentUser
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { debugVendorSignup } = require('../utils/debugVendor');

const router = express.Router();

router.post('/signup', signup);
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498

// Dedicated admin signup endpoint (first admin only)
router.post('/signup/admin', signupAdmin);

// Dedicated vendor signup endpoint
router.post('/signup/vendor', signupVendor);

// Debug endpoint for vendor signup issues
router.post('/debug/vendor', async (req, res) => {
  try {
    const { email, shopName } = req.body;
    const debugResult = await debugVendorSignup(email, shopName);
    res.json(debugResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

<<<<<<< HEAD
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'email and password are required' });
    }

    let account = await Admin.findOne({ email });
    if (!account) account = await User.findOne({ email });
    if (!account) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const token = signToken(account);
    return res.json({ token, user: { id: account._id, role: account.role, name: account.name, email: account.email } });
  } catch (err) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Login failed', details: err?.message });
  }
});
=======
// Authentication endpoints
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getCurrentUser);
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498

module.exports = router;


