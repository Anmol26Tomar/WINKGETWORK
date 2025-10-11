const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');
const bcrypt = require('bcryptjs');

// Sample vendor data for testing
const sampleVendors = [
  {
    ownerName: 'Rajesh Kumar',
    shopName: 'TechWorld Electronics',
    aboutBusiness: 'Leading electronics store with latest gadgets and accessories',
    ownerEmail: 'rajesh@techworld.com',
    businessEmail: 'business@techworld.com',
    businessContact: '+91-9876543210',
    passwordHash: bcrypt.hashSync('password123', 10),
    category: 'Electronics',
    businessAddress: {
      street: '123 Tech Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    isApproved: true,
    businessProfilePic: 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=TW',
    averageRating: 4.5,
    totalReviews: 25
  },
  {
    ownerName: 'Priya Sharma',
    shopName: 'Fashion Hub',
    aboutBusiness: 'Trendy fashion store for men and women',
    ownerEmail: 'priya@fashionhub.com',
    businessEmail: 'info@fashionhub.com',
    businessContact: '+91-9876543211',
    passwordHash: bcrypt.hashSync('password123', 10),
    category: 'Fashion',
    businessAddress: {
      street: '456 Fashion Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    isApproved: true,
    businessProfilePic: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=FH',
    averageRating: 4.2,
    totalReviews: 18
  },
  {
    ownerName: 'Amit Patel',
    shopName: 'Home Decor Plus',
    aboutBusiness: 'Complete home furnishing and decor solutions',
    ownerEmail: 'amit@homedecor.com',
    businessEmail: 'sales@homedecor.com',
    businessContact: '+91-9876543212',
    passwordHash: bcrypt.hashSync('password123', 10),
    category: 'Home & Furniture',
    businessAddress: {
      street: '789 Home Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India'
    },
    isApproved: true,
    businessProfilePic: 'https://via.placeholder.com/150x150/8B5CF6/FFFFFF?text=HD',
    averageRating: 4.7,
    totalReviews: 32
  },
  {
    ownerName: 'Sneha Reddy',
    shopName: 'Beauty Corner',
    aboutBusiness: 'Premium beauty and personal care products',
    ownerEmail: 'sneha@beautycorner.com',
    businessEmail: 'contact@beautycorner.com',
    businessContact: '+91-9876543213',
    passwordHash: bcrypt.hashSync('password123', 10),
    category: 'Beauty & Personal Care',
    businessAddress: {
      street: '321 Beauty Lane',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India'
    },
    isApproved: true,
    businessProfilePic: 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=BC',
    averageRating: 4.3,
    totalReviews: 21
  },
  {
    ownerName: 'Vikram Singh',
    shopName: 'Fresh Grocery Mart',
    aboutBusiness: 'Fresh vegetables, fruits and daily essentials',
    ownerEmail: 'vikram@freshgrocery.com',
    businessEmail: 'orders@freshgrocery.com',
    businessContact: '+91-9876543214',
    passwordHash: bcrypt.hashSync('password123', 10),
    category: 'Grocery & Essentials',
    businessAddress: {
      street: '654 Grocery Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India'
    },
    isApproved: true,
    businessProfilePic: 'https://via.placeholder.com/150x150/EF4444/FFFFFF?text=FG',
    averageRating: 4.6,
    totalReviews: 28
  }
];

async function seedVendors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkgetbusiness');
    console.log('Connected to MongoDB');

    // Clear existing vendors
    await Vendor.deleteMany({});
    console.log('Cleared existing vendors');

    // Insert sample vendors
    const vendors = await Vendor.insertMany(sampleVendors);
    console.log(`Inserted ${vendors.length} sample vendors`);

    // Display created vendors
    vendors.forEach(vendor => {
      console.log(`- ${vendor.shopName} (${vendor.category}) - ${vendor.businessAddress.city}`);
    });

    console.log('Vendor seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding vendors:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedVendors();
