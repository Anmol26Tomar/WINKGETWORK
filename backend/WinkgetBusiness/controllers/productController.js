const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Review = require('../models/Review');

// Get product details
async function getProductById(req, res) {
	try {
		const { productId } = req.params;
		
		const product = await Product.findById(productId)
			.populate('vendorId', 'name storeName logo rating address')
			.populate('businessId', 'name slug category');

		if (!product || !product.isActive) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Increment view count
		await Product.findByIdAndUpdate(productId, { $inc: { 'stats.views': 1 } });

		// Get product reviews
		const reviews = await Review.find({ 
			productId: product._id, 
			isActive: true 
		})
		.populate('userId', 'name profileImage')
		.select('rating title comment images createdAt helpful')
		.sort({ createdAt: -1 })
		.limit(10);

		// Get related products from same vendor
		const relatedProducts = await Product.find({ 
			vendorId: product.vendorId._id,
			category: product.category,
			_id: { $ne: product._id },
			isActive: true 
		})
		.select('name price thumbnail rating')
		.limit(6);

		return res.json({
			success: true,
			product,
			reviews,
			relatedProducts
		});
	} catch (err) {
		console.error('Get product error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

// Get product reviews
async function getProductReviews(req, res) {
	try {
		const { productId } = req.params;
		const { limit = 10, page = 1 } = req.query;

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		const reviews = await Review.find({ 
			productId: product._id, 
			isActive: true 
		})
		.populate('userId', 'name profileImage')
		.select('rating title comment images createdAt helpful')
		.sort({ createdAt: -1 })
		.limit(limit * 1)
		.skip((page - 1) * limit);

		const total = await Review.countDocuments({ 
			productId: product._id, 
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
		console.error('Get product reviews error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

// Search products
async function searchProducts(req, res) {
	try {
		const { q, category, business, vendor, minPrice, maxPrice, limit = 20, page = 1, sort = 'relevance' } = req.query;

		if (!q && !category && !business && !vendor) {
			return res.status(400).json({ message: 'Search query or filters required' });
		}

		const filter = { isActive: true };
		
		// Text search
		if (q) {
			filter.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ description: { $regex: q, $options: 'i' } },
				{ tags: { $in: [new RegExp(q, 'i')] } }
			];
		}

		// Filters
		if (category) filter.category = category;
		if (business) filter.businessId = business;
		if (vendor) filter.vendorId = vendor;
		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = parseFloat(minPrice);
			if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
		}

		let sortOption = {};
		switch (sort) {
			case 'relevance':
				// For text search, relevance would be handled by MongoDB text search
				sortOption = { 'rating.average': -1 };
				break;
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
			case 'popular':
				sortOption = { 'stats.orders': -1 };
				break;
			default:
				sortOption = { 'rating.average': -1 };
		}

		const products = await Product.find(filter)
			.populate('vendorId', 'name storeName logo')
			.populate('businessId', 'name slug category')
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
		console.error('Search products error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

// Get featured products
async function getFeaturedProducts(req, res) {
	try {
		const { business, limit = 12 } = req.query;

		const filter = { 
			isActive: true, 
			isFeatured: true 
		};
		
		if (business) filter.businessId = business;

		const products = await Product.find(filter)
			.populate('vendorId', 'name storeName logo')
			.populate('businessId', 'name slug category')
			.select('name price thumbnail rating images category')
			.sort({ 'rating.average': -1 })
			.limit(parseInt(limit));

		return res.json({
			success: true,
			products
		});
	} catch (err) {
		console.error('Get featured products error:', err);
		return res.status(500).json({ message: 'Server error' });
	}
}

module.exports = {
	getProductById,
	getProductReviews,
	searchProducts,
	getFeaturedProducts
};
