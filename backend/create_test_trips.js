const mongoose = require('mongoose');
const { Trip } = require('./WinkgetExpress/captain/models/Trip.model');

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

const createTestTrips = async () => {
  try {
    await connectDB();
    
    // Clear existing test trips
    await Trip.deleteMany({ userId: { $regex: /^test_/ } });
    console.log('✅ Cleared existing test trips');
    
    // Create test trips around Mumbai (near our test captain)
    const testTrips = [
      {
        userId: 'test_user_1',
        serviceType: 'local_parcel',
        vehicleSubType: 'bike_standard',
        pickup: {
          coords: { lat: 19.0760, lng: 72.8777 }, // Mumbai center
          address: 'Mumbai Central Station'
        },
        drop: {
          coords: { lat: 19.0176, lng: 72.8562 }, // Bandra
          address: 'Bandra Kurla Complex'
        },
        status: 'pending_assignment',
        fare: 120,
        paymentStatus: 'pending'
      },
      {
        userId: 'test_user_2',
        serviceType: 'bike_ride',
        vehicleSubType: 'bike_standard',
        pickup: {
          coords: { lat: 19.0760, lng: 72.8777 }, // Mumbai center
          address: 'Gateway of India'
        },
        drop: {
          coords: { lat: 19.0176, lng: 72.8562 }, // Bandra
          address: 'Bandra Station'
        },
        status: 'pending_assignment',
        fare: 80,
        paymentStatus: 'pending'
      },
      {
        userId: 'test_user_3',
        serviceType: 'local_parcel',
        vehicleSubType: 'bike_standard',
        pickup: {
          coords: { lat: 19.0760, lng: 72.8777 }, // Mumbai center
          address: 'CST Station'
        },
        drop: {
          coords: { lat: 19.0176, lng: 72.8562 }, // Bandra
          address: 'Bandra West'
        },
        status: 'pending_assignment',
        fare: 150,
        paymentStatus: 'pending'
      }
    ];
    
    // Create trips
    const createdTrips = await Trip.insertMany(testTrips);
    
    console.log('✅ Test trips created successfully:');
    createdTrips.forEach((trip, index) => {
      console.log(`Trip ${index + 1}:`, {
        id: trip._id,
        serviceType: trip.serviceType,
        pickup: trip.pickup.address,
        drop: trip.drop.address,
        fare: trip.fare,
        status: trip.status
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test trips:', error);
    process.exit(1);
  }
};

createTestTrips();
