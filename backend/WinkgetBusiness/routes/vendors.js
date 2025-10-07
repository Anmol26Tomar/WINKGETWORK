const express = require('express');
const Vendor = require('../models/Vendor');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Admin: list vendors (with optional approved filter)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { approved } = req.query;
    const filter = {};
    if (approved === 'true') filter.approved = true;
    if (approved === 'false') filter.approved = false;
    const vendors = await Vendor.find(filter).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: approve vendor
router.patch('/:id/approve', requireRole('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: CRUD
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get vendor by id
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


