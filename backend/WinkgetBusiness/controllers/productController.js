const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
<<<<<<< HEAD
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
=======
const multer = require('multer');
const { uploadBuffer } = require('../utils/cloudinary');

// Multer setup for memory storage to forward buffers to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });
const uploadProductImagesMiddleware = upload.array('images', 8);

// Get products with advanced filtering and search
const getProducts = async (req, res) => {
  try {
    const {
      vendorId,
      vendorRef,
      category,
      subcategory,
      secondarySubcategory,
      minPrice,
      maxPrice,
      brand,
      recommended,
      search,
      tags,
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true };
    
    // Vendor filter
    if (vendorId) filter.vendorId = vendorId;
    if (vendorRef) filter.vendorRef = vendorRef;
    
    // Category filters (optimized for search)
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (secondarySubcategory) filter.secondarySubcategory = secondarySubcategory;
    
    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Other filters
    if (brand) filter.brand = brand;
    if (recommended === 'true') filter.recommended = true;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }
    
    // Text search across title, description, and tags
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Sorting
    const sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sortOptions.averageRating = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'popularity') {
      sortOptions.sold = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    
    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .populate('vendorRef', 'shopName ownerName averageRating businessProfilePic')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendorRef', 'shopName ownerName aboutBusiness averageRating businessProfilePic socialLinks websiteLink')
      .populate('ratings.userId', 'name email');
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Get related products from same vendor
    const relatedProducts = await Product.find({
      vendorRef: product.vendorRef._id,
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    }).limit(4).select('title price images averageRating');
    
    const productData = product.toObject();
    productData.relatedProducts = relatedProducts;
    
    res.json(productData);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product (vendor can only create for self)
const createProduct = async (req, res) => {
  try {
    const payload = { ...req.body };
    const vendorRef = req.user.role === 'vendor' ? req.user.id : payload.vendorRef;
    
    if (!vendorRef) return res.status(400).json({ message: 'vendorRef required' });
    
    // Verify vendor exists and is approved
    const vendor = await Vendor.findById(vendorRef);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    if (!vendor.isApproved) return res.status(403).json({ message: 'Vendor not approved' });
    
    // Sanitize optional SKU to avoid null being written
    if (payload.sku === undefined || payload.sku === null || payload.sku === '') {
      delete payload.sku;
    }
    
    // If files are present, upload them to Cloudinary and collect URLs
    if (Array.isArray(req.files) && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((f, i) => uploadBuffer(f.buffer, `${Date.now()}_${i}`))
      );
      payload.images = uploads.map(u => u.secure_url || u.url).filter(Boolean);
    }

    let product;
    try {
      product = await Product.create({ ...payload, vendorRef });
    } catch (err) {
      // Handle legacy non-sparse sku index by dropping and retrying once
      if (err && err.code === 11000 && err.keyPattern && err.keyPattern.sku === 1) {
        try {
          await Product.collection.dropIndex('sku_1')
          product = await Product.create({ ...payload, vendorRef });
        } catch (innerErr) {
          throw innerErr
        }
      } else {
        throw err
      }
    }
    const populatedProduct = await Product.findById(product._id)
      .populate('vendorRef', 'shopName ownerName');
    
    res.status(201).json(populatedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Check ownership
    if (req.user.role === 'vendor' && product.vendorRef.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden - Not your product' });
    }
    
    const updated = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('vendorRef', 'shopName ownerName');
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating product:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Check ownership
    if (req.user.role === 'vendor' && product.vendorRef.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden - Not your product' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get products by vendor (for vendor dashboard)
const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { 
      category, 
      subcategory, 
      isActive, 
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = { vendorRef: vendorId };
    
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching vendor products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add product rating/review
const addProductRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id; // Assuming user is authenticated
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Check if user already rated this product
    const existingRating = product.ratings.find(r => r.userId.toString() === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this product' });
    }
    
    const newRating = {
      userId,
      rating,
      comment: comment || '',
      createdAt: new Date()
    };
    
    product.ratings.push(newRating);
    await product.save();
    
    res.json({ message: 'Rating added successfully', rating: newRating });
  } catch (err) {
    console.error('Error adding product rating:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product categories for search optimization
const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            category: '$category',
            subcategory: '$subcategory',
            secondarySubcategory: '$secondarySubcategory'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          subcategories: {
            $push: {
              subcategory: '$_id.subcategory',
              secondarySubcategories: {
                $cond: [
                  { $ne: ['$_id.secondarySubcategory', null] },
                  [{ secondarySubcategory: '$_id.secondarySubcategory', count: '$count' }],
                  []
                ]
              },
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);
    
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search products with autocomplete
const searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const products = await Product.find({
      $text: { $search: q },
      isActive: true
    })
    .select('title category subcategory price images averageRating')
    .limit(parseInt(limit))
    .sort({ score: { $meta: 'textScore' }, averageRating: -1 });
    
    const suggestions = products.map(product => ({
      id: product._id,
      title: product.title,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      image: product.images[0],
      rating: product.averageRating
    }));
    
    res.json({ suggestions });
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
>>>>>>> 6677c8d276d8c9b89d6ef012931118cf693e9498
};
