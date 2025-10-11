const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getVendors,
  getVendorById,
  getCurrentVendor,
  updateCurrentVendor,
  uploadDocument,
  updateBusinessImages,
  approveVendor,
  rejectVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats,
  getVendorsByCategory
} = require('../controllers/vendorController');

const router = express.Router();

// Public routes
router.get('/public', getVendors); // Public vendor listing
router.get('/public/:id', getVendorById); // Public vendor profile
router.get('/category/:category', getVendorsByCategory); // Public vendors by category (case-insensitive)

// Vendor authenticated routes
router.use(verifyToken);

// Vendor dashboard routes
router.get('/profile', requireRole('vendor'), getCurrentVendor);
router.put('/profile', requireRole('vendor'), updateCurrentVendor);
router.get('/stats', requireRole('vendor'), getVendorStats);

// Vendor document and image management
router.post('/documents', requireRole('vendor'), uploadDocument);
router.put('/images', requireRole('vendor'), updateBusinessImages);

// Admin routes
router.get('/', requireRole('admin'), getVendors);
router.post('/', requireRole('admin'), createVendor);
router.get('/:id', requireRole('admin'), getVendorById);
router.put('/:id', requireRole('admin'), updateVendor);
router.delete('/:id', requireRole('admin'), deleteVendor);
router.patch('/:id/approve', requireRole('admin'), approveVendor);
router.patch('/:id/reject', requireRole('admin'), rejectVendor);

module.exports = router;


