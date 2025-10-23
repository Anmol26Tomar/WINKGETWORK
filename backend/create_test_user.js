const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Vendor = require('./WinkgetBusiness/models/Vendor');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkget', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestUser = async () => {
  try {
    await connectDB();
    
    // Check if test user already exists
    const existingUser = await Vendor.findOne({ email: 'test@test.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      process.exit(0);
    }
    
    // Create test user
    const passwordHash = await bcrypt.hash('test123', 10);
    const testUser = await Vendor.create({
      name: 'Test User',
      email: 'test@test.com',
      passwordHash,
      role: 'vendor',
      storeName: 'Test Store',
      approved: true,
    });
    
    console.log('✅ Test user created successfully:', {
      id: testUser._id,
      email: testUser.email,
      name: testUser.name,
      storeName: testUser.storeName,
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
