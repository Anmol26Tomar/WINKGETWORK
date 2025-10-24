const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { Captain } = require('./WinkgetExpress/captain/models/Captain.model');

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

const createTestCaptain = async () => {
  try {
    await connectDB();
    
    // Check if test captain already exists
    const existingCaptain = await Captain.findOne({ phone: '9876543210' });
    if (existingCaptain) {
      console.log('✅ Test captain already exists');
      console.log('Captain details:', {
        id: existingCaptain._id,
        name: existingCaptain.name,
        phone: existingCaptain.phone,
        vehicleType: existingCaptain.vehicleType,
        isApproved: existingCaptain.isApproved,
      });
      process.exit(0);
    }
    
    // Create test captain
    const passwordHash = await bcrypt.hash('test123', 10);
    const testCaptain = await Captain.create({
      name: 'Test Captain',
      phone: '9876543210',
      passwordHash,
      vehicleType: 'bike',
      vehicleSubType: 'bike_standard',
      servicesOffered: ['local_parcel', 'bike_ride'],
      city: 'Mumbai',
      isApproved: true,
      isActive: false,
    });
    
    console.log('✅ Test captain created successfully:', {
      id: testCaptain._id,
      name: testCaptain.name,
      phone: testCaptain.phone,
      vehicleType: testCaptain.vehicleType,
      vehicleSubType: testCaptain.vehicleSubType,
      servicesOffered: testCaptain.servicesOffered,
      city: testCaptain.city,
      isApproved: testCaptain.isApproved,
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test captain:', error);
    process.exit(1);
  }
};

createTestCaptain();
