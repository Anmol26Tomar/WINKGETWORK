const express = require('express');
<<<<<<< HEAD
=======
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  addProductRating,
  getProductCategories,
  searchProducts,
  uploadProductImagesMiddleware
} = require('../controllers/productController');

>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498
const router = express.Router();
const { getProductById, getProductReviews, searchProducts, getFeaturedProducts } = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');
const Product = require('../models/Product');

// Public routes
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:productId', getProductById);
router.get('/:productId/reviews', getProductReviews);

<<<<<<< HEAD
// Query products - by vendorId if provided, else all
router.get('/', async (req, res) => {
  try {
    const { vendorId, businessId, category, limit = 20, page = 1 } = req.query;
    const filter = { isActive: true };
    if (vendorId) filter.vendorId = vendorId;
    if (businessId) filter.businessId = businessId;
    if (category) filter.category = category;
    
    const products = await Product.find(filter)
      .populate('vendorId', 'name storeName logo')
      .populate('businessId', 'name slug category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(filter);
    
    res.json({ 
      success: true, 
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected routes
router.use(verifyToken);

// Vendor/Admin: create product (vendor can only create for self)
router.post('/', requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const payload = req.body;
    const vendorId = req.user.role === 'vendor' ? req.user.id : payload.vendorId;
    if (!vendorId) return res.status(400).json({ message: 'vendorId required' });
    
    // Generate slug from name
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    payload.slug = slug;
    
    const product = await Product.create({ ...payload, vendorId });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// Vendor/Admin: update product
router.put('/:id', requireRole('vendor', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'vendor' && product.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// Vendor/Admin: delete product
router.delete('/:id', requireRole('vendor', 'admin'), async (req, res) => {
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
=======
// Public routes
router.get('/', getProducts); // Get all products with filtering
router.get('/search', searchProducts); // Search products with autocomplete
router.get('/categories', getProductCategories); // Get product categories
router.get('/:id', getProductById); // Get single product by ID
router.post('/:id/rating', verifyToken, addProductRating); // Add product rating (authenticated users)

// Vendor authenticated routes
router.use(verifyToken);

// Vendor product management
router.get('/vendor/my-products', requireRole('vendor'), getVendorProducts);
router.post('/', requireRole('vendor'), uploadProductImagesMiddleware, createProduct);
router.put('/:id', requireRole('vendor', 'admin'), updateProduct);
router.delete('/:id', requireRole('vendor', 'admin'), deleteProduct);
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498

module.exports = router;


