const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

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

// Dedicated admin signup endpoint (first admin only)
router.post('/signup/admin', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) return res.status(409).json({ message: 'Admin account already exists. Please log in instead.' });
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, passwordHash, role: 'admin' });
    const token = signToken(admin);
    return res.status(201).json({ token, user: { id: admin._id, role: 'admin', name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dedicated vendor signup endpoint
router.post('/signup/vendor', async (req, res) => {
  try {
    const { name, email, password, storeName, websiteUrl } = req.body || {};
    console.log( name, email, password, storeName, websiteUrl);
    
    if (!name || !email || !password || !storeName) return res.status(400).json({ message: 'Missing fields' });
    const exists = await Vendor.findOne({ $or: [{ email }, { storeName }] });
    if (exists) return res.status(409).json({ message: 'Email or store name already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const vendor = await Vendor.create({ name, email, passwordHash, role: 'vendor', storeName, websiteUrl });
    const token = signToken(vendor);
    return res.status(201).json({ token, user: { id: vendor._id, role: 'vendor', name: vendor.name, email: vendor.email, approved: vendor.approved } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
    const Model = role === 'admin' ? Admin : Vendor;
    const user = await Model.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    console.log(token);
    res.json({ token, user: { id: user._id, role: user.role, name: user.name, email: user.email, approved: user.approved } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


