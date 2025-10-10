const express = require('express');
const router = express.Router();
const {
	getAllBusinesses,
	getBusinessBySlug,
	getBusinessVendors,
	getBusinessProducts,
	getBusinessCategories,
	getBusinessStats
} = require('../controllers/businessController');

// Business routes
router.get('/', getAllBusinesses);
router.get('/:slug', getBusinessBySlug);
router.get('/:slug/vendors', getBusinessVendors);
router.get('/:slug/products', getBusinessProducts);
router.get('/:slug/categories', getBusinessCategories);
router.get('/:slug/stats', getBusinessStats);

// Existing routes
router.use('/vendors', require('./vendors'));
router.use('/products', require('./products'));
router.use('/contact', require('./contact'));

module.exports = router;


