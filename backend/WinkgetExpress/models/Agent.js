const mongoose = require('mongoose');
const { Schema } = mongoose;

const agentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: null,
    sparse: true, // Allow null values but ensure uniqueness when present
  },
  licenseNumber: {
    type: String,
    default: null,
    sparse: true, // Allow null values but ensure uniqueness when present
  },
  vehicleNumber: {
    type: String,
    default: null,
    sparse: true, // Allow null values but ensure uniqueness when present
  },
  phone: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone must be exactly 10 digits',
    },
  },
  city: {
    type: String,
    trim: true,
    default: null,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'truck', 'cab'],
    required: true,
  },
  vehicleSubType: {
    type: String,
    enum: [
      'bike_standard',
      'cab_sedan',
      'cab_suv', 
      'cab_hatchback',
      'truck_3wheeler',
      'truck_mini_van',
      'truck_pickup',
      'truck_full_size'
    ],
    trim: true,
  },
  servicesOffered: [{
    type: String,
    enum: [
      'local_parcel',
      'intra_truck', 
      'all_india_parcel',
      'cab_booking',
      'bike_ride',
      'packers_movers'
    ],
  }],
  isActive: {
    type: Boolean,
    default: false,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  socketId: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalTrips: {
    type: Number,
    default: 0,
  },
  todayEarnings: {
    type: Number,
    default: 0,
  },
  todayTrips: {
    type: Number,
    default: 0,
  },
  activeTrips: {
    type: Number,
    default: 0,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  // Document URLs
  drivingLicenseUrl: { type: String, default: null },
  aadharCardUrl: { type: String, default: null },
  vehicleRegistrationUrl: { type: String, default: null },
  insuranceUrl: { type: String, default: null },
  driverVehiclePhotoUrl: { type: String, default: null },
}, {
  timestamps: true,
});

// Create 2dsphere index for geospatial queries
agentSchema.index({ location: '2dsphere' });

const Agent = mongoose.model('Agent', agentSchema);

module.exports = { Agent };

