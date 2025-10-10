const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Review = require('../models/Review');

// Get vendor details
async function getVendorById(req, res) {
	try {
		const { vendorId } = req.params;
		
		const vendor = await Vendor.findById(vendorId)
			.populate('businessId', 'name slug category')
			.select('-passwordHash');

		if (!vendor || !vendor.isActive) {
			return res.status(404).json({ message: 'Vendor not found' });
		}

		// Get vendor's products
		const products = await Product.find({ 
			vendorId: vendor._id, 
			isActive: true 
		})
		.select('name price thumbnail rating images category')
		.sort({ 'rating.average': -1 })
		.limit(20);

		// Get vendor reviews
		const reviews = await Review.find({ 
			vendorId: vendor._id, 
			isActive: true 
		})
		.populate('userId', 'name profileImage')
		.select('rating title comment images createdAt')
		.sort({ createdAt: -1 })
		.limit(10);

		return res.json({
			success: true,
			vendor,
			products,
			reviews
		});
	} catch (err) {
		console.error('Get vendor error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

// Get vendor products
async function getVendorProducts(req, res) {
	try {
		const { vendorId } = req.params;
		const { category, limit = 20, page = 1, sort = 'rating' } = req.query;

		const vendor = await Vendor.findById(vendorId);
		if (!vendor || !vendor.isActive) {
			return res.status(404).json({ message: 'Vendor not found' });
		}

		const filter = { 
			vendorId: vendor._id, 
			isActive: true 
		};
		
		if (category) filter.category = category;

		let sortOption = {};
		switch (sort) {
			case 'rating':
				sortOption = { 'rating.average': -1 };
				break;
			case 'price_low':
				sortOption = { price: 1 };
				break;
			case 'price_high':
				sortOption = { price: -1 };
				break;
			case 'newest':
				sortOption = { createdAt: -1 };
				break;
			default:
				sortOption = { 'rating.average': -1 };
		}

		const products = await Product.find(filter)
			.select('name price thumbnail rating images category tags')
			.sort(sortOption)
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Product.countDocuments(filter);

		return res.json({
			success: true,
			products,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / limit),
				total
			}
		});
	} catch (err) {
		console.error('Get vendor products error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

// Get vendor reviews
async function getVendorReviews(req, res) {
	try {
		const { vendorId } = req.params;
		const { limit = 10, page = 1 } = req.query;

		const vendor = await Vendor.findById(vendorId);
		if (!vendor) {
			return res.status(404).json({ message: 'Vendor not found' });
		}

		const reviews = await Review.find({ 
			vendorId: vendor._id, 
			isActive: true 
		})
		.populate('userId', 'name profileImage')
		.select('rating title comment images createdAt helpful')
		.sort({ createdAt: -1 })
		.limit(limit * 1)
		.skip((page - 1) * limit);

		const total = await Review.countDocuments({ 
			vendorId: vendor._id, 
			isActive: true 
		});

		return res.json({
			success: true,
			reviews,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / limit),
				total
			}
		});
	} catch (err) {
		console.error('Get vendor reviews error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = {
	getVendorById,
	getVendorProducts,
	getVendorReviews
};
