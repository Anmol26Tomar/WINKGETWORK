const Vendor = require('../models/Vendor');
const Product = require('../models/Product');

// List vendors (with optional approved filter and search)
const getVendors = async (req, res) => {
  try {
    const { approved, category, city, search, limit = 20, page = 1 } = req.query;
    const filter = {};
    
    if (approved === 'true') filter.isApproved = true;
    if (approved === 'false') filter.isApproved = false;
    if (category) filter.category = category;
    if (city) filter['businessAddress.city'] = city;
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    const vendors = await Vendor.find(filter)
      .select('-password -passwordHash') // Exclude password fields
      .sort({ averageRating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews.userId', 'name email');
    
    const total = await Vendor.countDocuments(filter);
    
    res.json({
      vendors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendor by id with products
const getVendorById = async (req, res) => {
  try {
    const { includeProducts = false, productLimit = 10 } = req.query;
    console.log(req.params.id);
    let vendor = await Vendor.findById(req.params.id)
      .select('-password -passwordHash')
      .populate('reviews.userId', 'name email');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    if (includeProducts === 'true') {
      const products = await Product.find({ vendorRef: req.params.id, isActive: true })
        .sort({ createdAt: -1 })
        .limit(parseInt(productLimit))
        .select('-vendorRef');
      
      vendor = vendor.toObject();
      vendor.products = products;
    }
    
    res.json(vendor);
  } catch (err) {
    console.error('Error fetching vendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current vendor profile (authenticated vendor)
const getCurrentVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id)
      .select('-password -passwordHash')
      .populate('reviews.userId', 'name email');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // Get vendor's products count
    const productCount = await Product.countDocuments({ vendorRef: req.user.id });
    const activeProductCount = await Product.countDocuments({ vendorRef: req.user.id, isActive: true });
    
    const vendorData = vendor.toObject();
    vendorData.stats = {
      totalProducts: productCount,
      activeProducts: activeProductCount,
      totalSold: await Product.aggregate([
        { $match: { vendorRef: req.user.id } },
        { $group: { _id: null, total: { $sum: '$sold' } } }
      ]).then(result => result[0]?.total || 0)
    };
    
    res.json(vendorData);
  } catch (err) {
    console.error('Error fetching current vendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current vendor profile
const updateCurrentVendor = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.passwordHash;
    delete updateData.isApproved;
    delete updateData.role;
    delete updateData.reviews;
    delete updateData.averageRating;
    delete updateData.totalReviews;
    
    const vendor = await Vendor.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordHash');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    res.json(vendor);
  } catch (err) {
    console.error('Error updating vendor:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload vendor documents
const uploadDocument = async (req, res) => {
  try {
    const { type, documentUrl, documentName } = req.body;
    
    if (!type || !documentUrl || !documentName) {
      return res.status(400).json({ message: 'Type, documentUrl, and documentName are required' });
    }
    
    const document = {
      type,
      documentUrl,
      documentName,
      uploadedAt: new Date(),
      verified: false
    };
    
    const vendor = await Vendor.findByIdAndUpdate(
      req.user.id,
      { $push: { documents: document } },
      { new: true }
    ).select('-password -passwordHash');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    res.json(vendor);
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update business images
const updateBusinessImages = async (req, res) => {
  try {
    const { businessPosts, profileBanner, businessProfilePic, ownerPic, gstinDocUrl, gstinNumber } = req.body;
    const updateData = {};
    
    if (businessPosts) updateData.businessPosts = businessPosts;
    if (profileBanner) updateData.profileBanner = profileBanner;
    if (businessProfilePic) updateData.businessProfilePic = businessProfilePic;
    if (ownerPic) updateData.ownerPic = ownerPic;
    if (gstinDocUrl) updateData.gstinDocUrl = gstinDocUrl;
    if (gstinNumber) updateData.gstinNumber = gstinNumber;
    
    const vendor = await Vendor.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password -passwordHash');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    res.json(vendor);
  } catch (err) {
    console.error('Error updating business images:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Approve vendor
const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id, 
      { isApproved: true }, 
      { new: true }
    ).select('-password -passwordHash');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    console.error('Error approving vendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Reject vendor
const rejectVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id, 
      { isApproved: false }, 
      { new: true }
    ).select('-password -passwordHash');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    console.error('Error rejecting vendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create vendor
const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    const vendorResponse = vendor.toObject();
    delete vendorResponse.password;
    delete vendorResponse.passwordHash;
    res.status(201).json(vendorResponse);
  } catch (err) {
    console.error('Error creating vendor:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email or shop name already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update vendor
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).select('-password -passwordHash');
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    console.error('Error updating vendor:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete vendor
const deleteVendor = async (req, res) => {
  try {
    // Check if vendor has products
    const productCount = await Product.countDocuments({ vendorRef: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete vendor with existing products. Please delete products first.' 
      });
    }
    
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendor statistics
const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    const stats = await Product.aggregate([
      { $match: { vendorRef: vendorId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnits: { $sum: '$units' },
          totalSold: { $sum: '$sold' },
          averagePrice: { $avg: '$price' },
          totalRevenue: { $sum: { $multiply: ['$sold', '$price'] } }
        }
      }
    ]);
    
    const categoryStats = await Product.aggregate([
      { $match: { vendorRef: vendorId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSold: { $sum: '$sold' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const result = {
      overall: stats[0] || {
        totalProducts: 0,
        totalUnits: 0,
        totalSold: 0,
        averagePrice: 0,
        totalRevenue: 0
      },
      byCategory: categoryStats
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching vendor stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendors by category (public route) - Case-insensitive filtering
const getVendorsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1, city } = req.query;
    
    console.log('🔍 getVendorsByCategory called with:', { category, limit, page, city });
    
    // Validate category parameter
    if (!category || category.trim() === '') {
      console.log('❌ Invalid category parameter');
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required',
        vendors: [],
        totalFound: 0
      });
    }
    
    // Case-insensitive category filtering using regex
    const filter = {
      category: { $regex: new RegExp(`^${category.trim()}$`, 'i') }, // Case-insensitive exact match
      isApproved: true // Only show approved vendors
    };
    
    // Optional city filter (also case-insensitive)
    if (city && city.trim() !== '') {
      filter['businessAddress.city'] = { $regex: new RegExp(city.trim(), 'i') };
    }
    
    const skip = (page - 1) * limit;
    
    console.log('🔍 MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // Query the WB_Vendor collection in MongoDB
    const vendors = await Vendor.find(filter)
      .select('-password -passwordHash -password') // Exclude all password fields
      .sort({ averageRating: -1, createdAt: -1 }) // Sort by rating first, then by creation date
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews.userId', 'name email'); // Populate review user details
    
    const total = await Vendor.countDocuments(filter);
    
    console.log(`✅ Found ${vendors.length} vendors out of ${total} total`);
    
    // Enhanced JSON response with proper error handling
    res.json({
      success: true,
      vendors,
      category: category.trim(),
      totalFound: total,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      message: total > 0 
        ? `${total} vendor${total === 1 ? '' : 's'} found in "${category}" category` 
        : `No vendors found in "${category}" category`,
      filters: {
        category: category.trim(),
        city: city ? city.trim() : null,
        approved: true
      }
    });
    
  } catch (err) {
    console.error('Error fetching vendors by category:', err);
    
    // Proper error handling for different error types
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category parameter format',
        vendors: [],
        totalFound: 0
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching vendors',
      vendors: [],
      totalFound: 0,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
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
  getVendorsByCategory,
};
