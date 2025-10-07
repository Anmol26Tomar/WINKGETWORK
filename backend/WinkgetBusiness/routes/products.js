const express = require('express');
const Product = require('../models/Product');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Query products - by vendorId if provided, else all
router.get('/', async (req, res) => {
  try {
    const { vendorId } = req.query;
    const filter = {};
    if (vendorId) filter.vendorId = vendorId;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vendor/Admin: create product (vendor can only create for self)
router.post('/', verifyToken, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const payload = req.body;
    const vendorId = req.user.role === 'vendor' ? req.user.id : payload.vendorId;
    if (!vendorId) return res.status(400).json({ message: 'vendorId required' });
    const product = await Product.create({ ...payload, vendorId });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// Vendor/Admin: update product
router.put('/:id', verifyToken, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'vendor' && product.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// Vendor/Admin: delete product
router.delete('/:id', verifyToken, requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'vendor' && product.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


